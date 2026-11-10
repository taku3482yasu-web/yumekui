import { HEARTS, HEART_EXP_RATE } from '../data/hearts.js';

// ---- 夢のかけら (2026-11-10 ユーザー指定) ----------------------------------
//   時間が 戻ったことで、前の周の ユメクイが 変化したもの。前の周に 救って 仲間にした ユメクイの 状態 (レベル) を 残す。
//   活性化の 前に 仲間にした ユメクイは 活性化していないので 弱い (state.dormant)。夢のかけらを 使うと
//   前の周の 状態を 引き継いで 活性化する。合体の夢でも 同じ。使うと なくなり、次の ループで また できる
export const PAIR_ALLY = { mio: 'gakufume', kana: 'togemetoro', riku: 'himawarion' };

export function makeDreamShards(keep, prevState) {
    if (!prevState) return;
    keep.dreamShards ??= {};
    for (const [dreamer, ally] of Object.entries(PAIR_ALLY)) {
        if (prevState.status?.[dreamer] !== 'saved') continue;
        const rec = prevState.levels?.[ally] ?? { lv: 1, exp: 0 };
        keep.dreamShards[ally] = { lv: rec.lv, exp: rec.exp };
    }
}

export function dreamShardOf(keep, ally) {
    return keep.dreamShards?.[ally] ?? null;
}

export function setDormant(state, ally) {
    state.dormant ??= {};
    state.dormant[ally] = true;
}

export function isDormant(state, ally) {
    return Boolean(state.dormant?.[ally]);
}

// 夢のかけらを 使う: 前の周の レベルを 引き継ぎ (今より 低ければ そのまま)、活性化する
export function useDreamShard(state, keep, ally) {
    const shard = dreamShardOf(keep, ally);
    if (!shard) return false;
    state.levels ??= {};
    const now = state.levels[ally] ?? { lv: 1, exp: 0 };
    if (shard.lv > now.lv) state.levels[ally] = { lv: shard.lv, exp: shard.exp };
    if (state.dormant) delete state.dormant[ally];
    delete keep.dreamShards[ally];
    return true;
}

// ---- 心のかけら ------------------------------------------------------------

export function heartsOf(keep) {
    keep.hearts ??= {};
    return keep.hearts;
}

export function pickHeart(keep, id) {
    const hearts = heartsOf(keep);
    if (hearts[id] || !HEARTS[id]) return false;
    hearts[id] = { holder: null, taught: null };
    return true;
}

// 経験値の かけらを 持たせる (1 体に 1 つ。ほかの かけらを 持っていたら 入れかえ)
export function giveHeart(keep, id, ally) {
    const hearts = heartsOf(keep);
    if (!hearts[id] || HEARTS[id].kind !== 'exp') return false;
    for (const [other, rec] of Object.entries(hearts)) if (other !== id && rec.holder === ally) rec.holder = null;
    hearts[id].holder = ally;
    return true;
}

// 技の かけら: 本来 覚えない 技を 覚えさせる (1 つの かけらで 1 体。覚えた 技は ずっと 残る)
export function teachHeart(keep, id, ally) {
    const hearts = heartsOf(keep);
    const heart = HEARTS[id];
    if (!hearts[id] || heart.kind !== 'move' || hearts[id].taught) return false;
    hearts[id].taught = ally;
    keep.taught ??= {};
    keep.taught[ally] ??= [];
    if (!keep.taught[ally].includes(heart.move)) keep.taught[ally].push(heart.move);
    return true;
}

export function heartExpRate(keep, ally) {
    return Object.entries(keep.hearts ?? {}).some(([id, rec]) => rec.holder === ally && HEARTS[id]?.kind === 'exp') ? HEART_EXP_RATE : 1;
}

export function taughtMoves(keep, ally) {
    return (keep.taught?.[ally] ?? []).map((move) => {
        const heart = Object.values(HEARTS).find((h) => h.move === move);
        return { id: move, label: heart?.moveLabel ?? move };
    });
}
