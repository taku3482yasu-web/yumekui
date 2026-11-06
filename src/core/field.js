import { MAPS } from '../data/maps.js';

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const SOLID = new Set(['w', 'M']);

export function createState() {
    const start = MAPS.odoriba.start;
    return {
        map: 'odoriba', x: start.x, y: start.y, dir: 'up', flags: {}, words: [], shards: 0, gone: {},
        day: 1, phase: 'night', status: { mio: 'idle', kana: 'idle' }, visits: {}
    };
}

export function isVisible(object, state) {
    if (state.gone[object.id]) return false;
    if (object.hideIf && state.flags[object.hideIf]) return false;
    if (object.needs && !state.flags[object.needs]) return false;
    return true;
}

export function objectsOf(state) {
    return MAPS[state.map].objects.filter((object) => isVisible(object, state));
}

export function objectAt(state, x, y) {
    return objectsOf(state).find((object) => object.x === x && object.y === y) ?? null;
}

export function tileAt(state, x, y) {
    return MAPS[state.map].tiles[y]?.[x] ?? 'w';
}

export function isBlocked(state, x, y) {
    const tile = tileAt(state, x, y);
    if (SOLID.has(tile)) return true;
    return tile === 'G' && !state.flags.gateOpen;
}

// 1 マス歩く。ぶつかった相手か、踏んだ出口を返す
export function step(state, dir) {
    const [dx, dy] = DIRS[dir];
    const x = state.x + dx;
    const y = state.y + dy;
    state.dir = dir;
    const object = objectAt(state, x, y);
    if (['foe', 'word', 'wake'].includes(object?.kind)) return { type: 'bump', object };
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
