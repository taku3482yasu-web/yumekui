import { SIGHT } from '../core/canvas.js';
import { MAPS } from '../data/maps.js';
import { FOES } from '../data/units.js';
import { objectsOf } from '../core/field.js';
import { sprite } from './sprites.js';

export const TILE = 16;
const W = 320;
const H = 240;

const STARS = Array.from({ length: 70 }, (_, i) => ({
    x: (i * 97) % W,
    y: (i * 53) % H,
    phase: i * 0.7
}));

export function drawSky(ctx, time) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1b2a72');
    sky.addColorStop(0.5, '#141a52');
    sky.addColorStop(1, '#0a0c30');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    for (const star of STARS) {
        ctx.fillStyle = Math.sin(time / 500 + star.phase) > 0 ? '#dfe3ff' : '#7a80c0';
        ctx.fillRect(star.x, star.y, 1, 1);
    }
    // 空に浮かぶ海
    for (let band = 0; band < 3; band++) {
        ctx.fillStyle = ['#2f62a8', '#3f7cc0', '#62a4dc'][band];
        for (let x = 0; x < W; x += 2) {
            const y = 6 + band * 5 + Math.sin(x / 18 + time / 700 + band) * 3;
            ctx.fillRect(x, 0, 2, y);
        }
    }
}

const FLOORS = {
    water: ['#3d7c8c', '#35707f', '#55a0ac'],
    tempo: ['#8c5560', '#7f4c58', '#b0727c'],
    base: ['#5c6aa6', '#566399', '#6a79b8'],
    sun: ['#a8a04a', '#9c9442', '#c8bc5a']   // リクの夢: ひまわり畑
};

function drawTile(ctx, tile, x, y, open, theme) {
    if (tile === 'w') return;
    if (tile === 'C') {   // 崩れた階段 (夢筆で 描き直せる): 欠けた段と、すき間から 見える 空
        ctx.fillStyle = '#3a3a78';
        ctx.fillRect(x, y + 10, TILE, 6);
        ctx.fillStyle = '#8895cf';
        ctx.fillRect(x + 2, y + 12, 5, 2);
        ctx.fillRect(x + 10, y + 13, 4, 1);
        return;
    }
    if (tile === 'Y') {   // しおれた ひまわりの 壁 (開くと 消える)
        if (open) return drawTile(ctx, '.', x, y, false, theme);
        ctx.fillStyle = '#4a4420';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#7a6a2a';
        for (let i = 1; i < TILE; i += 5) ctx.fillRect(x + i, y + 2, 2, 14);
        ctx.fillStyle = '#a07a30';
        ctx.fillRect(x + 2, y + 4, 4, 3);
        ctx.fillRect(x + 9, y + 7, 4, 3);
        return;
    }
    if (tile === 'M') {
        ctx.fillStyle = '#231f4c';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#3a3478';
        ctx.fillRect(x + 4, y + 3, 8, 10);
        ctx.fillStyle = '#231f4c';
        ctx.fillRect(x + 5, y + 6, 2, 1);
        ctx.fillRect(x + 9, y + 6, 2, 1);
        ctx.fillRect(x + 6, y + 10, 4, 1);
        return;
    }
    if (tile === 'V') {
        // 夢の 裂け目: 底の 見えない 暗がりに 小さな 星
        ctx.fillStyle = '#0a0a1e';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#3a3a6a';
        ctx.fillRect(x, y, TILE, 2);
        ctx.fillStyle = '#8895cf';
        ctx.fillRect(x + 4, y + 8, 1, 1);
        ctx.fillRect(x + 11, y + 12, 1, 1);
        return;
    }
    const floor = FLOORS[theme ?? 'base'];
    ctx.fillStyle = (x / TILE + y / TILE) % 2 ? floor[0] : floor[1];
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = floor[2];
    ctx.fillRect(x, y + 15, TILE, 1);
    if (tile === 'B') {
        // 夢筆で かけた 橋 (裂け目の 上の 板)
        ctx.fillStyle = '#0a0a1e';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#a07a50';
        for (let i = 0; i < 4; i++) ctx.fillRect(x + 1, y + i * 4, TILE - 2, 3);
        ctx.fillStyle = '#6a4a32';
        ctx.fillRect(x, y, 1, TILE);
        ctx.fillRect(x + TILE - 1, y, 1, TILE);
    }
    if (tile === 's') {
        ctx.fillStyle = '#8895cf';
        for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 4, TILE, 2);
    }
    if ((tile === 'G' || tile === 'L' || tile === 'J') && !open) {
        ctx.fillStyle = '#20203a';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#b08be8';
        for (let i = 1; i < TILE; i += 5) ctx.fillRect(x + i, y, 2, TILE);
    }
}


