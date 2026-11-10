import { MAPS } from '../data/maps.js';
import { present } from './town.js';
import { paintedTile } from './brush.js';

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// 通れない タイル。夢: 空に浮かぶ海・お面の壁・崩れた所 (C。夢筆で 描くと 通れる) / 現実: 壁・黒板・窓・机・ピアノ・イーゼル・手すり・校庭・木・建物・屋根・のれん・柵・テーブル
const SOLID = new Set(['w', 'M', 'C', '#', 'b', 'k', 'd', 'p', 'e', 'f', 'x', 'T', 'h', 'R', 'n', '=', 't']);

// ぶつかると 何かが起きる 物 (人・キャンバス・ベッド・看板は 調べると 起きる)
const BUMP = ['foe', 'word', 'wake', 'door', 'block', 'brushSpot', 'heart'];

export function createState() {
    const start = MAPS.odoriba.start;
    return {
        map: 'odoriba', x: start.x, y: start.y, dir: 'up', flags: {}, words: [], shards: 0, gone: {},
        day: 1, phase: 'night', time: 'day', talkedToday: false, sentences: [], status: { mio: 'idle', kana: 'idle', riku: 'idle' }, visits: {}
    };
}

export function isVisible(object, state) {
    if (state.gone[object.id]) return false;
    if (object.hideIf && state.flags[object.hideIf]) return false;
    // ボス (needs: 'active') は 活性化してから。完ぺきな 絵で 活性化前に 入った 夢 (flags.early) では、まだ 活性化していない 姿で いる
    if (object.needs === 'active' && !state.flags.active && !state.flags.early) return false;
    if (object.needs && object.needs !== 'active' && !state.flags[object.needs]) return false;
    if (object.night && state.phase !== 'night') return false;   // 夜だけの物 (閉まった校門 など)
    if (object.phase && object.phase !== state.phase) return false;   // その時間帯だけの物 (朝の 通学路の 生徒 など)
    if (object.who && !present(state, object.who)) return false;
    return true;
}

export function objectsOf(state) {
    return MAPS[state.map].objects.filter((object) => isVisible(object, state));
}

// 同じマスに 2 つあるときは、出口より 先に ほかの物 (通せんぼ など)
export function objectAt(state, x, y) {
    const here = objectsOf(state).filter((object) => object.x === x && object.y === y);
    return here.find((object) => object.kind !== 'exit') ?? here[0] ?? null;
}

// 今いる 部屋の名前 (学校の 教室・音楽室 など)。部屋の区切りがない 地図は 地図の名前
export function placeName(state) {
    const map = MAPS[state.map];
    const room = map.rooms?.find((r) => state.x >= r.x[0] && state.x <= r.x[1] && state.y >= r.y[0] && state.y <= r.y[1]);
    return room?.name ?? map.name;
}

export function tileAt(state, x, y) {
    return paintedTile(state, x, y) ?? MAPS[state.map].tiles[y]?.[x] ?? 'w';
}

export function isBlocked(state, x, y) {
    const tile = tileAt(state, x, y);
    if (SOLID.has(tile)) return true;
    if (tile === 'L') return !state.flags.gateL;   // 二重奏ホールの 左右の扉
    if (tile === 'J') return !state.flags.gateR;
    if (tile === 'Y') return !state.flags.rikuWall;   // リクの夢の しおれた ひまわりの 壁 (3 周目に 開く)
    return tile === 'G' && !state.flags.gateOpen;
}

// 1 マス歩く。ぶつかった相手か、踏んだ出口を返す
export function step(state, dir) {
    const [dx, dy] = DIRS[dir];
    const x = state.x + dx;
    const y = state.y + dy;
    state.dir = dir;
    const object = objectAt(state, x, y);
    if (BUMP.includes(object?.kind)) return { type: 'bump', object };
    if (object && object.kind !== 'exit') return { type: 'stop' };
    if (isBlocked(state, x, y)) return { type: 'stop' };
    state.x = x;
    state.y = y;
    return object ? { type: 'exit', object } : { type: 'moved' };
}

export function facing(state) {
    const [dx, dy] = DIRS[state.dir];
    return objectAt(state, state.x + dx, state.y + dy);
}

export function warp(state, exit) {
    state.map = exit.to;
    state.x = exit.at.x;
    state.y = exit.at.y;
}

export function pickWord(state, object) {
    state.words.push(object.word);
    state.gone[object.id] = true;
    const rest = MAPS[state.map].objects.some((item) => item.kind === 'word' && !state.gone[item.id]);
    const opens = !rest && state.map === 'omen';
    if (opens) state.flags.gateOpen = true;
    return opens;
}

// ナイトメアの 次の 1 マス (壁 w 以外は 何でも すり抜ける)。ハルから 広げて、追う 側の 隣の マスを 返す
export function chaseStep(tiles, from, to) {
    const key = (x, y) => `${x},${y}`;
    const seen = new Set([key(to.x, to.y)]);
    const queue = [[to.x, to.y]];
    while (queue.length) {
        const [x, y] = queue.shift();
        for (const [dx, dy] of Object.values(DIRS)) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx === from.x && ny === from.y) return { x, y };
            if (seen.has(key(nx, ny)) || !tiles[ny]?.[nx] || tiles[ny][nx] === 'w') continue;
            seen.add(key(nx, ny));
            queue.push([nx, ny]);
        }
    }
    return null;
}
