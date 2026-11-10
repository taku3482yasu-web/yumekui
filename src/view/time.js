// 時間の演出 (2026-11-10 ユーザー指定)
//   drawLapse:    時間が過ぎていく。町の上の 空の色が 変わり、太陽が 動いて 夜は 月になる (朝 → 昼 → 放課後 → 夕方 → 夜)
//   drawCalendar: 1 日が 終わると、壁の カレンダーが 1 枚 はがれて 次の日になる
// どちらも 終わったら true を返す (main.js が 次へ進む)
import { weekday } from '../core/days.js';

const W = 320;
const H = 240;

export const LAPSE_STEP_MS = 900;    // 時間帯 1 つぶん
export const LAPSE_HOLD_MS = 700;    // 最後の 時間帯で 止まる
export const CALENDAR_MS = 2000;

// 時間帯ごとの 空 (上・下の色) と 太陽 / 月の 位置と色
const SKIES = {
    朝: { top: '#9fd0f0', bottom: '#fbe3c0', body: [60, 150], color: '#fff2b0', town: '#6a5a6a' },
    昼: { top: '#5aa8e8', bottom: '#c4e6f8', body: [160, 46], color: '#fff6c8', town: '#5c5a70' },
    放課後: { top: '#f0b070', bottom: '#f8dca8', body: [236, 104], color: '#ffd890', town: '#6a4a5a' },
    夕方: { top: '#8a4a80', bottom: '#f08850', body: [284, 168], color: '#ff9a5a', town: '#3a2a40' },
    夜: { top: '#0a0c30', bottom: '#232a6a', body: [214, 56], color: '#eef0ff', town: '#141228' }
};

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => {
    const [x, y] = [hex(a), hex(b)];
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

// 町の 影 (家並みと 坂の上の 学校)。時間帯で 色が 変わる
function drawTownline(ctx, color, lights) {
    ctx.fillStyle = color;
    const roofs = [[0, 182, 34], [30, 172, 30], [58, 186, 40], [96, 176, 26], [196, 180, 30], [224, 170, 36], [258, 184, 30], [286, 176, 34]];
    for (const [x, y, w] of roofs) {
        ctx.fillRect(x, y, w, H - y);
        ctx.beginPath();
        ctx.moveTo(x - 2, y);
        ctx.lineTo(x + w / 2, y - 10);
        ctx.lineTo(x + w + 2, y);
        ctx.fill();
    }
    ctx.fillRect(118, 150, 82, H - 150);   // 学校
    ctx.fillRect(152, 136, 14, 16);       // 時計台
    ctx.fillRect(0, 206, W, H - 206);     // 坂道
    if (!lights) return;
    ctx.fillStyle = `rgba(255, 216, 140, ${lights})`;
    for (const [x, y] of [[8, 192], [40, 184], [70, 196], [104, 186], [206, 190], [236, 182], [268, 194], [298, 186]]) ctx.fillRect(x, y, 3, 3);
}

// lapse: { labels: ['放課後', '夕方', '夜'], start }
export function drawLapse(ctx, lapse, now) {
    const steps = lapse.labels.length - 1;
    // フレームの 時刻は 演出を 始めた 時刻より 少し前の ことがある (マイナスに しない)
    const elapsed = Math.max(0, now - lapse.start);
    const pos = Math.min(steps, elapsed / LAPSE_STEP_MS);
    const i = Math.min(steps - 1, Math.floor(pos));
    // 1 つの 時間帯の あいだ、はじめの 4 割は その色で 止まり、残りで 次の色へ (青と橙が 混ざって 灰色に 見える時間を 短く)
    const t = ease(Math.max(0, (pos - i - 0.4) / 0.6));
    const a = SKIES[lapse.labels[i]];
    const b = SKIES[lapse.labels[i + 1]];

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix(a.top, b.top, t));
    sky.addColorStop(1, mix(a.bottom, b.bottom, t));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 夜に 近づくほど 星が 出る
    const night = (lapse.labels[i] === '夜' ? 1 : 0) * (1 - t) + (lapse.labels[i + 1] === '夜' ? 1 : 0) * t;
    if (night > 0) {
        ctx.fillStyle = `rgba(223, 227, 255, ${night})`;
        for (let k = 0; k < 40; k++) ctx.fillRect((k * 97) % W, (k * 53) % 150, 1, 1);
    }

    // 太陽は 弧を描いて 動き、夜になると 月に 変わる
    const toNight = lapse.labels[i + 1] === '夜';
    const x = lerp(a.body[0], b.body[0], t);
    const y = lerp(a.body[1], b.body[1], t) - Math.sin(t * Math.PI) * 18;
    ctx.fillStyle = mix(a.color, b.color, t);
    ctx.beginPath();
    ctx.arc(toNight && t > 0.5 ? b.body[0] : x, toNight && t > 0.5 ? b.body[1] : y, 12, 0, Math.PI * 2);
    ctx.fill();
    if ((toNight && t > 0.5) || lapse.labels[i] === '夜') {
        ctx.fillStyle = mix(a.top, b.top, t);
        ctx.beginPath();
        ctx.arc(b.body[0] + 5, b.body[1] - 3, 10, 0, Math.PI * 2);   // 三日月
        ctx.fill();
    }

    drawTownline(ctx, mix(a.town, b.town, t), Math.max(0, (pos - (steps - 1)) * (lapse.labels.at(-1) === '夜' ? 0.9 : 0)));

    // 今の 時間帯の 名前
    const label = lapse.labels[t < 0.5 ? i : i + 1];
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px sans-serif';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(13, 16, 48, 0.85)';
    ctx.strokeText(label, W / 2, 92);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, W / 2, 92);
    ctx.font = '11px sans-serif';
    const dots = lapse.labels.map((l, k) => (k <= (t < 0.5 ? i : i + 1) ? '●' : '○')).join('  ');
    ctx.strokeText(dots, W / 2, 112);
    ctx.fillText(dots, W / 2, 112);

    return elapsed >= steps * LAPSE_STEP_MS + LAPSE_HOLD_MS;
}

