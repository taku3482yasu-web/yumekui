// 現実の 町の タイル (2026-11-13 ユーザー指定: 地図・家の つくりに 重厚感を)
// 1 マス 16 ドット。となりの タイルを 見て、壁の 厚み (上から 見た 天面と 正面)・屋根の 棟と 軒・
// 壁ぎわの 影・木の 大きな 葉・床板の 目地 などを 描き分ける。光は 左上から。
// 動かない ものは 地図ごとに 1 枚の 絵に して とっておき (cacheOf)、海だけ 毎回 描く。
const TILE = 16;

// 壁の なかま (上に 立つと 影が 落ちる・南が 壁なら 天面に なる)
const WALLISH = new Set(['#', 'b', 'k', 'h', 'n', 'R', 'H', 'U', 'z', 'O', 'D', 'm']);
const INNER_WALL = new Set(['#', 'b', 'k']);
const ROOFS = { R: ['#a85a48', '#94503f', '#7e4234', '#c47a64', '#4e2e26', '#7e4a3c', '#5e3428'], H: ['#4a78b8', '#3e68a4', '#30548a', '#6a98d0', '#22385e', '#4a6a9a', '#263e66'], U: ['#7a7e8c', '#6c707e', '#5a5e6a', '#9a9eac', '#3a3c46', '#5e606c', '#40424c'] };
const isRoof = (c) => Boolean(ROOFS[c]);

