// ゲームの はじまりの 夢 (台本 1-0。2026-11-13 ユーザー指定で 歩けるように)
// 青い海の 砂浜に ハルが たたずんでいる。ここで 操作を 説明する (十字キーで 歩く・A で 話す・B で ダッシュ)。
// 左右にしか 進めず、右へ 進むと 人 (ヒカリ。画面では「？？？」) が いる。話しかけるまでは その先へ 行けない。
// 話したあと さらに 右へ 進むと、画面が どんどん ゆがみ、暗くなり、最後に 大きな目が 現れて「おきろ」。
// main.js が 歩き (updateIntro) と 会話を 進め、drawIntro が 描く。drawIntro は 終わったら true
import { sprite } from './sprites.js';

const W = 320;
const H = 240;
export const BEACH = {
    width: 1040,        // 砂浜の 長さ (画面 3 枚と すこし)
    start: 120,         // ハルが 立っている 場所
    hikari: 560,        // ？？？ (ヒカリ) が 立っている 場所
    warpFrom: 700,      // 話したあと ここより 右へ 行くと ゆがみはじめる
    speed: 0.075,       // 1 ミリ秒に 進む ドット (B で 2 倍)
    ground: 196         // 足もとの 高さ
};
// ゆがみはじめてからの 時間
export const INTRO = { warp: 3800, eye: 4600, word: 5500, end: 7400 };

let buffer = null;

export function createIntro() {
    return { x: BEACH.start, dir: 'right', step: 0, talked: false, warpAt: null, finished: false };
}

// 歩く。dir は 'left' / 'right' / ほか (止まる)。返り値は 'hikari' (ヒカリの 前で 止められた) など
export function updateIntro(intro, dir, dash, delta, now) {
    if (intro.warpAt !== null) return null;   // ゆがみ だしたら もう 動けない
    if (dir !== 'left' && dir !== 'right') return null;
    intro.dir = dir;
    const move = BEACH.speed * (dash ? 2 : 1) * delta * (dir === 'left' ? -1 : 1);
    let x = Math.max(24, Math.min(BEACH.width - 24, intro.x + move));
    // 話しかけるまでは ヒカリの 前で 止まる
    if (!intro.talked && x > BEACH.hikari - 32) x = BEACH.hikari - 32;
    intro.step += Math.abs(x - intro.x);
    intro.x = x;
    if (intro.talked && x >= BEACH.warpFrom) intro.warpAt = now;
    return null;
}

// ヒカリの 近くで 向き合って いるか (A で 話しかけられる)
export function nearHikari(intro) {
    return Math.abs(intro.x - BEACH.hikari) < 48 && (intro.x < BEACH.hikari ? intro.dir === 'right' : intro.dir === 'left');
}

function camOf(intro) {
    return Math.max(0, Math.min(BEACH.width - W, intro.x - W / 2));
}

// 2 倍に して 描く。flip で 左右を 反転
function drawFlip(ctx, image, x, y, flip) {
    const w = image.width * 2;
    const h = image.height * 2;
    ctx.save();
    if (flip) {
        ctx.translate(x + w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(image, 0, y, w, h);
    } else ctx.drawImage(image, x, y, w, h);
    ctx.restore();
}

function drawBeach(ctx, intro, time) {
    const cam = camOf(intro);
    // 空
    const sky = ctx.createLinearGradient(0, 0, 0, 110);
    sky.addColorStop(0, '#5aa6e0');
    sky.addColorStop(1, '#d8f0fa');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 110);
    // 遠くの 雲 (ゆっくり 流れる。奥ほど 動かない)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let k = 0; k < 7; k++) {
        const x = ((k * 173 - cam * 0.15 + time / 400) % (W + 120)) - 60;
        const y = 18 + (k % 3) * 16;
        ctx.fillRect(Math.round(x), y, 36 + (k % 2) * 18, 6);
        ctx.fillRect(Math.round(x) + 8, y - 4, 20, 4);
    }
    // 海: どこまでも 青く、何もいない
    const sea = ctx.createLinearGradient(0, 104, 0, 170);
    sea.addColorStop(0, '#3f86c8');
    sea.addColorStop(1, '#245c9e');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 104, W, 66);
    ctx.fillStyle = '#2a64a8';
    ctx.fillRect(0, 104, W, 2);   // 水平線
    ctx.fillStyle = 'rgba(200, 236, 255, 0.55)';
    for (let k = 0; k < 18; k++) {
        const y = 110 + (k % 8) * 7;
        const x = ((k * 61 - cam * (0.3 + (k % 8) * 0.06) + time / (30 + (k % 3) * 10)) % (W + 40) + W + 40) % (W + 40) - 20;
        ctx.fillRect(Math.round(x), y, 12 + (k % 4) * 4, 1);
    }
    // 砂浜と 寄せては返す 波
    ctx.fillStyle = '#ecd9ad';
    ctx.fillRect(0, 170, W, H - 170);
    ctx.fillStyle = '#dcc595';
    ctx.fillRect(0, 170, W, 6);   // ぬれた 砂
    const reach = Math.sin(time / 900) * 5;
    ctx.fillStyle = '#ffffff';
    for (let x = 0; x < W; x += 2) ctx.fillRect(x, Math.round(168 + reach + Math.sin((x + cam) / 11 + time / 400) * 2), 2, 3);
    // 砂の つぶ・貝がら (地面と いっしょに 動く)
    for (let k = 0; k < 60; k++) {
        const wx = (k * 97) % BEACH.width;
        const x = wx - cam;
        if (x < -4 || x > W) continue;
        ctx.fillStyle = k % 9 === 0 ? '#f6eee0' : '#d0b888';
        ctx.fillRect(Math.round(x), 182 + ((k * 41) % 56), k % 9 === 0 ? 3 : 2, k % 9 === 0 ? 2 : 1);
    }
    // ？？？ (ヒカリ)。海を 見ている
    const hikari = sprite('hikari');
    const hx = Math.round(BEACH.hikari - cam - hikari.width);
    if (hx > -40 && hx < W + 40) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.fillRect(hx + 2, BEACH.ground + 1, hikari.width * 2 - 4, 3);
        drawFlip(ctx, hikari, hx, BEACH.ground - hikari.height * 2, intro.x > BEACH.hikari);   // ハルが 右に いれば 右を 向く
    }
    // ハル (横向き。歩くと 上下に ゆれる)
    const hal = sprite('hal-side');
    const px = Math.round(intro.x - cam - hal.width);
    const bob = Math.floor(intro.step / 6) % 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.fillRect(px + 2, BEACH.ground + 1, hal.width * 2 - 4, 3);
    drawFlip(ctx, hal, px, BEACH.ground - hal.height * 2 - bob, intro.dir === 'left');
    // 話しかけられる ときの しるし
    if (!intro.talked && nearHikari(intro)) {
        ctx.fillStyle = '#ffffff';
        const mx = Math.round(BEACH.hikari - cam - 3);
        const my = BEACH.ground - hikari.height * 2 - 12 + Math.round(Math.sin(time / 200));
        ctx.fillRect(mx, my, 6, 2);
        ctx.fillRect(mx + 2, my + 2, 2, 3);
    }
}

