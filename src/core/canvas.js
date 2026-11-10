import { ACTIVE_DAY, LAST_RESCUE_DAY, PAIR } from './days.js';

// 夢の キャンバス (企画書「夢のキャンバス」・仕様書「未実装の仕様 夢のキャンバス」)
//   夢主ごとに 段階 1〜5。その夢に 入るごとに ＋1、その日に 言葉を 拾っていれば さらに ＋1。
//   ループでは「前の周の 最後の 段階 − 1」に 戻る。合体は 2 人の 段階の 差が 2 以上だと 悪夢化
//   キャンバスの 絵は 漠然としているので、夢主の ユメクイが 活性化して「実在」しているときしか
//   夢の チャンネルに 引っかからない → 活性化の 前は どの夢にも 入れない (2026-11-10 ユーザー指定)
export const MAX_STAGE = 5;
export const NIGHTMARE_GAP = 2;
export const NIGHTMARE_RATE = 1.3;   // 悪夢化した 夢の 敵の 強さ (最初の案)
export const SIGHT = 3;              // もやの 中で 見える 広さ (マス)
//   例外 (2026-11-10 ユーザー指定): 漠然と していない 完ぺきな 絵 (段階 5 まで 描き上げて 夢を「知っている」) なら、
//   2 周目などで 活性化の 前でも すぐ 入れて、まだ 活性化していない (弱い) ユメクイと 戦える。合体の夢は 2 人とも 知っているとき
export const DORMANT_FOE_RATE = 0.7;   // 活性化前の ユメクイ (ボス) の 強さ
export const DORMANT_ALLY_RATE = 0.6;  // 活性化前に 仲間にした ユメクイの 強さ (夢のかけらで 活性化するまで)

export const STAGES = [
    null,
    { label: 'ラフ', look: 'ぼんやりした線', effect: 'もやだらけで 地図が 見えない' },
    { label: '線画', look: '線画', effect: '地図の 形が 分かる' },
    { label: '色つき', look: '色つき', effect: 'スイマの 居場所が 見え、ナナシの 属性も 分かる' },
    { label: '陰影つき', look: '陰影つき', effect: '近道が 開く。本音の 失敗の 選択肢が 1 つ 減る' },
    { label: '完成', look: '完成', effect: 'ボスの 部屋まで 一気に 行ける。本音の ヒントが 全部 そろう' }
];

export function canvasOf(keep) {
    keep.canvas ??= {};
    return keep.canvas;
}

// 夢の 段階。合体の 夢は 2 人の うち 低いほう
export function stageOf(keep, dream) {
    const canvas = canvasOf(keep);
    if (dream === 'duet') return Math.min(...PAIR.map((id) => canvas[id] ?? 1));
    return canvas[dream] ?? 1;
}

export function isNightmare(keep) {
    const canvas = canvasOf(keep);
    const [a, b] = PAIR.map((id) => canvas[id] ?? 1);
    return Math.abs(a - b) >= NIGHTMARE_GAP;
}

// 夢から 覚めたら 絵が 描き足される。合体の 夢は 2 人とも
export function growCanvas(keep, dream, pickedToday) {
    const canvas = canvasOf(keep);
    const gain = 1 + (pickedToday ? 1 : 0);
    const ids = dream === 'duet' ? PAIR : [dream];
    keep.known ??= {};
    for (const id of ids) {
        canvas[id] = Math.min(MAX_STAGE, (canvas[id] ?? 1) + gain);
        if (canvas[id] >= MAX_STAGE) keep.known[id] = true;   // 描き上げた 夢は 次の周も 覚えている
    }
    return stageOf(keep, dream);
}

// その夢を 完ぺきに 描ける (前に 段階 5 まで 描き上げた)。合体の夢は 2 人とも
export function knowsDream(keep, dream) {
    const ids = dream === 'duet' ? PAIR : [dream];
    return ids.every((id) => keep.known?.[id]);
}

// ループ: 絵は 真っ白に 戻るが、ハルの 腕は 残る (前の周の 最後 − 1)。たどり着いた 階層も 覚えておく (段階 4 の 近道)
export function loopCanvas(keep, prevState = null) {
    const canvas = canvasOf(keep);
    for (const id of Object.keys(canvas)) canvas[id] = Math.max(1, canvas[id] - 1);
    if (prevState?.reached) keep.lastReached = { ...prevState.reached };
}

// その夜 その夢主の 夢に 入れるか: ユメクイが 活性化していて、夢主が まだ 倒れていない
export function isActive(state) {
    return state.day >= ACTIVE_DAY && state.day <= LAST_RESCUE_DAY;
}

// どの 階層から 始められるか (いちばん 深い 階層)。
//   その周に たどり着いた 階層 / 段階 4 なら 前の周に たどり着いた 階層も / 段階 5 なら 最深部
export function startLayers(state, keep, dream, layers) {
    const stage = stageOf(keep, dream);
    let deepest = state.reached?.[dream] ?? 1;
    if (stage >= 4) deepest = Math.max(deepest, keep.lastReached?.[dream] ?? 1);
    if (stage >= 5) deepest = layers;
    return Math.min(deepest, layers);
}

// 夢の中の 見え方
export function sightOf(stage) {
    return { fog: stage <= 1, nearObjects: stage <= 2, attrs: stage >= 3 };
}

// 本音の 3 択への 効果
export function truthHelp(stage) {
    return { fewerWrong: stage >= 4, allHints: stage >= 5 };
}