// ---- 現実の町 (暖かい色: 夕焼け・木・砂) -----------------------------------
const REAL = {
    floor: ['#c9a27a', '#bf976e', '#a8805a'],      // 教室・家の 木の床
    corridor: ['#d8c8a8', '#cfbe9c', '#b8a684'],   // 廊下
    road: ['#9a8a80', '#928279', '#857469'],       // 坂道
    walk: ['#d8b890', '#cfae86', '#b89670'],       // 歩道・渡り廊下
    grass: ['#8fae6a', '#86a462', '#769454']
};

function checker(ctx, x, y, colors) {
    ctx.fillStyle = (x / TILE + y / TILE) % 2 ? colors[0] : colors[1];
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = colors[2];
    ctx.fillRect(x, y + 15, TILE, 1);
}

function drawRealTile(ctx, tile, x, y, time) {
    const box = (color, dx, dy, w, h) => { ctx.fillStyle = color; ctx.fillRect(x + dx, y + dy, w, h); };
    switch (tile) {
        case '.': return checker(ctx, x, y, REAL.floor);
        case 'c': return checker(ctx, x, y, REAL.corridor);
        case ',': return checker(ctx, x, y, REAL.road);
        case '_': case 'o': case 'm': checker(ctx, x, y, REAL.walk); if (tile === 'm') box('#7a4a3a', 2, 0, 12, 14); return;
        case 'g': checker(ctx, x, y, REAL.grass); box('#a8c880', 4, 5, 1, 2); box('#a8c880', 11, 10, 1, 2); return;
        case 's': checker(ctx, x, y, REAL.corridor); for (let i = 0; i < 4; i++) box('#9a8466', 0, i * 4 + 2, TILE, 1); return;
        case '#': box('#e8d8bc', 0, 0, TILE, TILE); box('#c8b494', 0, 12, TILE, 4); return;
        case 'b': box('#e8d8bc', 0, 0, TILE, TILE); box('#3f6a4f', 0, 3, TILE, 9); box('#5c8a6a', 0, 4, TILE, 1); return;
        case 'k': box('#e8d8bc', 0, 0, TILE, TILE); box('#9fc4dc', 2, 3, 12, 8); box('#e8d8bc', 7, 3, 2, 8); return;
        case 'd': checker(ctx, x, y, REAL.floor); box('#8a6a4a', 1, 2, 14, 9); box('#a8865e', 1, 2, 14, 2); box('#5c4630', 2, 11, 2, 4); box('#5c4630', 12, 11, 2, 4); return;
        case 'p': checker(ctx, x, y, REAL.floor); box('#20203a', 0, 2, TILE, 12); box('#e8ecf5', 0, 9, TILE, 3); return;
        case 'e': checker(ctx, x, y, REAL.floor); box('#8a6a4a', 7, 1, 2, 14); box('#f4ecdc', 3, 2, 10, 8); return;
        case 'f': checker(ctx, x, y, REAL.walk); box('#8a6a4a', 0, 6, TILE, 2); for (let i = 1; i < TILE; i += 5) box('#8a6a4a', i, 6, 2, 8); return;
        case 'x': box('#a8b878', 0, 0, TILE, TILE); box('#98a868', 3, 9, 2, 1); return;
        case 'T': box('#8fae6a', 0, 0, TILE, TILE); box('#4f7a44', 1, 0, 14, 11); box('#6a9a56', 3, 2, 6, 4); box('#6a4a32', 6, 11, 4, 5); return;
        case 'h': box('#d8b890', 0, 0, TILE, TILE); box('#c09a72', 0, 0, 1, TILE); return;
        case 'R': box('#b0574a', 0, 0, TILE, TILE); box('#8f4038', 0, 5, TILE, 1); box('#8f4038', 0, 11, TILE, 1); return;
        case 'n': box('#d8b890', 0, 0, TILE, TILE); box('#3f5a9a', 0, 0, TILE, 9); box('#e8ecf5', 4, 2, 8, 4); return;
        case '=': checker(ctx, x, y, REAL.walk); box('#e8ecf5', 0, 5, TILE, 2); box('#e8ecf5', 2, 5, 2, 9); box('#e8ecf5', 12, 5, 2, 9); return;
        case 't': checker(ctx, x, y, REAL.floor); box('#7a5a3e', 0, 3, TILE, 9); return;
        case 'w': {
            box('#4f86b8', 0, 0, TILE, TILE);
            const wave = Math.round(Math.sin(time / 600 + x / 30) * 2);
            box('#8fc0e0', 2 + wave, 5, 6, 1);
            box('#8fc0e0', 8 - wave, 11, 5, 1);
            return;
        }
        default: return checker(ctx, x, y, REAL.floor);
    }
}

