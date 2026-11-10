import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createBattle } from '../src/core/battle.js';
import { createKeep, devour, dreamsTonight, rescue } from '../src/core/calendar.js';
import { chaseStep, createState, isBlocked } from '../src/core/field.js';
import { joinWords, makeSentence, sentenceChoices } from '../src/core/sentence.js';
import { DREAM_LAYERS, MAPS } from '../src/data/maps.js';
import { ALLIES, FOES } from '../src/data/units.js';

test('リクの夢は 3 日 (リクが 倒れた日) から 14 日まで 入れる。活性化を 待たなくていい', () => {
    const state = createState();
    const keep = createKeep();
    state.day = 2;
    assert.ok(!dreamsTonight(state, keep).includes('riku'));
    for (const day of [3, 6, 10, 14]) {
        state.day = day;
        assert.ok(dreamsTonight(state, keep).includes('riku'), `${day} 日`);
    }
    state.status.riku = 'saved';
    assert.ok(!dreamsTonight(state, keep).includes('riku'));
});

test('リクの夢: 3 階層＋最深部。第 1 層の しおれた 壁は 開くまで 通れない', () => {
    assert.equal(DREAM_LAYERS.riku.length, 4);
    const state = createState();
    state.map = 'rikuField';
    const wall = MAPS.rikuField.tiles[2].indexOf('Y');
    assert.ok(isBlocked(state, wall, 2));
    state.flags.rikuWall = true;
    assert.ok(!isBlocked(state, wall, 2));
});

test('リクの本音: 『引っ越し』と『言えなかった』で 文に なる (台本 4-3)', () => {
    assert.equal(joinWords(['引っ越し'], '言えなかった'), FOES.himawarion.truth.answer);
    const state = createState();
    state.words = ['引っ越し', '言えなかった'];
    assert.ok(makeSentence(state, ['引っ越し'], '言えなかった'));
    assert.ok(sentenceChoices(FOES.himawarion.truth, state.sentences).includes(FOES.himawarion.truth.answer));
});

test('リクを 救っても 喰らっても、ミオと カナは 刈り取られない', () => {
    const state = createState();
    state.day = 8;
    const keep = createKeep();
    rescue(state, keep, 'riku', 'himawarion');
    assert.equal(state.status.riku, 'saved');
    assert.equal(state.status.mio, 'idle');
    assert.ok(keep.allies.includes('himawarion'));
    const other = createState();
    other.day = 8;
    devour(other, keep, 'riku');
    assert.equal(other.status.kana, 'idle');
});

test('ヒマワリオンは 空元気: 体力が 減るほど 攻撃が 強い', () => {
    const hit = (hp) => {
        const b = createBattle({ ...ALLIES.bak, hp: 999, maxHp: 999 }, [{ ...FOES.himawarion, hp }], { rng: () => 0.5 });
        return act(b, 'heal').find((e) => e.t === 'hit' && e.target === 'ally').amount;
    };
    assert.ok(hit(20) > hit(120));
});

test('ナイトメアは 壁を すり抜けて ハルに 近づく', () => {
    const tiles = MAPS.rikuField.tiles;
    let at = { x: 9, y: 1 };
    const hal = { x: 9, y: 9 };
    for (let i = 0; i < 20 && (at.x !== hal.x || at.y !== hal.y); i++) at = chaseStep(tiles, at, hal);
    assert.deepEqual(at, hal);
});
