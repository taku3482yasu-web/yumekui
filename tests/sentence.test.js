import test from 'node:test';
import assert from 'node:assert/strict';
import { canJoin, frontChoices, joinWords, makeSentence, nextChoices, sentenceChoices } from '../src/core/sentence.js';
import { createState } from '../src/core/field.js';
import { FOES } from '../src/data/units.js';
import { WORDS } from '../src/data/words.js';
import { MAPS } from '../src/data/maps.js';

const withWords = (...words) => Object.assign(createState(), { words });

test('夢合わせ: 前 + 後ろ、前 + 前 + 後ろ で 文になる', () => {
    assert.equal(joinWords(['一緒に'], '吹きたかった'), '一緒に吹きたかった');
    assert.equal(joinWords(['ほんとは', '自分で'], '決めたかった'), 'ほんとは、自分で決めたかった');
    assert.equal(joinWords(['ほんとは', '自分で'], '決めたかった'), FOES.muresuima.truth.answer);
    assert.equal(joinWords(['一緒に'], '吹きたかった'), FOES.gakufume.truth.answer);
    assert.equal(joinWords(['相談して'], 'ほしかった'), FOES.togemetoro.truth.answer);
});

test('夢合わせ: 持っていない言葉・ちがう人の言葉・前と後ろの 取りちがえは つなげない', () => {
    const state = withWords('一緒に', '吹きたかった', '相談して', 'ほしかった');
    assert.ok(canJoin(state.words, ['一緒に'], '吹きたかった'));
    assert.ok(!canJoin(state.words, ['一緒に'], 'ほしかった'), 'ミオと カナの 言葉は まぜない');
    assert.ok(!canJoin(state.words, ['一緒に'], 'やめたかった'), '持っていない');
    assert.ok(!canJoin(state.words, ['吹きたかった'], '一緒に'), '前と 後ろが 逆');
});

test('夢合わせ: 作った文を 持ち、同じ文は 2 度 作れない。候補は 同じ人の 言葉だけ', () => {
    const state = withWords('一緒に', '吹きたかった', 'やめたかった', '相談して');
    assert.deepEqual(frontChoices(state.words), ['一緒に'], 'カナの 後ろの言葉が ないので 相談しては まだ 出ない');
    assert.deepEqual(nextChoices(state.words, ['一緒に']).backs, ['吹きたかった', 'やめたかった']);
    assert.deepEqual(makeSentence(state, ['一緒に'], 'やめたかった'), { owner: 'mio', text: '一緒にやめたかった' });
    assert.equal(makeSentence(state, ['一緒に'], 'やめたかった'), null);
    assert.equal(state.sentences.length, 1);
});

test('本音の 3 択: 正しい文を 作っていないと 正解は 出ない。作れば 出る。前の周で 言い当てていれば 最初から 出る', () => {
    const truth = FOES.gakufume.truth;
    const state = withWords('一緒に', '吹きたかった', 'やめたかった');
    makeSentence(state, ['一緒に'], 'やめたかった');
    for (let i = 0; i < 30; i++) {
        const list = sentenceChoices(truth, state.sentences);
        assert.equal(list.length, 3);
        assert.ok(!list.includes(truth.answer));
        assert.ok(list.includes('一緒にやめたかった'), '作った文は 持ち込まれる');
    }
    makeSentence(state, ['一緒に'], '吹きたかった');
    assert.ok(sentenceChoices(truth, state.sentences).includes(truth.answer));
    assert.ok(sentenceChoices(truth, [], { solvedBefore: true }).includes(truth.answer));
    assert.ok(!sentenceChoices(truth, [{ owner: 'kana', text: truth.answer }]).includes(truth.answer), 'ほかの人の 文は 持ち込まない');
});

test('夢で 拾える 言葉は ぜんぶ 前か 後ろが 決まっていて、まちがいの 言葉も 拾える', () => {
    for (const map of Object.values(MAPS)) {
        for (const o of map.objects.filter((x) => x.kind === 'word')) assert.ok(WORDS[o.word], `${map.id} の ${o.word}`);
    }
    const picked = Object.values(MAPS).flatMap((m) => m.objects.filter((o) => o.kind === 'word').map((o) => o.word));
    assert.ok(picked.includes('やめたかった') && picked.includes('くやしかった'));
});
