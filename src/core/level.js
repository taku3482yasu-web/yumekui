import { BAK_YP_MOVES, LEVEL_MOVES, YP_STATS } from '../data/growth.js';
import { SHAKE_POWER } from './battle.js';

// レベルと ユメポイント (仕様書「レベルとユメポイント」)。
//   レベルと 経験値は state.levels に 置き、ループで 消える (nextLoop が state を 作り直す)。
//   ユメポイント (YP) は バクだけが もらい、バクだけが 使う。keep.ypTotal (ためた数) と keep.ypSpent (使い道) は ループしても 残る
export const MAX_LEVEL = 50;
export const RESERVE_RATE = 0.5;   // 控えは 経験値が 半分
export const LEVEL_GROWTH = 0.07;  // レベル 1 ごとに もとの値の 7%
export const YP_STEP = 0.05;       // ステータス強化 1 段で ＋5%
export const YP_MAX_STEP = 10;

// 次の レベルまでの 経験値 = round(8 × 今のレベル^1.6)
export function expToNext(lv) {
    return lv >= MAX_LEVEL ? Infinity : Math.round(8 * lv ** 1.6);
}

// ステータス = もとの値 × (1 + 0.07 × (レベル − 1))
export function levelStat(base, lv) {
    return Math.round(base * (1 + LEVEL_GROWTH * (lv - 1)));
}

// レベルが 上がったときの YP: 1、10 の倍数なら さらに 3
export function ypForLevel(lv) {
    return 1 + (lv % 10 === 0 ? 3 : 0);
}

export function levelOf(state, id) {
    return state.levels?.[id] ?? { lv: 1, exp: 0 };
}

// 下の階層ほど 経験値が 多い: 1 + 0.25 × (階層 − 1)
export function layerRate(layer = 1) {
    return 1 + 0.25 * (layer - 1);
}

// 倒した 敵の 経験値 (合計)。本音を 届けた 敵・喰らった 敵も 倒したのと 同じ
export function battleExp(foes, layer = 1) {
    return Math.round(foes.reduce((sum, foe) => sum + (foe.exp ?? 0), 0) * layerRate(layer));
}

// 経験値を 配る。party (先頭 3 体) は そのまま、reserve (控え) は 半分。
// 出来事の配列を返す: { t: 'level', id, lv, moves: [新しく 覚えた 技の 名前], yp }
export function gainExp(state, keep, { party, reserve = [] }, amount) {
    state.levels ??= {};
    const events = [];
    const give = (id, value) => {
        const rec = { ...levelOf(state, id) };
        rec.exp += value;
        while (rec.lv < MAX_LEVEL && rec.exp >= expToNext(rec.lv)) {
            rec.exp -= expToNext(rec.lv);
            rec.lv++;
            const event = { t: 'level', id, lv: rec.lv, moves: newMoves(id, rec.lv), yp: 0 };
            if (id === 'bak') {
                event.yp = ypForLevel(rec.lv);
                keep.ypTotal = (keep.ypTotal ?? 0) + event.yp;
            }
            events.push(event);
        }
        if (rec.lv >= MAX_LEVEL) rec.exp = 0;
        state.levels[id] = rec;
    };
    for (const id of party) give(id, amount);
    for (const id of reserve) give(id, Math.floor(amount * RESERVE_RATE));
    return events;
}

// 個人ユメクイが その レベルで 覚える 技 (レベル 1・8・16・25)
function newMoves(id, lv) {
    return (LEVEL_MOVES[id] ?? []).filter((move) => move.lv === lv).map((move) => move.label);
}

// 今の レベルで 使える 個人ユメクイの 技 (レベル 1 の 技は moves.skill として ユニットに ある)
export function levelMoves(id, lv) {
    return (LEVEL_MOVES[id] ?? []).filter((move) => move.lv > 1 && move.lv <= lv && move.id);
}

// ---- ユメポイント ------------------------------------------------------

export function spentOf(keep) {
    keep.ypSpent ??= { stats: {}, moves: [] };
    return keep.ypSpent;
}

export function ypUsed(keep) {
    const spent = spentOf(keep);
    let used = 0;
    for (const n of Object.values(spent.stats)) used += (n * (n + 1)) / 2;   // n 段目は n YP
    for (const id of spent.moves) used += BAK_YP_MOVES.find((move) => move.id === id)?.cost ?? 0;
    return used;
}

