// ゲームの はじまりの 夢 (2026-11-10 ユーザー指定)
// 青い海の 砂浜に ハルが 一人で 立っている。海には 何もいない。
// だんだん 画面が ゆがみだし、暗くなっていき、最後に 大きな目が 画面全体に 現れて「おきろ」。
// そこで 授業が終わって 目が覚める (main.js が プロローグの 放課後へ つなぐ)。drawIntro は 終わったら true
import { sprite } from './sprites.js';

const W = 320;
const H = 240;
export const INTRO = { calm: 3500, warp: 7000, eye: 8000, word: 8900, end: 10800 };

let buffer = null;

function drawBeach(ctx, time) {
    const sky = ctx.createLinearGradient(0, 0, 0, 100);
    sky.addColorStop(0, '#6fb8e8');
    sky.addColorStop(1, '#d8f0fa');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 100);
    // 海: どこまでも 青く、何もいない
    const sea = ctx.createLinearGradient(0, 96, 0, 158);
    sea.addColorStop(0, '#3f86c8');
    sea.addColorStop(1, '#2a64a8');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 96, W, 62);
    ctx.fillStyle = 'rgba(200, 236, 255, 0.55)';
    for (let k = 0; k < 14; k++) {
        const y = 102 + (k % 7) * 8;
        const x = ((k * 53 + time / (30 + (k % 3) * 10)) % (W + 40)) - 20;
        ctx.fillRect(Math.round(x), y, 14 + (k % 4) * 4, 1);
    }
    // 砂浜と 寄せては返す 波
    ctx.fillStyle = '#ecd9ad';
    ctx.fillRect(0, 158, W, H - 158);
    const reach = Math.sin(time / 900) * 5;
    ctx.fillStyle = '#ffffff';
    for (let x = 0; x < W; x += 2) ctx.fillRect(x, Math.round(157 + reach + Math.sin(x / 11 + time / 400) * 2), 2, 3);
    ctx.fillStyle = '#d8c294';
    for (let k = 0; k < 30; k++) ctx.fillRect((k * 97) % W, 170 + ((k * 41) % 64), 2, 1);
    // ハル (後ろ姿)。一人きり
    const hal = sprite('hal-up');
    ctx.drawImage(hal, W / 2 - hal.width, 172, hal.width * 2, hal.height * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(W / 2 - 10, 203, 20, 3);
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

// intro: { start, skip }。skip すると 最後へ 飛ぶ
export function drawIntro(ctx, intro, now) {
    const t = intro.skip ? INTRO.end : Math.max(0, now - intro.start);
    if (t >= INTRO.end - 600) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        return t >= INTRO.end;
    }
    if (t < INTRO.eye) {
        buffer ??= Object.assign(document.createElement('canvas'), { width: W, height: H });
        const b = buffer.getContext('2d');
        b.imageSmoothingEnabled = false;
        drawBeach(b, now);
        // ゆがみ: 行ごとに 横へ ずれる。だんだん 強く
        const warp = Math.max(0, (t - INTRO.calm) / (INTRO.eye - INTRO.calm));
        if (warp <= 0) ctx.drawImage(buffer, 0, 0);
        else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, W, H);
            const amp = warp * warp * 26;
            for (let y = 0; y < H; y += 2) {
                const dx = Math.sin(y / 9 + now / 160) * amp + Math.sin(y / 23 - now / 310) * amp * 0.6;
                ctx.drawImage(buffer, 0, y, W, 2, Math.round(dx), y, W, 2);
            }
            ctx.fillStyle = `rgba(6, 4, 14, ${Math.min(0.92, warp * 0.95)})`;
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