// 壁に かけた 日めくりカレンダーの 1 枚
function drawPage(ctx, day, x, y) {
    ctx.fillStyle = '#f4ecdc';
    ctx.fillRect(x, y, 120, 140);
    ctx.fillStyle = '#d8ccb4';
    ctx.fillRect(x, y + 136, 120, 4);
    const sunday = weekday(day) === '日';
    const saturday = weekday(day) === '土';
    ctx.fillStyle = sunday ? '#c84a48' : saturday ? '#3f6ab0' : '#3a3a50';
    ctx.fillRect(x, y, 120, 24);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4ecdc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('2月', x + 60, y + 17);
    ctx.fillStyle = sunday ? '#c84a48' : saturday ? '#3f6ab0' : '#20203a';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(String(day), x + 60, y + 100);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`（${weekday(day)}）`, x + 60, y + 126);
}

// cal: { from, to, start }。古い 1 枚が 左上を 軸に めくれて 落ち、下から 次の日が 出る
export function drawCalendar(ctx, cal, now) {
    const elapsed = now - cal.start;
    ctx.fillStyle = '#2a2030';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3a2c3e';
    for (let x = 0; x < W; x += 24) ctx.fillRect(x, 0, 1, H);   // 壁紙
    const px = 100;
    const py = 54;
    ctx.fillStyle = '#20203a';
    ctx.fillRect(px + 56, py - 14, 8, 8);    // 画びょう
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(px - 4, py - 6, 128, 8);    // とじ金具
    drawPage(ctx, cal.to, px, py);

    const tear = Math.max(0, Math.min(1, (elapsed - 500) / 900));
    if (tear < 1) {
        ctx.save();
        const t = tear * tear;
        ctx.translate(px + 120, py + t * 220);
        ctx.rotate(-t * 0.9 - Math.sin(tear * Math.PI) * 0.15);
        ctx.globalAlpha = 1 - Math.max(0, tear - 0.6) / 0.4;
        drawPage(ctx, cal.from, -120, 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';   // めくれた 影
        ctx.fillRect(-120, 0, 120 * tear, 140);
        ctx.restore();
    }
    return elapsed >= CALENDAR_MS;
}
