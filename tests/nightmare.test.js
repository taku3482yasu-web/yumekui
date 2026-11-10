import test from 'node:test';
import assert from 'node:assert/strict';
import { act, commands, createBattle } from '../src/core/battle.js';
import { advance, createKeep, dreamsTonight, sleepAfterNightmare } from '../src/core/calendar.js';
import { WAKE_DAY } from '../src/core/days.js';
import { createState } from '../src/core/field.js';
import { ALLIES, FOES } from '../src/data/units.js';
import { LINES } from '../src/scenes/story.js';

test('ナイトメア戦: こちらの 攻撃は 1 しか 入らず、にげられず、数ターンで 必ず 負ける', () => {
    const b = createBattle([{ ...ALLIES.bak, hp: 120, maxHp: 120, atk: 80 }], [FOES.nightmare], { rng: () => 0.5, noEscape: true });
    const first = act(b, 'attack').find((e) => e.t === 'hit' && e.target === 'foe');
    assert.equal(first.amount, 1);
    assert.ok(!commands(b).some((c) => c.id === 'truth'), '本音の 選択肢は 出ない');
    const run = act(b, 'run');
    assert.ok(run.some((e) => e.text === '足が 動かない……！'));
    for (let i = 0; i < 10 && !b.over; i++) act(b, 'attack');
    assert.equal(b.over, 'lose');
});

test('負けると 12 日まで 眠る。救える 夜を 過ぎた 夢主は 倒れたまま。残りは 夢に 入れない', () => {
    const state = createState();
    Object.assign(state, { day: 7, phase: 'night' });
    state.status.mio = 'saved';
    state.status.kana = 'reaped';
    sleepAfterNightmare(state, WAKE_DAY);
    assert.equal(advance(state), 'morning');
    assert.equal(state.day, 12);
    assert.ok(state.flags.hospitalNext);
    assert.deepEqual(dreamsTonight(state, createKeep()), [], 'リクの 夢にも 入れない');
    const both = createState();
    Object.assign(both, { day: 9, phase: 'night' });
    sleepAfterNightmare(both, WAKE_DAY);
    assert.equal(both.status.mio, 'broken');
    assert.equal(both.status.riku, 'idle', 'リクは 眠ったまま');
});

test('仲間に するとき 夢主が ユメクイと 話す 場面が どの夢にも ある', () => {
    for (const id of ['mio', 'kana', 'duet', 'riku']) assert.ok(LINES.overcome[id].length >= 4, id);
});
