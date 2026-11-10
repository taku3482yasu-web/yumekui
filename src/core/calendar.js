import { createState } from './field.js';
import { FIRST_IMAGES } from '../data/brush.js';
import { grow } from './growth.js';
import { isActive, knowsDream, loopCanvas } from './canvas.js';
import { makeDreamShards } from './shards.js';

import { ACTIVE_DAY, LAST_DAY, LAST_RESCUE_DAY, OPEN_DAY, PAIR, RIKU_DOWN_DAY, isWeekend } from './days.js';

export { ACTIVE_DAY, LAST_DAY, LAST_RESCUE_DAY, OPEN_DAY, PAIR, dateLabel } from './days.js';

// ループしても残るもの
export function createKeep() {
    return { loop: 1, allies: ['bak'], solved: [], copies: {}, tutorial: false, growth: { saved: 0, eaten: 0 }, eaten: [], canvasTold: false, brush: false, images: [...FIRST_IMAGES], musou: [] };
}

export function canTalk(state, id) {
    return state.day < ACTIVE_DAY && state.status[id] === 'idle';
}

// 今夜 入れる夢。2 周目からは、2 人とも 元気なら ミオ×カナの夢 (夢合体『二重奏ホール』) も 描ける。
//   ユメクイが 活性化する前は、描いても 夢の チャンネルに 引っかからないので どこにも 入れない
//   ただし 完ぺきな 絵 (夢を 知っている) なら、活性化の 前でも 入れる (earlyDreams)
//   リクは 3 日に 倒れる (ユメクイが もう 活性化している) ので、3 日から 14 日まで 入れる
export function dreamsTonight(state, keep = null) {
    const riku = state.day >= RIKU_DOWN_DAY && state.day <= LAST_DAY && state.status.riku === 'idle' ? ['riku'] : [];
    if (state.day < OPEN_DAY || state.day > LAST_RESCUE_DAY) return riku;
    const list = PAIR.filter((id) => state.status[id] === 'idle');
    if (keep && keep.loop >= 2 && list.length === 2) list.push('duet');
    if (isActive(state)) return [...list, ...riku];
    return [...(keep ? list.filter((id) => knowsDream(keep, id)) : []), ...riku];
}

// 活性化の 前に 入る 夢か (ボスは まだ 活性化していない)
export function isEarly(state, dream = null) {
    return dream !== 'riku' && !isActive(state);
}

// 夢合体で 2 人とも 救う。だれも 刈り取られない。ガクフメと トゲメトロが 仲間に (いれば 夢写し)
export function rescuePair(state, keep) {
    const joined = [];
    for (const [id, ally] of [['kana', 'togemetoro'], ['mio', 'gakufume']]) {
        state.status[id] = 'saved';
        grow(keep, 'saved');
        if (keep.allies.includes(ally)) keep.copies[ally] = (keep.copies[ally] ?? 0) + 1;
        else keep.allies.push(ally);
        joined.push(ally);
        if (!keep.solved.includes(ally)) keep.solved.push(ally);
    }
    if (!keep.musou.includes('duet')) keep.musou.push('duet');
    state.flags.duetSaved = true;
    return joined;
}

// 単独の夢で救う。もう片方は その夜 ナイトメアに刈り取られる
export function rescue(state, keep, id, ally) {
    const other = PAIR.find((item) => item !== id);
    state.status[id] = 'saved';
    if (PAIR.includes(id) && isActive(state) && state.status[other] === 'idle') state.status[other] = 'reaped';
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
    if (PAIR.includes(id) && isActive(state) && state.status[other] === 'idle') state.status[other] = 'reaped';
    if (!keep.eaten.includes(id)) keep.eaten.push(id);
    grow(keep, 'eaten');
    return { other };
}

// 1 日は 朝 → 放課後 → 夜。夜が明けると 次の日の朝。土日は 朝が 飛んで 昼 (家にいる) から
export function advance(state) {
    if (state.phase === 'morning') {
        state.phase = 'day';
        return 'day';
    }
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
    state.wordsAtDay = state.words.length;   // その日に 言葉を 拾ったか (キャンバスの 段階)
    state.phase = isWeekend(state.day) ? 'day' : 'morning';
    if (state.day >= ACTIVE_DAY) state.flags.active = true;
    return state.day > LAST_DAY ? 'loop' : state.phase;
}

// 2 月 1 日の朝 (自分のベッドで目を覚ます) へ戻る。プロローグとハルの夢は くり返さない (仕様書「ループで残るもの・消えるもの」)
export function nextLoop(keep, prevState = null) {
    keep.loop++;
    loopCanvas(keep, prevState);
    makeDreamShards(keep, prevState);   // 前の周に 救った ユメクイが 夢のかけらに なる
    if (prevState) keep.lastVisited = { ...(prevState.dreamsVisited ?? {}) };
    const state = createState();
    state.day = 1;
    state.phase = 'morning';
    state.flags.bak = true;
    for (const id of keep.eaten) state.status[id] = 'eaten';
    for (const id of Object.keys(keep.hearts ?? {})) state.gone[id] = true;   // 拾った 心のかけらは もう 落ちていない
    return state;
}