// 位置から 決まる 乱数 (毎回 同じ 絵に なる)
function hash(x, y, k = 0) {
    let n = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function make(ctx, ox, oy) {
    const box = (color, dx, dy, w, h) => { ctx.fillStyle = color; ctx.fillRect(ox + dx, oy + dy, w, h); };
    return box;
}

// ---- 床 --------------------------------------------------------------------
function woodFloor(box, tx, ty) {
    // 横向きの 床板 (4 ドット幅)。継ぎ目は 段ごとに ずらす
    for (let r = 0; r < 4; r++) {
        const shade = hash(tx, ty, r) < 0.33 ? '#c29a72' : hash(tx, ty, r + 9) < 0.5 ? '#caa47c' : '#bf966c';
        box(shade, 0, r * 4, TILE, 4);
        box('#a47e58', 0, r * 4 + 3, TILE, 1);
        const seam = Math.floor(hash(tx + r, ty, 3) * 12) + 2;
        if ((tx + r + ty) % 2 === 0) box('#9a7450', seam, r * 4, 1, 3);
        if (hash(tx, ty, r + 20) < 0.4) box('#b38a62', Math.floor(hash(tx, ty, r + 30) * 12) + 2, r * 4 + 1, 3, 1);   // 木目
    }
}

function corridor(box, tx, ty) {
    // みがいた 廊下: 大きな タイルと 光の すじ
    box('#d8cbae', 0, 0, TILE, TILE);
    box('#cdbf9f', 8, 0, 8, 8);
    box('#cdbf9f', 0, 8, 8, 8);
    box('#bfb090', 0, 15, TILE, 1);
    box('#bfb090', 15, 0, 1, TILE);
    if ((tx + ty) % 3 === 0) box('#e8dec8', 2, 3, 5, 1);
}

function road(box, tx, ty, at) {
    box('#8e8690', 0, 0, TILE, TILE);
    for (let k = 0; k < 6; k++) box(hash(tx, ty, k) < 0.5 ? '#9a929c' : '#7e7682', Math.floor(hash(tx, ty, k + 7) * 15), Math.floor(hash(tx, ty, k + 14) * 15), 1, 1);
    // 道の 端は 縁石
    if (at(-1, 0) !== ',') { box('#c8c0b8', 0, 0, 2, TILE); box('#6e6672', 2, 0, 1, TILE); }
    if (at(1, 0) !== ',') { box('#c8c0b8', 14, 0, 2, TILE); box('#6e6672', 13, 0, 1, TILE); }
    // 広い 道の まん中に 白い 破線、端 (校門の 前) に 横断歩道
    let left = 0;
    let right = 0;
    while (at(-left - 1, 0) === ',') left++;
    while (at(right + 1, 0) === ',') right++;
    const across = at(0, -1) !== ',' && at(0, -1) !== null;
    if (left + right >= 5 && left - right === 1 && !across && ty % 2 === 0) box('#e8e4dc', 0, 3, 1, 9);
    if (left + right >= 5 && across) for (let x = 1; x < TILE; x += 4) box('#e8e4dc', x, 3, 2, 11);
    if (hash(tx, ty, 40) < 0.012 && !across) { box('#5e5866', 4, 4, 8, 8); box('#76707e', 5, 5, 6, 6); box('#5e5866', 5, 8, 6, 1); }   // マンホール
    if (hash(tx, ty, 41) < 0.08) box('#746c78', Math.floor(hash(tx, ty, 42) * 10) + 2, 6, 5, 1);   // ひび
}

function paving(box, tx, ty) {
    // 歩道の 敷石 (8 ドット角)。ふちを 明るく・暗く
    for (let j = 0; j < 2; j++) {
        for (let i = 0; i < 2; i++) {
            const c = hash(tx * 2 + i, ty * 2 + j) < 0.5 ? '#d6b892' : '#ccad86';
            box(c, i * 8, j * 8, 8, 8);
            box('#e4cca8', i * 8, j * 8, 7, 1);
            box('#a88a66', i * 8 + 7, j * 8, 1, 8);
            box('#a88a66', i * 8, j * 8 + 7, 8, 1);
        }
    }
}

function grass(box, tx, ty) {
    box('#86a85e', 0, 0, TILE, TILE);
    for (let k = 0; k < 5; k++) box(hash(tx, ty, k) < 0.5 ? '#7a9c54' : '#92b46a', Math.floor(hash(tx, ty, k + 5) * 14), Math.floor(hash(tx, ty, k + 10) * 14), 3, 2);
    // 草の 房 (V の 形)
    for (let k = 0; k < 3; k++) {
        const x = Math.floor(hash(tx, ty, k + 20) * 12) + 1;
        const y = Math.floor(hash(tx, ty, k + 25) * 11) + 3;
        box('#5e8044', x, y, 1, 2);
        box('#5e8044', x + 2, y, 1, 2);
        box('#a8c87c', x + 1, y - 1, 1, 3);
    }
    if (hash(tx, ty, 50) < 0.12) { const x = Math.floor(hash(tx, ty, 51) * 12) + 2; box(hash(tx, ty, 52) < 0.5 ? '#f4e8a0' : '#f0b0c0', x, 4, 2, 2); box('#e8c040', x, 4, 1, 1); }
}

function dirt(box, tx, ty) {
    box('#c6ac84', 0, 0, TILE, TILE);
    for (let k = 0; k < 5; k++) box(hash(tx, ty, k) < 0.5 ? '#b89c74' : '#d4bc96', Math.floor(hash(tx, ty, k + 5) * 15), Math.floor(hash(tx, ty, k + 10) * 15), 2, 1);
}

// 壁ぎわの 影: 北や 西が 壁なら 床に 影を 落とす
function contactShadow(box, at) {
    const n = at(0, -1);
    const w = at(-1, 0);
    if (n && (WALLISH.has(n) || n === 'T')) {
        box('rgba(30, 20, 40, 0.34)', 0, 0, TILE, 2);
        box('rgba(30, 20, 40, 0.18)', 0, 2, TILE, 3);
    }
    if (w && WALLISH.has(w)) box('rgba(30, 20, 40, 0.2)', 0, 0, 2, TILE);
}

// ---- 壁 --------------------------------------------------------------------
// 南も 壁なら「天面」(上から 見た 壁の 厚み)、南が 床なら「正面」
function wallTop(box, at) {
    box('#4a3a48', 0, 0, TILE, TILE);
    box('#5c4a58', 1, 1, TILE - 2, TILE - 2);
    // となりが 壁で なければ ふちを 明るく
    if (!INNER_WALL.has(at(0, -1) ?? '#')) box('#7a6676', 0, 0, TILE, 1);
    if (!INNER_WALL.has(at(-1, 0) ?? '#')) box('#7a6676', 0, 0, 1, TILE);
    if (!INNER_WALL.has(at(1, 0) ?? '#')) box('#3a2c38', 15, 0, 1, TILE);
}

function wallFront(box) {
    box('#4a3a48', 0, 0, TILE, 3);        // 天面の ふち
    box('#7a6676', 0, 0, TILE, 1);
    box('#efe2c6', 0, 3, TILE, 8);        // しっくい
    box('#e0d0b0', 0, 9, TILE, 2);
    box('#a07a54', 0, 11, TILE, 4);       // 腰板
    box('#b88e64', 0, 11, TILE, 1);
    box('#6e5038', 0, 15, TILE, 1);       // 巾木
}

function isWallBelow(at) {
    const s = at(0, 1);
    return s === null || INNER_WALL.has(s) || s === 'x';
}

function blackboard(box, tx, ty) {
    wallFront(box);
    box('#6e5038', 0, 3, TILE, 9);
    box('#2f5a46', 0, 4, TILE, 7);
    box('#3a6a54', 0, 4, TILE, 1);
    // チョークの 字 (場所で 決まる)
    for (let k = 0; k < 3; k++) if (hash(tx, ty, k) < 0.55) box('#d8e4dc', Math.floor(hash(tx, ty, k + 3) * 10) + 1, 5 + k * 2, Math.floor(hash(tx, ty, k + 6) * 5) + 2, 1);
    box('#8a6a4a', 0, 11, TILE, 1);        // チョーク置き
    if (hash(tx, ty, 9) < 0.3) box('#f4f4f4', 6, 10, 2, 1);
}

function windowTile(box) {
    wallFront(box);
    box('#e8e8f0', 1, 3, 14, 9);           // わく
    const glass = ['#a8d0ec', '#9cc6e6', '#8cbcde', '#80b2d6'];
    for (let r = 0; r < 4; r++) box(glass[r], 2, 4 + r * 2, 12, 2);
    box('#e8e8f0', 7, 3, 2, 9);
    box('#ffffff', 3, 5, 2, 1);            // 光の 反射
    box('#ffffff', 10, 5, 1, 2);
    box('#c8c0b4', 0, 12, TILE, 1);        // 窓台
}

// 家の 外壁: 横板 と 土台。両はしに 柱
function houseWall(box, at, tx, ty) {
    box('#d9bf98', 0, 0, TILE, TILE);
    for (let r = 0; r < 4; r++) {
        box(r % 2 ? '#d0b48c' : '#dcc29c', 0, r * 4, TILE, 3);
        box('#b49670', 0, r * 4 + 3, TILE, 1);
    }
    const near = (c) => c === 'h' || c === 'k' || c === 'n' || c === 'm' || c === 'z';
    if (!near(at(-1, 0))) box('#7a5a3e', 0, 0, 2, TILE);
    if (!near(at(1, 0))) box('#5e4430', 14, 0, 2, TILE);
    if (!near(at(0, 1)) && at(0, 1) !== null) { box('#8a8478', 0, 13, TILE, 3); box('#a8a296', 0, 13, TILE, 1); }   // 石の 土台
    if (isRoof(at(0, -1))) box('rgba(30, 20, 30, 0.35)', 0, 0, TILE, 3);   // 軒の 影
}

function houseWindow(box, at, tx, ty) {
    houseWall(box, at, tx, ty);
    box('#5e4430', 2, 3, 12, 9);
    box('#e8dcc0', 3, 4, 10, 7);           // 障子の 明かり
    box('#c8b898', 3, 7, 10, 1);
    box('#c8b898', 7, 4, 1, 7);
    box('#f4ecd8', 4, 5, 2, 1);
    box('#5e4430', 1, 12, 14, 1);          // 窓の 下の 板
}

function noren(box, at, tx, ty) {
    houseWall(box, at, tx, ty);
    box('#3a2a20', 0, 0, TILE, 2);         // のれんの 棒
    box('#34508c', 0, 2, TILE, 9);
    box('#2a4074', 7, 2, 2, 9);            // 割れ目
    box('#e8ecf5', 3, 5, 3, 3);            // 白い 紋
    box('#e8ecf5', 10, 5, 3, 3);
    box('#2a4074', 0, 10, TILE, 1);
}

function door(box, at) {
    const inHouse = ['h', 'k', 'n'].includes(at(-1, 0)) || ['h', 'k', 'n'].includes(at(1, 0)) || isRoof(at(0, -1)) || at(0, -1) === 'h';
    if (INNER_WALL.has(at(-1, 0)) || INNER_WALL.has(at(1, 0))) {
        // 家の 中の 戸口 (壁の 切れ目): 床の 色で 抜く
        box('#4a3a48', 0, 0, TILE, 3);
        box('#8a6a4a', 0, 3, TILE, 13);
        box('#a8865e', 1, 4, 14, 12);
        box('#6e5038', 7, 4, 2, 12);
        box('#d8c098', 3, 9, 2, 1);
        return;
    }
    if (inHouse) {
        // 引き戸: 木の わくに すりガラス
        box('#5e4430', 0, 0, TILE, TILE);
        box('#7a5a3e', 1, 1, 6, 15);
        box('#7a5a3e', 9, 1, 6, 15);
        box('#d8d4c8', 2, 2, 4, 8);
        box('#d8d4c8', 10, 2, 4, 8);
        box('#b8b4a8', 2, 6, 4, 1);
        box('#b8b4a8', 10, 6, 4, 1);
        box('#3a2a20', 7, 0, 2, TILE);
        return;
    }
    // 門 (歩道の 上): 石畳
    paving(box, 0, 0);
    box('#7a4a3a', 2, 0, 12, 14);
    box('#9a5e48', 3, 1, 10, 12);
    box('#5e3428', 7, 1, 2, 12);
}

// 瓦屋根: 段ごとの 瓦と 継ぎ目。北の はしは 棟、南の はしは 軒
function roof(box, at, tx, ty, kind = 'R') {
    const c = ROOFS[kind];
    const base = [c[0], c[1], c[2]];
    const same = (t) => t === kind;
    for (let r = 0; r < 4; r++) {
        box(base[0], 0, r * 4, TILE, 3);
        box(base[2], 0, r * 4 + 3, TILE, 1);
        for (let i = (r % 2) * 2; i < TILE; i += 4) box(base[1], i, r * 4, 1, 3);   // 瓦の 継ぎ目
        box(c[3], 0, r * 4, TILE, 1);   // 瓦の 丸みの 光
    }
    if (!same(at(0, -1))) { box(c[4], 0, 0, TILE, 3); box(c[5], 0, 0, TILE, 1); }   // 棟
    if (!same(at(0, 1))) { box(c[6], 0, 13, TILE, 2); box('#2e1c18', 0, 15, TILE, 1); }  // 軒
    if (!same(at(-1, 0))) box(c[2], 0, 0, 2, TILE);
    if (!same(at(1, 0))) box(c[4], 14, 0, 2, TILE);
}

// 木: 大きな 丸い 葉 (マスの 上に はみ出す) と 幹。並ぶと 森に なる
function tree(box, at, tx, ty) {
    grass(box, tx, ty);
    box('rgba(20, 40, 20, 0.35)', 2, 12, 12, 3);   // 根もとの 影
    box('#5a3e2a', 6, 9, 4, 6);
    box('#76543a', 6, 9, 1, 6);
    const dy = -4 + Math.floor(hash(tx, ty, 1) * 2);
    const leaf = hash(tx, ty, 2) < 0.5 ? ['#2e5a34', '#3e7a42', '#58985a', '#7ab86e'] : ['#2a5430', '#3a723e', '#4e8c50', '#6eac64'];
    // 輪郭 → 濃い 葉 → 明るい 葉 → 光
    box('#1e3a24', 1, dy + 2, 14, 10);
    box('#1e3a24', 3, dy, 10, 14);
    box(leaf[0], 2, dy + 2, 12, 10);
    box(leaf[0], 4, dy + 1, 8, 12);
    box(leaf[1], 3, dy + 2, 9, 8);
    box(leaf[1], 5, dy + 1, 6, 10);
    box(leaf[2], 4, dy + 3, 6, 4);
    box(leaf[3], 5, dy + 3, 2, 2);
    box(leaf[2], 9, dy + 7, 3, 2);
    box(leaf[0], 10, dy + 9, 3, 2);
}

function fence(box, tx, ty) {
    paving(box, tx, ty);
    box('rgba(30, 20, 40, 0.25)', 0, 13, TILE, 2);
    box('#f2f2f6', 0, 5, TILE, 2);
    box('#f2f2f6', 0, 10, TILE, 2);
    box('#c6c9d6', 0, 6, TILE, 1);
    box('#c6c9d6', 0, 11, TILE, 1);
    for (const x of [2, 11]) { box('#f2f2f6', x, 3, 3, 11); box('#c6c9d6', x + 2, 3, 1, 11); box('#ffffff', x, 3, 3, 1); }
}

function railing(box, tx, ty) {
    paving(box, tx, ty);
    box('rgba(30, 20, 40, 0.25)', 0, 12, TILE, 3);
    box('#8a8ea8', 0, 5, TILE, 2);
    box('#c6c9e0', 0, 5, TILE, 1);
    for (let x = 1; x < TILE; x += 5) box('#6e7290', x, 7, 1, 7);
}

function stairs(box, tx, ty) {
    for (let i = 0; i < 4; i++) {
        box('#d8c8a8', 0, i * 4, TILE, 3);
        box('#a89676', 0, i * 4 + 3, TILE, 1);
        box('#e8dcc4', 0, i * 4, TILE, 1);
    }
    box('#8a7a5c', 0, 0, 2, TILE);
    box('#8a7a5c', 14, 0, 2, TILE);
}

function desk(box, tx, ty, at) {
    woodFloor(box, tx, ty);
    box('rgba(30, 20, 40, 0.28)', 2, 12, 13, 3);
    box('#5e4430', 2, 9, 2, 5);            // 脚
    box('#5e4430', 12, 9, 2, 5);
    box('#8a6a4a', 1, 2, 14, 8);           // 天板
    box('#b8956a', 1, 2, 14, 2);
    box('#6e5038', 1, 9, 14, 1);
    if (at(1, 0) === 'd') box('#6e5038', 15, 2, 1, 8);   // となりの 机との すき間
}

function piano(box, tx, ty, at) {
    woodFloor(box, tx, ty);
    box('rgba(20, 10, 30, 0.35)', 0, 12, TILE, 3);
    const left = at(-1, 0) !== 'p';
    const right = at(1, 0) !== 'p';
    // 黒い 体: 左は 丸く、右は 鍵盤
    box('#14121e', left ? 2 : 0, 2, left ? 14 : right ? 14 : 16, 10);
    box('#2a2838', left ? 3 : 0, 3, left ? 12 : right ? 12 : 16, 2);
    if (left) { box('#14121e', 1, 4, 1, 6); box('#3a3850', 4, 4, 6, 1); }
    if (right) {
        box('#f4f4f4', 0, 8, 13, 3);
        for (let x = 1; x < 13; x += 2) box('#14121e', x, 8, 1, 2);
        box('#14121e', 13, 2, 2, 10);
    }
    box('#5a5a6a', left ? 4 : 2, 12, 2, 2);   // 脚
}

function easel(box, tx, ty) {
    woodFloor(box, tx, ty);
    box('rgba(30, 20, 40, 0.25)', 3, 13, 10, 2);
    box('#7a5a3e', 7, 1, 2, 14);
    box('#7a5a3e', 3, 12, 2, 3);
    box('#7a5a3e', 11, 12, 2, 3);
    box('#f8f2e4', 3, 2, 10, 8);
    box('#d8d0bc', 12, 2, 1, 8);
    box('#7a5a3e', 2, 10, 12, 1);
    if ((tx + ty) % 2) { box('#8ac0e8', 4, 4, 5, 3); box('#f0c070', 8, 6, 3, 2); }
}

function table(box, tx, ty, at) {
    woodFloor(box, tx, ty);
    const n = at(0, -1) === 't';
    const s = at(0, 1) === 't';
    const w = at(-1, 0) === 't';
    const e = at(1, 0) === 't';
    box('#7a5a3e', w ? 0 : 1, n ? 0 : 2, 16 - (w ? 0 : 1) - (e ? 0 : 1), 16 - (n ? 0 : 2) - (s ? 0 : 3));
    if (!n) box('#a07a54', w ? 0 : 1, 2, 16 - (w ? 0 : 1) - (e ? 0 : 1), 1);
    if (!s) { box('#5a3e2a', w ? 0 : 1, 12, 16 - (w ? 0 : 1) - (e ? 0 : 1), 1); box('rgba(30, 20, 40, 0.3)', 0, 13, TILE, 3); }
}

function schoolyard(box, tx, ty) {
    dirt(box, tx, ty);
    if (ty % 5 === 2) box('#eae2d0', 0, 7, TILE, 1);   // 校庭の 白線
}

// 天文台: O = 白い ドーム、D = ドームの まん中の 開く すき間、Q = 外の 望遠鏡 (三脚に 筒)
function dome(box, at, slit) {
    box('#d8dde8', 0, 0, TILE, TILE);
    box('#eef1f7', 0, 0, TILE, 2);
    for (let x = 3; x < TILE; x += 5) box('#c4cad8', x, 0, 1, TILE);
    if (at(0, 1) !== 'O' && at(0, 1) !== 'D') box('#a8aebc', 0, 13, TILE, 3);
    if (slit) { box('#2a2f5a', 5, 0, 6, TILE); box('#59609a', 6, 0, 1, TILE); box('#ffe08a', 8, 4, 1, 1); }
}

function telescope(box, tx, ty) {
    paving(box, tx, ty);
    box('rgba(30, 20, 40, 0.3)', 3, 13, 10, 2);
    box('#3a3a50', 7, 8, 2, 7);
    box('#3a3a50', 4, 13, 2, 2);
    box('#3a3a50', 10, 13, 2, 2);
    box('#2f4a7d', 2, 3, 11, 4);
    box('#4a6aa8', 2, 3, 11, 1);
    box('#c6c9ea', 12, 3, 2, 4);
}

// ---- 広げた 町の 小物 (11/13) ----------------------------------------------
// 下の 地面: となりで 多い ほう (歩道か 草)
function groundOf(box, at, tx, ty) {
    const around = [at(-1, 0), at(1, 0), at(0, 1), at(0, -1)];
    if (around.includes('_') || around.includes(',')) paving(box, tx, ty);
    else grass(box, tx, ty);
}

function postbox(box, at, tx, ty) {
    groundOf(box, at, tx, ty);
    box('rgba(30, 20, 40, 0.3)', 3, 13, 10, 2);
    box('#5a5a68', 7, 10, 2, 4);
    box('#d83a34', 4, 1, 8, 10);
    box('#f05a50', 4, 1, 8, 2);
    box('#a82a28', 10, 3, 2, 8);
    box('#2a1a1a', 5, 4, 6, 1);   // 投函口
    box('#f4f4f4', 6, 6, 4, 2);
}

function pole(box, at, tx, ty) {
    groundOf(box, at, tx, ty);
    box('rgba(30, 20, 40, 0.3)', 6, 13, 7, 2);
    box('#8a8478', 6, -6, 4, 20);
    box('#a8a296', 6, -6, 1, 20);
    box('#5e5a52', 3, -4, 10, 2);   // 腕木
    box('#2a2830', 0, -3, TILE, 1);   // 電線
}

function vending(box, tx, ty) {
    paving(box, tx, ty);
    box('rgba(30, 20, 40, 0.3)', 1, 13, 15, 3);
    box('#e8ecf4', 1, -4, 14, 17);
    box('#c8ccd8', 13, -4, 2, 17);
    box('#3a6ab8', 2, -3, 11, 7);
    for (let i = 0; i < 4; i++) box(['#e85a50', '#f0c040', '#60b070', '#f4f4f4'][(i + tx) % 4], 3 + i * 3, -1, 2, 3);
    box('#2a2a38', 3, 8, 7, 2);
    box('#ffe08a', 11, 6, 2, 1);
}

function flowerbed(box, tx, ty) {
    box('#8a6a4a', 0, 4, TILE, 12);
    box('#a8865e', 0, 4, TILE, 2);
    box('#6a4a32', 1, 6, 14, 9);
    for (let i = 0; i < 4; i++) {
        const x = 2 + i * 3 + (ty % 2);
        box('#4e8a44', x, 8, 1, 5);
        box(['#f05a7a', '#ffd86b', '#f4f4f4', '#b07ae0'][(i + tx) % 4], x - 1, 6, 3, 3);
    }
}

function bench(box, tx, ty, at) {
    grass(box, tx, ty);
    box('rgba(30, 20, 40, 0.3)', 0, 12, TILE, 3);
    const l = at(-1, 0) === 'P';
    const r = at(1, 0) === 'P';
    box('#8a5a32', l ? 0 : 1, 3, 16 - (l ? 0 : 1) - (r ? 0 : 1), 3);   // せもたれ
    box('#a87a4a', l ? 0 : 1, 7, 16 - (l ? 0 : 1) - (r ? 0 : 1), 3);   // 座面
    box('#c89a62', l ? 0 : 1, 7, 16 - (l ? 0 : 1) - (r ? 0 : 1), 1);
    if (!l) box('#4a4a58', 2, 10, 2, 4);
    if (!r) box('#4a4a58', 12, 10, 2, 4);
}

function sand(box, tx, ty) {
    box('#e8d4a4', 0, 0, TILE, TILE);
    for (let k = 0; k < 6; k++) box(hash(tx, ty, k) < 0.5 ? '#d8c08a' : '#f4e4bc', Math.floor(hash(tx, ty, k + 5) * 15), Math.floor(hash(tx, ty, k + 10) * 15), 2, 1);
}

function sink(box, tx, ty, at) {
    woodFloor(box, tx, ty);
    box('#c8ccd4', 0, 1, TILE, 11);
    box('#e8ecf2', 0, 1, TILE, 2);
    box('#9aa0ac', 0, 11, TILE, 1);
    box('#6a5a4a', 0, 12, TILE, 3);   // 下の 戸棚
    if (at(1, 0) !== 'K') { box('#8a9098', 3, 4, 8, 5); box('#5a6068', 4, 5, 6, 3); box('#b8bcc4', 12, 2, 1, 4); }   // 流し と 蛇口
    else { box('#3a3a44', 4, 4, 8, 4); box('#e85a3a', 6, 5, 2, 2); }   // コンロ
}

// 海 (毎回 描く): 岸に 近いと 白い 波
export function drawSea(ctx, tiles, tx, ty, time) {
    const box = make(ctx, tx * TILE, ty * TILE);
    const at = (dx, dy) => tiles[ty + dy]?.[tx + dx] ?? null;
    box('#3f78b0', 0, 0, TILE, TILE);
    box('#4a86bc', 0, 0, TILE, 8);
    const wave = Math.round(Math.sin(time / 600 + tx * 0.9 + ty) * 2);
    box('#8fc0e0', 2 + wave, 5, 6, 1);
    box('#8fc0e0', 8 - wave, 11, 5, 1);
    const foam = Math.round((Math.sin(time / 500 + tx) + 1) * 1.5);
    if (at(0, -1) && at(0, -1) !== 'w') box('#e8f4fc', 0, 0, TILE, 1 + foam);
    if (at(-1, 0) && at(-1, 0) !== 'w') box('#e8f4fc', 0, 0, 1 + foam, TILE);
    if (at(1, 0) && at(1, 0) !== 'w') box('#e8f4fc', TILE - 1 - foam, 0, 1 + foam, TILE);
}

export function drawRealTile(ctx, tiles, tx, ty) {
    const tile = tiles[ty][tx];
    const box = make(ctx, tx * TILE, ty * TILE);
    const at = (dx, dy) => tiles[ty + dy]?.[tx + dx] ?? null;
    switch (tile) {
        case '.': woodFloor(box, tx, ty); break;
        case 'c': corridor(box, tx, ty); break;
        case ',': road(box, tx, ty, at); break;
        case '_': paving(box, tx, ty); break;
        case 'o': corridor(box, tx, ty); box('#b8a888', 0, 7, TILE, 1); break;   // 渡り廊下
        case 'm': door(box, at); return;
        case 'g': grass(box, tx, ty); break;
        case 's': stairs(box, tx, ty); return;
        case '#': if (isWallBelow(at)) wallTop(box, at); else wallFront(box); return;
        case 'b': blackboard(box, tx, ty); return;
        case 'k': if (at(0, -1) === 'h' || at(-1, 0) === 'h' || at(1, 0) === 'h') houseWindow(box, at, tx, ty); else windowTile(box); return;
        case 'd': desk(box, tx, ty, at); break;
        case 'p': piano(box, tx, ty, at); return;
        case 'e': easel(box, tx, ty); return;
        case 'f': railing(box, tx, ty); return;
        case 'x': schoolyard(box, tx, ty); return;
        case 'T': tree(box, at, tx, ty); return;
        case 'h': houseWall(box, at, tx, ty); return;
        case 'R': case 'H': case 'U': roof(box, at, tx, ty, tile); return;
        case 'z': houseWall(box, at, tx, ty); door(box, at); return;
        case 'u': postbox(box, at, tx, ty); return;
        case 'y': pole(box, at, tx, ty); return;
        case 'v': vending(box, tx, ty); return;
        case 'F': flowerbed(box, tx, ty); return;
        case 'P': bench(box, tx, ty, at); return;
        case 'A': sand(box, tx, ty); break;
        case 'K': sink(box, tx, ty, at); return;
        case 'n': noren(box, at, tx, ty); return;
        case '=': fence(box, tx, ty); return;
        case 't': table(box, tx, ty, at); break;
        case 'O': dome(box, at, false); return;
        case 'D': dome(box, at, true); return;
        case 'Q': telescope(box, tx, ty); return;
        case 'w': return;   // 海は drawSea で 毎回
        default: woodFloor(box, tx, ty);
    }
    contactShadow(box, at);
}

// 地図ごとの 動かない 絵 (木の 葉は となりの マスへ はみ出すので、上の 行から 順に 描く)
const cache = new Map();
export function cacheOf(map) {
    if (cache.has(map.id)) return cache.get(map.id);
    const rows = map.tiles.length;
    const cols = map.tiles[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = cols * TILE;
    canvas.height = rows * TILE;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) drawRealTile(ctx, map.tiles, x, y);
    const sea = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (map.tiles[y][x] === 'w') sea.push([x, y]);
    const entry = { canvas, sea };
    cache.set(map.id, entry);
    return entry;
}
