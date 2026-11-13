import { createState } from './field.js';
import { FIRST_IMAGES } from '../data/brush.js';
import { grow } from './growth.js';
import { isActive, knowsDream, loopCanvas } from './canvas.js';
import { makeDreamShards } from './shards.js';

import { LAST_DAY, OPEN_DAY, PAIR, RIKU_DOWN_DAY, STORY_STEPS, activeDay, isWeekend, lastRescueDay } from './days.js';

export { ACTIVE_DAY, LAST_DAY, LAST_RESCUE_DAY, OPEN_DAY, PAIR, STORY_STEPS, activeDay, dateLabel, lastRescueDay } from './days.js';

// ループしても残るもの
export function createKeep() {
    return { loop: 1, allies: ['bak'], solved: [], copies: {}, tutorial: false, growth: { saved: 0, eaten: 0 }, eaten: [], canvasTold: false, brush: false, images: [...FIRST_IMAGES], musou: [] };
}

export function canTalk(state, id) {
    return state.day < activeDay(state) && state.status[id] === 'idle';
}

// 今夜 入れる夢。2 周目からは、2 人とも 元気なら ミオ×カナの夢 (夢合体『二重奏ホール』) も 描ける。
//   ユメクイが 活性化する前は、描いても 夢の チャンネルに 引っかからないので どこにも 入れない
//   ただし 完ぺきな 絵 (夢を 知っている) なら、活性化の 前でも 入れる (earlyDreams)
//   リクは 3 日に 倒れる (ユメクイが もう 活性化している) ので、3 日から 14 日まで 入れる
export function dreamsTonight(state, keep = null) {
    if (state.flags.dreamsClosed) return [];   // 1 周目: ナイトメアに 負けたあとは 夢が 閉じかけている
    const riku = state.day >= RIKU_DOWN_DAY && state.day <= LAST_DAY && state.status.riku === 'idle' ? ['riku'] : [];
    if (state.day < OPEN_DAY || state.day > lastRescueDay(state)) return riku;
    const list = PAIR.filter((id) => state.status[id] === 'idle');
    if (keep && keep.loop >= 2 && list.length === 2) list.push('duet');
    // 目覚める前も 夢には 入れる。ただし ユメクイの いる 奥の 扉は 閉じたまま (2026-11-13 ユーザー指定)
    return [...list, ...riku];
}

// 活性化の 前に、完ぺきな 絵で 入る 夢か (奥の 扉が 開いていて、まだ 弱い ユメクイと 戦える)
export function isEarly(state, dream = null, keep = null) {
    return dream !== 'riku' && !isActive(state) && Boolean(keep && knowsDream(keep, dream));
}

// 活性化の 前に、ぼんやりした 絵で 入る 夢か (ユメクイの いる 奥の 扉は 開かない。扉の 手前までは 歩ける)
export function isLocked(state, dream = null, keep = null) {
    return dream !== 'riku' && !isActive(state) && !(keep && knowsDream(keep, dream));
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

// 1 周目: ナイトメアに 負けて 眠る。12 日に 病院で 目を覚まし、残りは 準備の 期間 (夢には 入れない)
export function sleepAfterNightmare(state, wakeDay) {
    for (const id of PAIR) if (state.status[id] === 'idle') state.status[id] = 'broken';
    state.day = wakeDay - 1;   // 夜が 明けると wakeDay の 朝 (病院)
    state.phase = 'night';
    state.flags.active = true;
    state.flags.dreamsClosed = true;
    state.flags.nightmareDone = true;
    state.flags.hospitalNext = true;
}

// ミオ×カナの ストーリーを 1 段 進める (じっくり話すたび。1 日 1 人なので 1 日 1 段まで)。
//   最後の段を 見ると、その夜に ユメクイが 活性化する (期限より 早く 勝負を 始められる)。返り値: 進んだあとの 段
export function advanceStory(state) {
    if (!state.story) state.story = {};
    const step = Math.min((state.story.duet ?? 0) + 1, STORY_STEPS);
    state.story.duet = step;
    if (step === STORY_STEPS && state.activeDay == null) {
        state.activeDay = Math.min(state.day, activeDay(state));
        state.flags.active = true;
    }
    return step;
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
    if (state.day === lastRescueDay(state)) {
        for (const id of PAIR) {
            if (state.status[id] === 'idle') state.status[id] = 'broken';
        }
    }
    state.day++;
    state.wordsAtDay = state.words.length;   // その日に 言葉を 拾ったか (キャンバスの 段階)
    state.phase = isWeekend(state.day) ? 'day' : 'morning';
    if (state.day >= activeDay(state)) state.flags.active = true;
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
