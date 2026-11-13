// ハルの部屋の キャンバス (イーゼルに 白い 布) と ベッド (2026-11-13 ユーザー指定で 描き直し)
// 町の 人 (view/people.js) と 同じく、陰影を つけてから 濃い 輪郭線を 足す。光は 左上から。
// マスより 背が 高いので、足もとを マスの 下に そろえて 描く (draw.js の drawObject)
const OUTLINE = '#1a1830';

function make(w, h, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const px = (x, y, ww, hh, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, ww, hh); };
    draw(px);
    outline(ctx, w, h);
    return canvas;
}

// イーゼル: 前の 2 本脚と 後ろの 1 本、横木、白い 布を かけた キャンバス (布は 下で たるむ)
function easel(px) {
    const wood = '#9a6e44';
    const woodD = '#6e4a2c';
    const woodL = '#c09060';
    // 後ろの 脚 (奥なので 暗い)
    px(7, 4, 2, 22, '#5a3c24');
    // 前の 脚 (外へ 開く)
    for (let y = 2; y < 27; y++) {
        const spread = Math.floor((y - 2) / 7);
        px(4 - spread, y, 2, 1, y > 22 ? woodD : wood);
        px(10 + spread, y, 2, 1, woodD);
    }
    px(4, 2, 1, 14, woodL);
    // てっぺんの 留め具
    px(6, 1, 4, 2, woodD);
    px(6, 1, 4, 1, woodL);
    // キャンバス (木の 枠と 白い 布)
    px(2, 4, 12, 12, '#d8cdb4');
    px(3, 5, 10, 10, '#f6f0e2');
    px(3, 5, 4, 3, '#ffffff');              // 光
    px(11, 5, 2, 10, '#e2d8c2');            // 右は 影
    // 布の しわ と たるみ
    px(6, 8, 1, 6, '#e6dcc6');
    px(9, 7, 1, 7, '#e6dcc6');
    px(2, 15, 12, 2, '#efe6d2');
    px(3, 17, 3, 1, '#efe6d2');
    px(10, 17, 3, 1, '#e2d8c2');
    // 絵を 置く 横木
    px(1, 17, 14, 2, wood);
    px(1, 17, 14, 1, woodL);
    px(1, 18, 14, 1, woodD);
    // 横木に 置いた 絵の具と 筆
    px(3, 16, 2, 1, '#6fb0ff');
    px(6, 16, 1, 1, '#ff8f7a');
    px(11, 15, 3, 1, '#5a3c24');
    px(13, 14, 1, 1, '#ffd86b');
}

// ベッド: 木の 頭板、白い 枕、青い 掛け布団 (折り返した 白い シーツ)、足もとの 板と 脚
function bed(px) {
    const wood = '#8a5e3a';
    const woodD = '#5e3e24';
    const woodL = '#b08058';
    // 頭板 (上の 部分。マスより 上に はみ出す)
    px(0, 0, 16, 8, wood);
    px(0, 0, 16, 1, woodL);
    px(1, 2, 14, 4, woodD);
    px(2, 3, 12, 2, '#6e4a2c');
    px(0, 0, 1, 26, woodD);
    px(15, 0, 1, 26, woodD);
    // マットレスの 側面 と シーツ
    px(1, 8, 14, 18, '#eef0f6');
    // 枕
    px(3, 8, 10, 5, '#ffffff');
    px(3, 12, 10, 1, '#c6c9da');
    px(12, 8, 1, 5, '#d8dae8');
    px(5, 9, 3, 1, '#e8eaf4');
    // 折り返した シーツ
    px(1, 14, 14, 2, '#f4f4fa');
    px(1, 15, 14, 1, '#c6c9da');
    // 掛け布団 (青。左が 明るく 右が 暗い。たての しわと 星の もよう)
    px(1, 16, 14, 9, '#4a78c8');
    px(1, 16, 4, 9, '#5a8ad8');
    px(11, 16, 4, 9, '#3a62a8');
    px(6, 17, 1, 7, '#3e6ab4');
    px(10, 18, 1, 6, '#3a62a8');
    px(3, 19, 1, 1, '#ffe08a');
    px(8, 21, 1, 1, '#ffe08a');
    px(12, 18, 1, 1, '#ffe08a');
    px(1, 24, 14, 1, '#2e4e8a');           // 布団の すそ
    // 足もとの 板 と 脚
    px(0, 25, 16, 3, wood);
    px(0, 25, 16, 1, woodL);
    px(1, 28, 2, 2, woodD);
    px(13, 28, 2, 2, woodD);
}

function outline(ctx, w, h) {
    const image = ctx.getImageData(0, 0, w, h);
    const d = image.data;
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    const edge = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
        }
    }
    ctx.fillStyle = OUTLINE;
    for (const [x, y] of edge) ctx.fillRect(x, y, 1, 1);
}

export const ROOM_SPRITES = {
    canvas: () => make(16, 28, easel),
    bed: () => make(16, 31, bed)
};
