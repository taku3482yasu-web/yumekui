// 本音の 3 択 (企画書「本音を言い当てる」)
// 情報が足りないと失敗の選択肢しか出ない。情報を集めるか、前の周で言い当てていれば正解が出る

export function hasEnoughInfo(truth, knownWords, solvedBefore = false) {
    if (solvedBefore) return true;
    return truth.words.every((word) => knownWords.includes(word));
}

export function buildChoices(truth, knownWords, { solvedBefore = false, rng = Math.random } = {}) {
    const list = hasEnoughInfo(truth, knownWords, solvedBefore)
        ? [truth.answer, ...pick(truth.wrong, 2, rng)]
        : pick(truth.wrong, 3, rng);
    return shuffle(list, rng);
}

function pick(items, count, rng) {
    return shuffle(items, rng).slice(0, count);
}

function shuffle(items, rng) {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}
