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
    base: ['#5c6aa6', '#566399', '#6a79b8']
};

function drawTile(ctx, tile, x, y, open, theme) {
    if (tile === 'w') return;
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
    const floor = FLOORS[theme ?? 'base'];
    ctx.fillStyle = (x / TILE + y / TILE) % 2 ? floor[0] : floor[1];
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = floor[2];
    ctx.fillRect(x, y + 15, TILE, 1);
    if (tile === 's') {
        ctx.fillStyle = '#8895cf';
        for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 4, TILE, 2);
    }
    if (tile === 'G' && !open) {
        ctx.fillStyle = '#20203a';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#b08be8';
        for (let i = 1; i < TILE; i += 5) ctx.fillRect(x + i, y, 2, TILE);
    }
}

export function drawField(ctx, state, walk, time) {
    const map = MAPS[state.map];
    const rows = map.tiles.length;
    const cols = map.tiles[0].length;
    const px = (state.x - walk.dx * walk.left) * TILE;
    const py = (state.y - walk.dy * walk.left) * TILE;
    const worldW = cols * TILE;
    const worldH = rows * TILE;
    const camX = worldW <= W ? (worldW - W) / 2 : clamp(px + 8 - W / 2, 0, worldW - W);
    const camY = worldH <= H ? (worldH - H) / 2 : clamp(py + 8 - H / 2, 0, worldH - H);

    drawSky(ctx, time);
    ctx.save();
    ctx.translate(-Math.round(camX), -Math.round(camY));
    map.tiles.forEach((row, y) => [...row].forEach((tile, x) => {
        drawTile(ctx, tile, x * TILE, y * TILE, state.flags.gateOpen, map.theme);
    }));
    for (const object of objectsOf(state)) drawObject(ctx, object, time);
    drawHal(ctx, state, px, py, walk);
    ctx.restore();
}

function drawObject(ctx, object, time) {
    if (object.kind === 'exit') return;
    const name = object.sprite ?? FOES[object.foe]?.sprite;
    const image = sprite(name);
    const bob = object.kind === 'talk' ? 0 : Math.round(Math.sin(time / 300 + object.x) * 1.5);
    const x = object.x * TILE + (TILE - image.width) / 2;
    const y = object.y * TILE + TILE - image.height + bob;
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

export function drawBattle(ctx, view, time) {
    drawSky(ctx, time);
    ctx.fillStyle = 'rgba(10, 12, 48, 0.55)';
    ctx.beginPath();
    ctx.ellipse(205, 132, 90, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(70, 158, 60, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    const foe = sprite(view.foe);
    const scale = foe.width >= 64 ? 1.5 : 4;
    const foeShake = view.foeHit > time ? Math.sin(time / 20) * 4 : 0;
    const foeY = 130 - foe.height * scale + Math.sin(time / 500) * 2;
    ctx.drawImage(foe, Math.round(205 - (foe.width * scale) / 2 + foeShake), Math.round(foeY), foe.width * scale, foe.height * scale);

    const bak = sprite(view.ally);
    const bakShake = view.allyHit > time ? Math.sin(time / 20) * 4 : 0;
    ctx.drawImage(bak, Math.round(26 + bakShake), 100, bak.width * 4, bak.height * 4);

    for (const pop of view.pops) {
        const left = (pop.until - time) / 700;
        if (left <= 0) continue;
        ctx.fillStyle = pop.color;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y - (1 - left) * 18);
    }
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

export function drawTown(ctx) {
    drawMorning(ctx);
    ctx.fillStyle = '#b0627a';
    for (let x = 0; x < W; x += 8) ctx.fillRect(x, 170 - (x % 48) / 2, 8, H);
    ctx.fillStyle = '#6f4a78';
    ctx.fillRect(0, 196, W, H);
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
