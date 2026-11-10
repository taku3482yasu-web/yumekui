import test from 'node:test';
import assert from 'node:assert/strict';
import { act, aliveFoes, answer, chanceFoe, commands, createBattle, needsTarget, setTarget } from '../src/core/battle.js';
import { ALLIES, FOES } from '../src/data/units.js';

const steady = () => 0.5;
const bak = () => ({ ...ALLIES.bak, hp: 200, maxHp: 200, atk: 30 });

test('敵複数: ねらった敵だけに 当たり、倒すと 次の敵へ ねらいが 移る。全員 倒すと 勝ち', () => {
    const b = createBattle(bak(), [FOES.nanashi, FOES.nanashi], { rng: steady });
    assert.equal(b.foes.length, 2);
    assert.ok(needsTarget(b));
    setTarget(b, b.foes[1]);
    const events = act(b, 'attack');
    const hit = events.find((e) => e.t === 'hit' && e.target === 'foe');
    assert.equal(hit.index, 1, '2 体目に 当たる');
    assert.equal(b.foes[0].hp, FOES.nanashi.hp, '1 体目は 無傷');
    for (let i = 0; i < 20 && !b.foes[1].down; i++) act(b, 'attack');
    assert.ok(b.foes[1].down);
    assert.equal(b.foe, b.foes[0], 'ねらいが 残った敵へ 移る');
    assert.ok(!needsTarget(b), '1 体なら 選ばなくてよい');
    for (let i = 0; i < 20 && !b.over; i++) act(b, 'attack');
    assert.equal(b.over, 'win');
});

test('敵複数: 敵の番では 立っている敵が みんな 行動する', () => {
    const b = createBattle(bak(), [FOES.nanashi, FOES.hari, FOES.onpu], { rng: steady });
    const events = act(b, 'guard');
    assert.equal(events.filter((e) => e.t === 'hit' && e.target === 'ally').length, 3);
    b.foes[1].down = true;
    const fewer = act(b, 'guard');
    assert.equal(fewer.filter((e) => e.t === 'hit' && e.target === 'ally').length, 2, '倒れた敵は 行動しない');
});

test('敵複数: ほそいソロは ねらった敵だけを 眠らせる', () => {
    const b = createBattle({ ...ALLIES.gakufume, hp: 200, maxHp: 200 }, [FOES.nanashi, FOES.hari], { rng: steady });
    setTarget(b, b.foes[1]);
    const events = act(b, 'sleep');
    const attackers = events.filter((e) => e.t === 'hit' && e.target === 'ally').map((e) => e.from);
    assert.deepEqual(attackers, [0], '眠った 2 体目は 行動しない');
});

test('相方が 倒れると、残った敵の 攻撃が 上がる (デュエットの 決まり)', () => {
    const bird = (attr) => ({ ...FOES.nanashi, id: `bird-${attr}`, name: `${attr}の鳥`, attr, partnerRage: true });
    const b = createBattle(bak(), [bird('哀'), bird('怒')], { rng: steady });
    const atk = b.foes[1].atk;
    for (let i = 0; i < 20 && !b.foes[0].down; i++) act(b, 'attack');
    assert.ok(b.foes[1].atk > atk, '怒る');
    assert.ok(b.foes[1].raged);
});

test('本音を持つ敵が 2 体: 1 体ずつ 言い当てて、両方 届いたら 救える', () => {
    const one = { ...FOES.togemetoro, hp: 1 };
    const two = { ...FOES.gakufume, hp: 1 };
    const b = createBattle(bak(), [one, two], { rng: steady });
    assert.ok(commands(b).some((c) => c.id === 'shake'));
    act(b, 'attack');                       // 1 体目の 体力が尽きて チャンス
    assert.equal(chanceFoe(b), b.foes[0]);
    const first = answer(b, one.truth.answer);
    assert.ok(first.some((e) => e.t === 'solved' && e.index === 0));
    assert.equal(b.over, null, 'まだ 終わらない');
    assert.equal(aliveFoes(b).length, 1);
    setTarget(b, b.foes[1]);
    act(b, 'attack');
    assert.equal(chanceFoe(b), b.foes[1]);
    answer(b, two.truth.answer);
    assert.equal(b.over, 'truth');
});

test('本音のない 敵に ココロ攻撃しても 揺れない', () => {
    const b = createBattle(bak(), [FOES.nanashi, FOES.gakufume], { rng: steady });
    setTarget(b, b.foes[0]);
    const events = act(b, 'shake');
    assert.ok(!events.some((e) => e.t === 'shake'));
});
