import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeep, dreamsTonight, nextLoop } from '../src/core/calendar.js';
import { createState } from '../src/core/field.js';
import { growCanvas, isNightmare, sightOf, stageOf, startLayers, truthHelp } from '../src/core/canvas.js';
import { sentenceChoices } from '../src/core/sentence.js';
import { FOES } from '../src/data/units.js';

test('活性化の 前は どの夢にも 入れない (絵が 漠然としていて 夢の チャンネルに 引っかからない)', () => {
    const state = createState();
    const keep = createKeep();
    keep.loop = 2;
    for (const day of [2, 3, 6]) {
        state.day = day;
        assert.deepEqual(dreamsTonight(state, keep).filter((d) => d !== 'riku'), [], `${day} 日`);
    }
    state.day = 7;
    assert.deepEqual(dreamsTonight(state, keep).filter((d) => d !== 'riku'), ['mio', 'kana', 'duet']);
    state.day = 10;
    assert.deepEqual(dreamsTonight(state, keep).filter((d) => d !== 'riku'), [], '救える 夜を 過ぎたら 入れない');
});

test('キャンバスの 段階: 入るごとに ＋1、その日に 言葉を 拾っていれば ＋2。5 まで', () => {
    const keep = createKeep();
    assert.equal(stageOf(keep, 'mio'), 1);
    assert.equal(growCanvas(keep, 'mio', false), 2);
    assert.equal(growCanvas(keep, 'mio', true), 4);
    assert.equal(growCanvas(keep, 'mio', true), 5);
    assert.equal(stageOf(keep, 'kana'), 1);
});

test('合体の夢は 2 人の 低いほうの 段階。入ると 2 人とも 上がる。差が 2 以上で 悪夢化', () => {
    const keep = createKeep();
    growCanvas(keep, 'mio', true);
    assert.equal(stageOf(keep, 'duet'), 1);
    assert.ok(isNightmare(keep), 'ミオ 3 と カナ 1');
    growCanvas(keep, 'kana', false);
    assert.ok(!isNightmare(keep), '差が 1 なら 大丈夫');
    growCanvas(keep, 'duet', false);
    assert.deepEqual(keep.canvas, { mio: 4, kana: 3 });
});

test('ループでは 前の周の 最後の 段階 − 1 に 戻る (1 より 下には ならない)', () => {
    const keep = createKeep();
    growCanvas(keep, 'mio', true);
    growCanvas(keep, 'mio', false);
    const prev = createState();
    prev.reached = { mio: 3 };
    nextLoop(keep, prev);
    assert.equal(stageOf(keep, 'mio'), 3);
    assert.equal(stageOf(keep, 'kana'), 1);
    assert.deepEqual(keep.lastReached, { mio: 3 });
});

test('始める 階層: その周に 着いた 階層 / 段階 4 で 前の周の 階層 / 段階 5 で 最深部', () => {
    const state = createState();
    const keep = createKeep();
    keep.lastReached = { mio: 3 };
    assert.equal(startLayers(state, keep, 'mio', 4), 1);
    state.reached = { mio: 2 };
    assert.equal(startLayers(state, keep, 'mio', 4), 2);
    keep.canvas = { mio: 4 };
    assert.equal(startLayers(state, keep, 'mio', 4), 3, '近道');
    keep.canvas = { mio: 5 };
    assert.equal(startLayers(state, keep, 'mio', 4), 4, 'ボスの 部屋まで 一気に');
});

test('夢の中の 見え方: 1 は もや、2 は 地図だけ、3 から 敵と 属性', () => {
    assert.deepEqual(sightOf(1), { fog: true, nearObjects: true, attrs: false });
    assert.deepEqual(sightOf(2), { fog: false, nearObjects: true, attrs: false });
    assert.deepEqual(sightOf(3), { fog: false, nearObjects: false, attrs: true });
});

test('本音: 段階 4 で 失敗の 選択肢が 1 つ減り、段階 5 で 正解が 出る', () => {
    const truth = FOES.gakufume.truth;
    const steady = () => 0.3;
    assert.equal(sentenceChoices(truth, [], { rng: steady }).length, 3);
    const four = sentenceChoices(truth, [], { ...truthHelp(4), rng: steady });
    assert.equal(four.length, 2);
    assert.ok(!four.includes(truth.answer), '文を 作っていなければ 正解は 出ない');
    const five = sentenceChoices(truth, [], { ...truthHelp(5), rng: steady });
    assert.ok(five.includes(truth.answer));
    assert.equal(five.length, 2);
});