export function ypLeft(keep) {
    return (keep.ypTotal ?? 0) - ypUsed(keep);
}

// ステータス強化の 次の 段の 値段 (10 段 そろったら null)
export function statCost(keep, stat) {
    const n = spentOf(keep).stats[stat] ?? 0;
    return n >= YP_MAX_STEP ? null : n + 1;
}

export function buyStat(keep, stat) {
    const cost = statCost(keep, stat);
    if (!YP_STATS.some((s) => s.id === stat) || cost === null || cost > ypLeft(keep)) return false;
    const spent = spentOf(keep);
    spent.stats[stat] = (spent.stats[stat] ?? 0) + 1;
    return true;
}

// YP で 覚えられる 技の 一覧と、それぞれ 今 覚えられるか。条件 (救った夢・喰らった夢の数) を 満たさない 技は locked
export function ypMoves(keep) {
    const spent = spentOf(keep);
    const { saved, eaten } = keep.growth;
    return BAK_YP_MOVES.map((move) => {
        const locked = (move.saved && saved < move.saved) || (move.eaten && eaten < move.eaten);
        const learned = spent.moves.includes(move.id);
        return { ...move, learned, locked: Boolean(locked), ready: !learned && !locked && move.cost <= ypLeft(keep) };
    });
}

export function buyMove(keep, id) {
    const move = ypMoves(keep).find((m) => m.id === id);
    if (!move || !move.ready) return false;
    spentOf(keep).moves.push(id);
    return true;
}

// 仲間の ユニットに レベルと (バクなら) YP の 強化・YP の 技、(ほかなら) レベルの 技を のせる
export function growUnit(base, keep, state) {
    const { lv } = levelOf(state, base.id);
    let unit = {
        ...base,
        lv,
        maxHp: levelStat(base.maxHp, lv),
        atk: levelStat(base.atk, lv),
        def: levelStat(base.def, lv),
        spd: levelStat(base.spd, lv)
    };
    let extra = [...(base.moves.extra ?? [])];
    if (base.id === 'bak') {
        unit = applyYp(unit, keep, SHAKE_POWER);
        extra = extra.concat(ypMoves(keep).filter((m) => m.learned).map(({ id, label }) => ({ id, label })));
    } else {
        extra = extra.concat(levelMoves(base.id, lv).map(({ id, label }) => ({ id, label })));
    }
    return { ...unit, hp: unit.maxHp, moves: { ...base.moves, extra } };
}

// バクの ステータスに YP の 強化を かける (体力・攻撃・防御は ＋5%/段、ココロは ココロ攻撃の 強さ ＋5%/段)
export function applyYp(unit, keep, shakePower) {
    const stats = spentOf(keep).stats;
    const rate = (stat) => 1 + YP_STEP * (stats[stat] ?? 0);
    const maxHp = Math.round(unit.maxHp * rate('hp'));
    const kokoroBase = shakePower + (unit.kokoro ?? 0);
    return {
        ...unit,
        maxHp,
        hp: maxHp,
        atk: Math.round(unit.atk * rate('atk')),
        def: Math.round(unit.def * rate('def')),
        kokoro: Math.round(kokoroBase * rate('kokoro')) - shakePower
    };
}

// ---- 夢の 階層 -----------------------------------------------------------

// 下の 階層ほど 敵が 強い。ふつうの 敵は 1 階層ごとに ＋15%、本音を持つ ボスは ＋10% (最初の案)
export const LAYER_FOE_STEP = 0.15;
export const LAYER_BOSS_STEP = 0.1;

export function layerFoe(foe, layer = 1) {
    if (layer <= 1) return foe;
    const rate = 1 + (foe.truth ? LAYER_BOSS_STEP : LAYER_FOE_STEP) * (layer - 1);
    const maxHp = Math.round(foe.maxHp * rate);
    return { ...foe, maxHp, hp: maxHp, atk: Math.round(foe.atk * rate), def: Math.round(foe.def * rate) };
}

// たどり着いた 階層を 覚える (その周のあいだ。次の夜から そこで 始められる)
export function reachLayer(state, dream, layer) {
    state.reached ??= {};
    state.reached[dream] = Math.max(state.reached[dream] ?? 1, layer);
}

export function reachedLayer(state, dream) {
    return state.reached?.[dream] ?? 1;
}