// 画面 全体の 大きな目。open: 0 (閉じている) 〜 1 (見開く)
function drawEye(ctx, open, time) {
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2;
    const cy = H / 2;
    const rx = 170;
    const ry = 104 * open;
    if (ry < 1) return;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#e8e2d8';
    ctx.fillRect(0, 0, W, H);
    // 血管
    ctx.strokeStyle = 'rgba(180, 40, 50, 0.6)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
        ctx.quadraticCurveTo(cx + Math.cos(a + 0.3) * rx * 0.6, cy + Math.sin(a + 0.3) * ry * 0.6, cx + Math.cos(a) * 60, cy + Math.sin(a) * 50);
        ctx.stroke();
    }
    // 瞳 (小さく 震える)
    const jx = Math.sin(time / 37) * 2;
    const jy = Math.cos(time / 53) * 1.5;
    ctx.fillStyle = '#3a2a5a';
    ctx.beginPath();
    ctx.arc(cx + jx, cy + jy, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#120a1e';
    ctx.beginPath();
    ctx.arc(cx + jx, cy + jy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(cx + jx - 34, cy + jy - 36, 10, 8);
    ctx.restore();
    // まぶたの 線
    ctx.strokeStyle = '#05040a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
}

// intro: createIntro() の 形。ゆがみ だしたら 時間で 進む
export function drawIntro(ctx, intro, now) {
    const t = intro.warpAt === null ? -1 : now - intro.warpAt;
    if (t >= INTRO.end - 600) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        return t >= INTRO.end;
    }
    if (t < INTRO.eye) {
        buffer ??= Object.assign(document.createElement('canvas'), { width: W, height: H });
        const b = buffer.getContext('2d');
        b.imageSmoothingEnabled = false;
        drawBeach(b, intro, now);
        // ゆがみ: 行ごとに 横へ ずれる。だんだん 強く (暗転して 目が 開く 前まで)
        const warp = t < 0 ? 0 : Math.min(1, t / INTRO.warp);
        if (warp <= 0) ctx.drawImage(buffer, 0, 0);
        else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, W, H);
            const amp = warp * warp * 26;
            for (let y = 0; y < H; y += 2) {
                const dx = Math.sin(y / 9 + now / 160) * amp + Math.sin(y / 23 - now / 310) * amp * 0.6;
                ctx.drawImage(buffer, 0, y, W, 2, Math.round(dx), y, W, 2);
            }
            ctx.fillStyle = `rgba(6, 4, 14, ${Math.min(1, warp * 1.05)})`;
            ctx.fillRect(0, 0, W, H);
        }
        return false;
    }
    const open = Math.min(1, (t - INTRO.eye) / 700);
    drawEye(ctx, open * open, now);
    if (t >= INTRO.word) {
        const shake = Math.sin(now / 20) * 2;
        ctx.textAlign = 'center';
        ctx.font = 'bold 56px sans-serif';
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#000000';
        ctx.strokeText('おきろ', W / 2 + shake, H / 2 + 20);
        ctx.fillStyle = '#e8242c';
        ctx.fillText('おきろ', W / 2 + shake, H / 2 + 20);
    }
    return false;
}
