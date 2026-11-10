// プロローグで 初めて キャンバスに 描く 画面 (台本 1-0)。
// 十字キーで 筆を動かして 線を引く。何を描いても、線は いつの間にか 青くにじんでいき、
// 描き終えると (A か 時間切れ) 漠然とした 海のような絵に なる。drawPainting は 終わったら true
const W = 320;
const H = 240;
const BOARD = { x: 70, y: 36, w: 180, h: 136 };
const SPEED = 0.11;          // 筆の 速さ (ドット / ミリ秒)
const BLEED_MS = 900;        // 線が 青に にじむまでの 時間
export const PAINT_LIMIT_MS = 12000;
const FINISH_MS = 2200;

export function createPainting(now) {
    return { cx: BOARD.w / 2, cy: BOARD.h / 2, strokes: [], start: now, finishAt: null };
}

// 筆を 動かす (dir: 'up' など。なければ 動かない)
export function updatePainting(p, dir, delta, now) {
    if (p.finishAt) return;
    if (now - p.start > PAINT_LIMIT_MS) p.finishAt = now;
    if (!dir) return;
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    p.cx = Math.max(2, Math.min(BOARD.w - 3, p.cx + dx * SPEED * delta));
    p.cy = Math.max(2, Math.min(BOARD.h - 3, p.cy + dy * SPEED * delta));
    const last = p.strokes.at(-1);
    if (!last || Math.hypot(last.x - p.cx, last.y - p.cy) >= 1.5) p.strokes.push({ x: p.cx, y: p.cy, t: now });
}

export function finishPainting(p, now) {
    if (!p.finishAt) p.finishAt = now;
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const INK = [32, 32, 58];
const SEA = [79, 134, 184];

export function drawPainting(ctx, p, now) {
    ctx.fillStyle = '#2a2030';
    ctx.fillRect(0, 0, W, H);
    // イーゼル
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(W / 2 - 3, BOARD.y - 14, 6, H - BOARD.y + 14);
    ctx.fillRect(BOARD.x + 20, BOARD.y + BOARD.h, 8, 40);
    ctx.fillRect(BOARD.x + BOARD.w - 28, BOARD.y + BOARD.h, 8, 40);
    ctx.fillStyle = '#f4ecdc';
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);

    const finish = p.finishAt ? Math.min(1, (now - p.finishAt) / FINISH_MS) : 0;
    // 描き終えると、下から 海が 満ちていく
    if (finish > 0) {
        for (let y = 0; y < BOARD.h; y += 2) {
            const fromBottom = (BOARD.h - y) / BOARD.h;
            const level = finish * 1.25 - fromBottom * 0.5;
            if (level <= 0) continue;
            const shade = mix([214, 232, 244], SEA, Math.min(1, y / BOARD.h + 0.2));
            ctx.fillStyle = `rgba(${shade.join(',')}, ${Math.min(1, level)})`;
            const wave = Math.sin(y / 6 + now / 500) * 3;
            ctx.fillRect(BOARD.x, BOARD.y + y + wave * 0.2, BOARD.w, 2);
        }
    }
    // 線: 時間が たつほど 青く 大きく にじむ
    for (const s of p.strokes) {
        const age = Math.min(1, (now - s.t) / BLEED_MS);
        const color = mix(INK, SEA, age);
        const size = 2 + age * 2;
        ctx.fillStyle = `rgba(${color.join(',')}, ${1 - finish * 0.6})`;
        ctx.fillRect(Math.round(BOARD.x + s.x - size / 2), Math.round(BOARD.y + s.y - size / 2), Math.round(size), Math.round(size));
    }
    // 筆先
    if (!p.finishAt) {
        ctx.fillStyle = '#20203a';
        ctx.fillRect(Math.round(BOARD.x + p.cx) - 1, Math.round(BOARD.y + p.cy) - 8, 2, 7);
        ctx.fillStyle = '#4f86b8';
        ctx.fillRect(Math.round(BOARD.x + p.cx) - 1, Math.round(BOARD.y + p.cy) - 1, 2, 2);
    }
    return finish >= 1;
}
