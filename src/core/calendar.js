import { createState } from './field.js';
import { grow } from './growth.js';

import { ACTIVE_DAY, LAST_DAY, LAST_RESCUE_DAY, OPEN_DAY, PAIR } from './days.js';

export { ACTIVE_DAY, LAST_DAY, LAST_RESCUE_DAY, OPEN_DAY, PAIR, dateLabel } from './days.js';

// ループしても残るもの
export function createKeep() {
    return { loop: 1, allies: ['bak'], solved: [], copies: {}, tutorial: false, growth: { saved: 0, eaten: 0 }, eaten: [] };
}

export function canTalk(state, id) {
    return state.day < ACTIVE_DAY && state.status[id] === 'idle';
}

export function dreamsTonight(state) {
    if (state.day < OPEN_DAY) return [];
    return PAIR.filter((id) => state.status[id] === 'idle');
}

// 単独の夢で救う。もう片方は その夜 ナイトメアに刈り取られる
export function rescue(state, keep, id, ally) {
    const other = PAIR.find((item) => item !== id);
    state.status[id] = 'saved';
    if (state.status[other] === 'idle') state.status[other] = 'reaped';
    grow(keep, 'saved');
    const copied = keep.allies.includes(ally);
    if (copied) keep.copies[ally] = (keep.copies[ally] ?? 0) + 1;
    else keep.allies.push(ally);
    return { other, copied };
}

// 喰らった夢主は抜け殻になり、ループしても戻らない
export function devour(state, keep, id) {
    const other = PAIR.find((item) => item !== id);
    state.status[id] = 'eaten';
    if (state.status[other] === 'idle') state.status[other] = 'reaped';
    if (!keep.eaten.includes(id)) keep.eaten.push(id);
    grow(keep, 'eaten');
    return { other };
}

export function advance(state) {
    if (state.phase === 'day') {
        state.phase = 'night';
        return 'night';
    }
    if (state.day === LAST_RESCUE_DAY) {
        for (const id of PAIR) {
            if (state.status[id] === 'idle') state.status[id] = 'broken';
        }
    }
    state.day++;
    state.phase = 'day';
    if (state.day >= ACTIVE_DAY) state.flags.active = true;
    return state.day > LAST_DAY ? 'loop' : 'day';
}

// 2 月 1 日へ戻る。チュートリアルは くり返さない
export function nextLoop(keep) {
    keep.loop++;
    const state = createState();
    state.day = OPEN_DAY;
    state.phase = 'day';
    state.flags.bak = true;
    for (const id of keep.eaten) state.status[id] = 'eaten';
    return state;
}
