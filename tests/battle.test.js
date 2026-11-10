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

test('コマンド: いちばん上は たたかう・まもる・アイテム・にげる。技は たたかうの中 (まもるは 入らない)', async () => {
    const { TOP_COMMANDS } = await import('../src/core/battle.js');
    assert.deepEqual(TOP_COMMANDS.map((c) => c.label), ['たたかう', 'まもる', 'アイテム', 'にげる']);
    const b = createBattle(bak(), FOES.nanashi, { rng: steady });
    const ids = commands(b).map((c) => c.id);
    assert.ok(ids.includes('attack') && ids.includes('heal'));
    assert.ok(!ids.includes('guard'));
});

test('にげる: ふつうの敵からは にげられる。ボスと にげられない戦いでは 失敗して 敵が 行動する', async () => {
    const { canRun } = await import('../src/core/battle.js');
    const lucky = createBattle(bak(), FOES.nanashi, { rng: () => 0.1 });
    act(lucky, 'run');
    assert.equal(lucky.over, 'flee');
    const unlucky = createBattle(bak(), FOES.nanashi, { rng: () => 0.9 });
    const events = act(unlucky, 'run');
    assert.equal(unlucky.over, null);
    assert.ok(events.some((e) => e.t === 'hit' && e.target === 'ally'), '失敗すると 敵が 行動する');
    const boss = createBattle(bak(), FOES.gakufume, { rng: () => 0.1 });
    assert.ok(!canRun(boss));
    act(boss, 'run');
    assert.equal(boss.over, null, 'ボスからは にげられない');
    const first = createBattle(bak(), [FOES.nanashi, FOES.nanashi], { rng: () => 0.1, noEscape: true });
    act(first, 'run');
    assert.equal(first.over, null, '最初の戦いは にげられない');
});

test('夢双: ガクフメと トゲメトロが パーティに いると 使え、相手に 有利な 属性で 大技。使った 2 体は 1 回 休み', () => {
    const party = [{ ...ALLIES.gakufume }, { ...ALLIES.togemetoro }, { ...ALLIES.bak }];
    const none = createBattle(party, FOES.gakufume, { rng: steady });
    assert.ok(!commands(none).some((c) => c.id === 'musou:duet'), '相性を 持っていないと 出ない');
    const b = createBattle(party, { ...FOES.gakufume, hp: 300, maxHp: 300 }, { rng: steady, musou: ['duet'] });
    assert.ok(commands(b).some((c) => c.id === 'musou:duet'));
    const hp = b.foe.hp;
    const events = act(b, 'musou:duet');
    const hit = events.find((e) => e.t === 'hit' && e.target === 'foe');
    assert.equal(hit.aff, 1.5, 'ガクフメ (哀) 相手には 怒で 攻撃する');
    assert.ok(hp - b.foe.hp > 30, '大技');
    assert.ok(commands(b).find((c) => c.id === 'musou:duet').disabled, '続けては 使えない');
    const rest = act(b, 'attack');
    assert.ok(rest.some((e) => e.t === 'say' && e.text.includes('息切れ')));
    assert.ok(!rest.some((e) => e.t === 'hit' && e.target === 'foe'), '休みの ターンは 攻撃しない');
    const only = createBattle([{ ...ALLIES.gakufume }, { ...ALLIES.bak }], FOES.nanashi, { rng: steady, musou: ['duet'] });
    assert.ok(!commands(only).some((c) => c.id === 'musou:duet'), '2 体 そろって いないと 出ない');
});