// 時間帯の色: 朝は 淡い光、夕方は 橙、夜は 紺 (町は 暖かい色のまま、上から 重ねる)
const TINT = { morning: 'rgba(255, 236, 200, 0.14)', evening: 'rgba(240, 120, 60, 0.22)', night: 'rgba(16, 20, 70, 0.5)' };

// actors: ムービーに 出ている 人 ({ who, x, y }。朝の 通学路など)
// follower: 夢の中で ハルの後ろを ついてくる バク ({ sprite, x, y, fromX, fromY })
export function drawField(ctx, state, walk, time, actors = [], follower = null) {
    const map = MAPS[state.map];
    const rows = map.tiles.length;
    const cols = map.tiles[0].length;
    const px = (state.x - walk.dx * walk.left) * TILE;
    const py = (state.y - walk.dy * walk.left) * TILE;
    const worldW = cols * TILE;
    const worldH = rows * TILE;
    const camX = worldW <= W ? (worldW - W) / 2 : clamp(px + 8 - W / 2, 0, worldW - W);
    const camY = worldH <= H ? (worldH - H) / 2 : clamp(py + 8 - H / 2, 0, worldH - H);

    if (map.real) {
        ctx.fillStyle = map.indoor ? '#2a2030' : '#4f7a44';
        ctx.fillRect(0, 0, W, H);
    } else drawSky(ctx, time);
    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));
    // キャンバスの 段階 (state.sight): 1 は もやで 近くしか 見えない、2 は 地図だけ 見えて 物は 近くだけ、3 から 敵の 属性も
    const sight = !map.real && state.sight ? state.sight : null;
    const near = (x, y) => Math.abs(x - state.x) + Math.abs(y - state.y) <= SIGHT;
    map.tiles.forEach((row, y) => [...row].forEach((tile, x) => {
        if (sight?.fog && !near(x, y)) return;
        if (map.real) drawRealTile(ctx, tile, x * TILE, y * TILE, time);
        else {
            // 二重奏ホールは 左が 水 (ミオ)、右が トゲ (カナ)。左右の扉は それぞれの 合図で 開く
            const open = tile === 'L' ? state.flags.gateL : tile === 'J' ? state.flags.gateR : tile === 'Y' ? state.flags.rikuWall : state.flags.gateOpen;
            const theme = map.theme === 'duet' ? (x < map.split ? 'water' : 'tempo') : map.theme;
            drawTile(ctx, tile, x * TILE, y * TILE, open, theme);
        }
    }));
    for (const object of objectsOf(state)) {
        const always = ['wake', 'talk'].includes(object.kind);
        if (sight && (sight.fog || sight.nearObjects) && !always && !near(object.x, object.y)) continue;
        drawObject(ctx, object, time);
        if (sight?.attrs && object.kind === 'foe') drawAttr(ctx, object);
    }
    for (const actor of actors) drawObject(ctx, { kind: 'person', x: actor.x, y: actor.y, sprite: actor.who }, time);
    const behind = follower && follower.y <= state.y;   // バクが 上 (奥) にいるときは ハルより 先に 描く
    if (behind) drawFollower(ctx, follower, walk, time);
    drawHal(ctx, state, px, py, walk);
    if (follower && !behind) drawFollower(ctx, follower, walk, time);
    ctx.restore();
    if (sight?.nightmare) {
        ctx.fillStyle = 'rgba(120, 10, 40, 0.28)';   // 悪夢化: 絵の具が にじんで 赤黒い
        ctx.fillRect(0, 0, W, H);
    }
    const tint = map.real && (state.phase === 'night' ? TINT.night : state.phase === 'morning' ? TINT.morning : state.time === 'evening' ? TINT.evening : null);
    if (tint) {
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, W, H);
    }
}

