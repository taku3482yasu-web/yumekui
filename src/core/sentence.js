// 夢合わせ (仕様書「夢の階層と言葉」): 拾った 言葉を、前 + 後ろ (または 前 + 前 + 後ろ) で つなげて 文を作る。
// 本音の 3 択には、その夢主の 言葉で 作った文を 持ち込む。正しい文を 作っていないと、正解は 出ない。
// 作った文は state.sentences ({ owner, text })。ループで 消える (前の周で 言い当てた 本音は 最初から 持っている)
import { WORDS } from '../data/words.js';

// 文の 形: 前が 2 つなら「前、前後ろ」(ほんとは、自分で決めたかった)
//   言葉に as が あれば その形で つなぐ (引っ越し → 引っ越しが決まってた。……ハルに、)
export function joinWords(fronts, back) {
    const [a, b] = fronts.map((w) => WORDS[w]?.as ?? w);
    return fronts.length === 2 ? `${a}、${b}${back}` : `${a}${back}`;
}

// つなげられるか: 前 1〜2 つ + 後ろ 1 つ、ぜんぶ 同じ人の 言葉で、持っている 言葉だけ
export function canJoin(words, fronts, back) {
    const all = [...fronts, back];
    if (fronts.length < 1 || fronts.length > 2 || new Set(fronts).size !== fronts.length) return false;
    if (!all.every((w) => words.includes(w) && WORDS[w])) return false;
    if (!fronts.every((w) => WORDS[w].part === 'front') || WORDS[back].part !== 'back') return false;
    return all.every((w) => WORDS[w].owner === WORDS[back].owner);
}

// 文を作って 持つ。新しく 作ったら その文、作れない・もう持っているなら null
export function makeSentence(state, fronts, back) {
    if (!canJoin(state.words, fronts, back)) return null;
    const text = joinWords(fronts, back);
    state.sentences ??= [];
    if (state.sentences.some((s) => s.text === text)) return null;
    const sentence = { owner: WORDS[back].owner, text };
    state.sentences.push(sentence);
    return sentence;
}

// つなぐ 候補: 前の言葉 (後ろの言葉を 持っている 人の 分だけ)
export function frontChoices(words) {
    return words.filter((w) => WORDS[w]?.part === 'front' && words.some((b) => WORDS[b]?.part === 'back' && WORDS[b].owner === WORDS[w].owner));
}

// 前を 選んだあとの 候補: 同じ人の 後ろ (前が 1 つなら、もう 1 つの 前も)
export function nextChoices(words, fronts) {
    const owner = WORDS[fronts[0]].owner;
    const same = words.filter((w) => WORDS[w]?.owner === owner && !fronts.includes(w));
    return {
        backs: same.filter((w) => WORDS[w].part === 'back'),
        fronts: fronts.length < 2 ? same.filter((w) => WORDS[w].part === 'front') : []
    };
}

// 本音の 3 択: その夢主の 文を 持ち込む (最大 3 つ。足りない分は まちがいの 文)。前の周で 言い当てていれば 正解の 文を 持っている
// キャンバスの 段階 4 (fewerWrong): 失敗の 選択肢が 1 つ 減る。段階 5 (allHints): 本音の ヒントが 全部 そろう (正解が 出る)
export function sentenceChoices(truth, sentences = [], { solvedBefore = false, fewerWrong = false, allHints = false, rng = Math.random } = {}) {
    const own = sentences.filter((s) => s.owner === truth.owner).map((s) => s.text);
    if ((solvedBefore || allHints) && !own.includes(truth.answer)) own.unshift(truth.answer);
    const brought = own.includes(truth.answer) ? [truth.answer, ...own.filter((t) => t !== truth.answer)] : own;
    const list = brought.slice(0, 3);
    for (const wrong of shuffle(truth.wrong, rng)) {
        if (list.length >= 3) break;
        if (!list.includes(wrong)) list.push(wrong);
    }
    if (fewerWrong) {
        const drop = list.findLastIndex((t) => t !== truth.answer);
        if (drop >= 0 && list.length > 1) list.splice(drop, 1);
    }
    return shuffle(list, rng);
}

function shuffle(items, rng) {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}
