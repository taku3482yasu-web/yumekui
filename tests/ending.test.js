import test from 'node:test';
import assert from 'node:assert/strict';
import { act, commands, createBattle } from '../src/core/battle.js';
import { createKeep } from '../src/core/calendar.js';
import { createState } from '../src/core/field.js';
import { absorbed, isFinalLoop, kizunaFriends, routeOf } from '../src/core/ending.js';
import { ALLIES, FOES } from '../src/data/units.js';

const bak = () => ({ ...ALLIES.bak, hp: 999, maxHp: 999, atk: 30 });

test('終幕は 3 周目の 14 日の夜', () => {
    const keep = createKeep();
    keep.loop = 2;
    assert.ok(!isFinalLoop(keep));
    keep.loop = 3;
    assert.ok(isFinalLoop(keep));
});

test('ルート: グッド = 喰らわず 全員 (ミオ・カナは 合体で) 救う / ユメクイ = 全部 喰らう / ノーマル = それ以外', () => {
    const keep = createKeep();
    const state = createState();
    Object.assign(state.status, { mio: 'saved', kana: 'saved', riku: 'saved' });
    assert.equal(routeOf(state, keep), 'normal', '合体で 救っていない');
    state.flags.duetSaved = true;
    assert.equal(routeOf(state, keep), 'good');
    keep.eaten = ['mio'];
    assert.equal(routeOf(state, keep), 'normal', '1 人でも 喰らうと グッドには ならない');
    keep.eaten = ['mio', 'kana', 'riku'];
    assert.equal(routeOf(state, keep), 'yumekui');
});

test('グッド: キズナ攻撃 (救った 仲間 1 人 1 回) で ラスボスに 挑み、3 人 そろえば 倒せる', () => {
    const state = createState();
    Object.assign(state.status, { mio: 'saved', kana: 'saved', riku: 'saved' });
    const b = createBattle(bak(), [FOES.nemuriboshi], { rng: () => 0.5, kizuna: kizunaFriends(state) });
    const plain = act(createBattle(bak(), [FOES.nemuriboshi], { rng: () => 0.5 }), 'attack').find((e) => e.t === 'hit' && e.target === 'foe');
    assert.ok(plain.amount <= 2, 'ふつうの 攻撃は ほとんど 効かない');
    const first = act(b, 'kizuna');
    assert.deepEqual(first[0], { t: 'kizuna', name: 'ミオ' }, '最初に カットインの 出来事 (だれの 横顔か)');
    for (let i = 0; i < 2; i++) act(b, 'kizuna');
    assert.equal(b.over, 'win');
});

test('ノーマル: キズナ攻撃は 出るが 使えない。第 2 形態は 救えなかった 人の ユメクイを 吸う', () => {
    const b = createBattle(bak(), [FOES.nightmareFinal], { kizuna: [] });
    assert.ok(commands(b).find((c) => c.id === 'kizuna').disabled);
    const state = createState();
    state.status.mio = 'saved';
    assert.deepEqual(absorbed(state), ['トゲメトロ', 'ヒマワリオン']);
});

test('ユメクイ: バクの 専用の 技「夢喰い」で ラスボスを 喰らって 終わる', () => {
    const b = createBattle(bak(), [FOES.nemuriboshi], { dreamEat: true });
    assert.equal(commands(b)[0].id, 'dreameat');
    act(b, 'dreameat');
    assert.equal(b.over, 'eatBoss');
    const other = createBattle({ ...ALLIES.gakufume, hp: 99, maxHp: 99 }, [FOES.nemuriboshi], { dreamEat: true });
    assert.ok(!commands(other).some((c) => c.id === 'dreameat'), 'バクだけ');
});
