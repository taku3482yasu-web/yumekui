// 戦闘に入るときの 演出 (2026-11-10 ユーザー指定)。その夢に 合わせた エフェクトのあと、戦闘画面へ移る
//   mask  (ハルの夢『顔色の坂道』): いろいろな顔の お面が まわりから 回りながら 迫ってくる
//   water (ミオの夢『水底の音楽室』): 泡が 下から わき上がり、画面が 深い青に 沈む
//   tempo (カナの夢『止まらない練習室』): メトロノームの 針が 振れて、拍ごとに 赤く光り、壁が 迫る
// ボス (本音を持つ相手) のときは 長く、画面が 揺れる。drawEncounter は 終わったら true
import { sprite } from './sprites.js';

const W = 320;
const H = 240;
export const ENCOUNTER_MS = { normal: 1000, boss: 1500 };

const MASKS = ['omote-喜', 'omote-怒', 'omote-哀', 'omote-楽'];

function drawMask(ctx, p, boss) {
    ctx.fillStyle = `rgba(20, 10, 40, ${Math.min(0.9, p * 1.1)})`;
    ctx.fillRect(0, 0, W, H);
    const count = boss ? 14 : 10;
    const scale = boss ? 3 : 2;
    for (let k = 0; k < count; k++) {
        const angle = p * (boss ? 6 : 4) + (k * Math.PI * 2) / count;
        const radius = 230 * (1 - p) + 18;
        const image = sprite(MASKS[k % 4]);
        const x = W / 2 + Math.cos(angle) * radius - (image.width * scale) / 2;
        const y = H / 2 + Math.sin(angle) * radius * 0.75 - (image.height * scale) / 2;
        ctx.globalAlpha = Math.min(1, p * 2);
        ctx.drawImage(image, Math.round(x), Math.round(y), image.width * scale, image.height * scale);
    }
    ctx.globalAlpha = 1;
}

function drawWater(ctx, p, boss) {
    ctx.fillStyle = `rgba(16, 60, 120, ${Math.min(0.92, p * 1.1)})`;
    ctx.fillRect(0, 0, W, H);
    // ゆらぐ 水の すじ
    ctx.fillStyle = 'rgba(140, 210, 240, 0.25)';
    for (let y = 0; y < H; y += 12) {
        const shift = Math.sin(y / 14 + p * 12) * 10;
        ctx.fillRect(0, y + shift / 4, W, 2);
    }
    // 泡
    const count = boss ? 60 : 40;
    for (let k = 0; k < count; k++) {
        const seed = (k * 0.618) % 1;
        const x = ((k * 73) % W) + Math.sin(p * 10 + k) * 6;
        const y = H + 20 - ((p * 1.5 + seed) % 1.2) * (H + 60);
        const r = 2 + (k % 4) * 1.5;
        ctx.strokeStyle = 'rgba(210, 245, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), 1, 1);
    }
}

function drawTempo(ctx, p, boss) {
    const beats = boss ? 6 : 4;
    const beat = (p * beats) % 1;
    ctx.fillStyle = `rgba(40, 10, 20, ${Math.min(0.85, p)})`;
    ctx.fillRect(0, 0, W, H);
    // 拍ごとの 赤い光
    ctx.fillStyle = `rgba(255, 90, 80, ${(1 - beat) * 0.45})`;
    ctx.fillRect(0, 0, W, H);
    // 迫る 壁
    const wall = p * (boss ? 130 : 110);
    ctx.fillStyle = '#401020';
    ctx.fillRect(0, 0, wall, H);
    ctx.fillRect(W - wall, 0, wall, H);
    ctx.fillRect(0, 0, W, wall * 0.75);
    ctx.fillRect(0, H - wall * 0.75, W, wall * 0.75);
    // メトロノームの 針
    const angle = Math.sin(p * Math.PI * beats) * 0.7;
    ctx.save();
    ctx.translate(W / 2, H / 2 + 60);
    ctx.fillStyle = '#c87a5a';
    ctx.beginPath();
    ctx.moveTo(-34, 10);
    ctx.lineTo(34, 10);
    ctx.lineTo(14, -90);
    ctx.lineTo(-14, -90);
    ctx.fill();
    ctx.rotate(angle);
    ctx.fillStyle = '#20203a';
    ctx.fillRect(-2, -110, 4, 110);
    ctx.fillStyle = '#ff8f7a';
    ctx.fillRect(-6, -76, 12, 8);
    ctx.restore();
    if (beat < 0.25) {
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff4dc';
        ctx.fillText('カチッ', W / 2 + (Math.floor(p * beats) % 2 ? 60 : -60), 60);
    }
}

const THEMES = { mask: drawMask, water: drawWater, tempo: drawTempo };

// enc: { theme, boss, start }。下に 地図が 描いてある 上に 重ねる
export function drawEncounter(ctx, enc, now) {
    const duration = enc.boss ? ENCOUNTER_MS.boss : ENCOUNTER_MS.normal;
    const p = Math.min(1, Math.max(0, now - enc.start) / duration);
    ctx.save();
    if (enc.boss) ctx.translate(Math.round(Math.sin(now / 25) * 3 * p), 0);
    (THEMES[enc.theme] ?? drawMask)(ctx, p, enc.boss);
    ctx.restore();
    // 最後に 白く光って 戦闘画面へ
    if (p > 0.82) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(p - 0.82) / 0.18})`;
        ctx.fillRect(0, 0, W, H);
    }
    return p >= 1;
}

// 地図の 見た目 (theme) から 演出を 決める。ハルの夢は テーマなし = お面
export function encounterTheme(map) {
    return map.theme === 'water' ? 'water' : map.theme === 'tempo' ? 'tempo' : 'mask';
}