const ATTR_COLORS = { 喜: '#ffd84a', 怒: '#ff7a6b', 哀: '#7fb2ff', 楽: '#7fe0a8' };

// 敵の 属性の しるし (キャンバスの 段階 3 から)
function drawAttr(ctx, object) {
    const attr = FOES[object.foe]?.attr;
    if (!attr) return;
    ctx.fillStyle = '#0d1030';
    ctx.fillRect(object.x * TILE + 11, object.y * TILE - 6, 6, 6);
    ctx.fillStyle = ATTR_COLORS[attr];
    ctx.fillRect(object.x * TILE + 12, object.y * TILE - 5, 4, 4);
}

// 動かない物 (看板・人・家具) は 上下に揺らさない
const STILL = ['talk', 'person', 'canvas', 'bed'];

function drawObject(ctx, object, time) {
    const name = object.sprite ?? FOES[object.foe]?.sprite;
    if (!name) return;   // 出口・戸口・通せんぼは 絵を 描かない (タイルで 見える)
    const image = sprite(name);
    const bob = STILL.includes(object.kind) ? 0 : Math.round(Math.sin(time / 300 + object.x) * 1.5);
    const x = object.x * TILE + (TILE - image.width) / 2;
    const y = object.y * TILE + TILE - image.height + bob;
    ctx.drawImage(image, Math.round(x), Math.round(y));
}

// バクは ハルが 前に いた マスへ、ハルと 同じ 速さで ついてくる
function drawFollower(ctx, f, walk, time) {
    const image = sprite(f.sprite);
    const x = (f.x - (f.x - f.fromX) * walk.left) * TILE + (TILE - image.width) / 2;
    const y = (f.y - (f.y - f.fromY) * walk.left) * TILE + TILE - image.height + Math.round(Math.sin(time / 260) * 1);
    ctx.drawImage(image, Math.round(x), Math.round(y));
}

function drawHal(ctx, state, px, py, walk) {
    const name = state.dir === 'up' ? 'hal-up' : state.dir === 'down' ? 'hal-down' : 'hal-side';
    const image = sprite(name);
    const bob = walk.left > 0 && walk.left < 0.5 ? 1 : 0;
    ctx.save();
    ctx.translate(Math.round(px) + 2, Math.round(py) - bob);
    if (state.dir === 'left') {
        ctx.translate(image.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(image, 0, 0);
    ctx.restore();
}

// バトルの 絵 (11/12 ユーザー指定):
//   ・始まりと コマンドを 選んでいる あいだは 全員を 見わたす 絵 (view.focus = null)。
//     左に 仲間 (前に 出ている 1 体を 大きく、控えは 後ろに 小さく)、右に 敵を 並べる
//   ・技や 攻撃の あいだは 仲間 1 体と 敵 1 体 (ねらった 敵) だけを 大きく 映す (view.focus = 敵の 番号)
export function drawBattle(ctx, view, time) {
    drawSky(ctx, time);
    if (view.focus == null) drawOverview(ctx, view, time);
    else drawCloseUp(ctx, view, time);

    for (const pop of view.pops) {
        const left = (pop.until - time) / 700;
        if (left <= 0) continue;
        const at = popAnchor(view, pop);
        ctx.fillStyle = pop.color;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pop.text, at.x, at.y - (1 - left) * 18);
    }
}

// 描いた 大きい 絵 (public/img)。読み込めるまでは ドット絵で 描く。faces = 絵の 向き
const HD_ART = {
    bak: { src: 'img/yumekui/bak.png', faces: 'left' },
    gakufume: { src: 'img/yumekui/gakufume.png', faces: 'front' }
};
const hdCache = new Map();
function hdArt(name) {
    const art = HD_ART[name];
    if (!art || typeof Image === 'undefined') return null;
    if (!hdCache.has(name)) {
        const image = new Image();
        image.src = art.src;
        hdCache.set(name, image);
    }
    const image = hdCache.get(name);
    return image.complete && image.naturalWidth ? { image, faces: art.faces } : null;
}

// 控えの 仲間 (前に 出ている 1 体 以外)
function benchOf(view) {
    return (view.party ?? []).filter((unit) => unit.sprite !== view.ally);
}

// 絵を 箱に 収まる 大きさに する。ドット絵は 0.5 きざみで 拡大 (most 倍まで)
function fit(image, maxW, maxH, pixel, most = 4) {
    const w = image.naturalWidth || image.width;
    const h = image.naturalHeight || image.height;
    let scale = Math.min(maxW / w, maxH / h, pixel ? most : 1);
    if (pixel && scale >= 1) scale = Math.floor(scale * 2) / 2;
    return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

function drawFloorShadow(ctx, x, y, rx, ry) {
    ctx.fillStyle = 'rgba(10, 12, 48, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

// 見わたす 絵: 全員を 小さめに
function drawOverview(ctx, view, time) {
    drawFloorShadow(ctx, 205, 132, 90, 16);
    drawFloorShadow(ctx, 62, 160, 60, 12);

    // 控えの 仲間: 後ろに 小さく、少し 暗く (倒れた 仲間は もっと 暗く)
    benchOf(view).forEach((unit, i) => {
        const image = sprite(unit.sprite);
        const size = fit(image, 36, 30, true, 2);
        ctx.save();
        ctx.globalAlpha = unit.hp > 0 ? 0.8 : 0.35;
        drawFloorShadow(ctx, 26 + i * 44, 98, 18, 4);
        ctx.drawImage(image, Math.round(26 + i * 44 - size.w / 2), 98 - size.h, size.w, size.h);
        ctx.restore();
    });

    // 敵: 1 体なら まん中、複数なら 横に 並べる (倒れた 敵は 消える)。ねらっている 敵の 下に 印
    // ボスの 登場 (view.roar): 体を ふるわせながら ぐっと 迫ってきて、元に 戻る
    const roar = view.roar && time < view.roar.until ? (time - view.roar.start) / (view.roar.until - view.roar.start) : null;
    const lunge = roar === null ? 0 : Math.sin(Math.max(0, roar) * Math.PI);
    view.foes.forEach((name, i) => {
        if (view.down[i]) return;
        const foe = sprite(name);
        const many = view.foes.length > 1;
        const tall = foe.height > 26;   // 背の高い ボス (トゲメトロなど) は 1 段 小さく 描いて 画面に 収める
        const scale = foe.width >= 64 ? (many ? 1.1 : 1.5) : many ? (tall ? 2 : 3) : tall ? 3 : 4;
        const big = scale * (1 + lunge * 0.18);
        const shake = (view.foeHit[i] > time ? Math.sin(time / 20) * 4 : 0) + Math.sin(time / 15) * 5 * lunge;
        const y = 130 - foe.height * big + Math.sin(time / 500 + i) * 2;
        ctx.drawImage(foe, Math.round(foeX(view, i) - (foe.width * big) / 2 + shake), Math.round(y), foe.width * big, foe.height * big);
        if (many && i === view.target) {
            const x = Math.round(foeX(view, i));
            ctx.fillStyle = '#ffc95e';
            ctx.beginPath();
            ctx.moveTo(x - 4, 136);
            ctx.lineTo(x + 4, 136);
            ctx.lineTo(x, 141);
            ctx.fill();
        }
    });

    // 前に 出ている 仲間: 手前の 左。敵と 重ならない 幅に 収める
    const ally = sprite(view.ally);
    const size = fit(ally, 84, 72, true);
    const shake = view.allyHit > time ? Math.sin(time / 20) * 4 : 0;
    ctx.drawImage(ally, Math.round(20 + shake), 166 - size.h, size.w, size.h);
}

// 寄った 絵: 仲間 1 体 (左) と 敵 1 体 (右) を 大きく
function drawCloseUp(ctx, view, time) {
    drawFloorShadow(ctx, 236, 140, 70, 12);
    drawFloorShadow(ctx, 80, 168, 66, 12);

    const i = view.focus;
    if (!view.down[i] && view.foes[i]) {
        const hd = hdArt(view.foes[i]);
        const image = hd?.image ?? sprite(view.foes[i]);
        const size = fit(image, 150, 116, !hd, 6);
        const shake = view.foeHit[i] > time ? Math.sin(time / 20) * 4 : 0;
        const y = 138 - size.h + Math.sin(time / 500 + i) * 2;
        ctx.drawImage(image, Math.round(236 - size.w / 2 + shake), Math.round(y), size.w, size.h);
    }

    const hd = hdArt(view.ally);
    const image = hd?.image ?? sprite(view.ally);
    const size = fit(image, 140, 110, !hd, 6);
    const shake = view.allyHit > time ? Math.sin(time / 20) * 4 : 0;
    const x = Math.round(80 - size.w / 2 + shake);
    const y = 166 - size.h;
    ctx.save();
    if (hd?.faces === 'left') {   // 仲間は 右 (敵の ほう) を 向く
        ctx.translate(x + size.w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(image, 0, y, size.w, size.h);
    } else ctx.drawImage(image, x, y, size.w, size.h);
    ctx.restore();
}

// 数字の 出る 場所 (仲間か 敵か と、今の 絵で 決める)。pop.foe = 敵の 番号 (仲間なら 無し)
function popAnchor(view, pop) {
    if (pop.foe == null) return view.focus == null ? { x: 62, y: 92 } : { x: 80, y: 70 };
    if (view.focus == null) return { x: foeX(view, pop.foe), y: pop.high ? 40 : 60 };
    return { x: 236, y: pop.high ? 22 : 40 };
}

// 敵の 横の 位置 (1 体なら 205、複数なら 並べる)
export function foeX(view, i) {
    const n = view.foes.length;
    if (n === 1) return 205;
    const span = Math.min(150, 60 * (n - 1));
    return 205 - span / 2 + (span * i) / (n - 1);
}

export function drawShadow(ctx, time) {
    drawSky(ctx, time);
    ctx.fillStyle = 'rgba(5, 6, 20, 0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#05050f';
    ctx.beginPath();
    ctx.ellipse(160, 74, 44, 52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(40, H);
    ctx.quadraticCurveTo(70, 120, 160, 112);
    ctx.quadraticCurveTo(250, 120, 280, H);
    ctx.fill();
}

export function drawMorning(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#f7d9b0');
    sky.addColorStop(1, '#f2a78d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
}

function clamp(value, low, high) {
    return Math.min(high, Math.max(low, value));
}
