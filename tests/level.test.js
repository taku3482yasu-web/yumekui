import test from 'node:test';
import assert from 'node:assert/strict';
import { act, answer, commands, createBattle } from '../src/core/battle.js';
import { createKeep, nextLoop } from '../src/core/calendar.js';
import { createState } from '../src/core/field.js';
import { bakUnit } from '../src/core/growth.js';
import { battleExp, buyMove, buyStat, expToNext, gainExp, growUnit, levelOf, levelStat, statCost, ypForLevel, ypLeft, ypMoves, ypUsed } from '../src/core/level.js';
import { ALLIES, FOES } from '../src/data/units.js';

const steady = () => 0.5;

test('経験値の式: レベル1→2 は 8、10→11 は 318、49→50 は 約4,060', () => {
    assert.equal(expToNext(1), 8);
    assert.equal(expToNext(10), 318);
    assert.equal(expToNext(49), 4050, "仕様書の 例は 約4,060");
    assert.equal(expToNext(50), Infinity);
});

test('ステータス: レベル50で もとの値の 約4.4倍 (バクの体力 60 → 266)', () => {
    assert.equal(levelStat(60, 1), 60);
    assert.equal(levelStat(60, 50), 266);
});

test('YP: 1 レベルで 1、10 の倍数で さらに 3。レベル50までに 64', () => {
    let total = 0;
    for (let lv = 2; lv <= 50; lv++) total += ypForLevel(lv);
    assert.equal(ypForLevel(10), 4);
    assert.equal(total, 64);
});

test('敵の 経験値は 仕様書の 表のとおり。合体ボスは 2 羽で 250', () => {
    assert.equal(FOES.suima.exp, 5);
    assert.equal(FOES.nanashi.exp, 6);
    assert.equal(FOES.hari.exp, 9);
    assert.equal(FOES.gakufume.exp, 120);
    assert.equal(FOES.duet.exp, 250);
    assert.equal(battleExp([FOES.nanashi, FOES.nanashi]), 12);
    assert.equal(battleExp([FOES.suima], 3), 8, '第3層は 1.5倍');
});

test('経験値を 配る: パーティは そのまま、控えは 半分。バクだけ YP が たまる', () => {
    const state = createState();
    const keep = createKeep();
    const events = gainExp(state, keep, { party: ['bak', 'gakufume'], reserve: ['togemetoro'] }, 120);
    assert.equal(levelOf(state, 'bak').lv, levelOf(state, 'gakufume').lv);
    assert.ok(levelOf(state, 'togemetoro').lv < levelOf(state, 'bak').lv, '控えは 育ちが 遅い');
    const bakUps = events.filter((e) => e.id === 'bak');
    assert.ok(bakUps.length > 0);
    assert.equal(keep.ypTotal, bakUps.reduce((sum, e) => sum + e.yp, 0));
    assert.ok(events.filter((e) => e.id !== 'bak').every((e) => e.yp === 0), 'ほかの ユメクイは YP を もらわない');
});

test('レベル8で 個人ユメクイが 技を 覚える (ガクフメ: なみだ音符)', () => {
    const state = createState();
    const keep = createKeep();
    let learned = [];
    for (let i = 0; i < 30 && levelOf(state, 'gakufume').lv < 8; i++) {
        learned = learned.concat(gainExp(state, keep, { party: ['gakufume'] }, 40).flatMap((e) => e.moves));
    }
    assert.ok(learned.includes('なみだ音符'));
    const unit = growUnit(ALLIES.gakufume, keep, state);
    assert.ok(unit.moves.extra.some((m) => m.id === 'tearnote'));
    assert.ok(unit.atk > ALLIES.gakufume.atk, 'レベルで 強くなる');
});

test('レベルは ループで 1 に戻り、YP と YP で のばした力・技は 残る', () => {
    let state = createState();
    const keep = createKeep();
    gainExp(state, keep, { party: ['bak'] }, 400);
    assert.ok(levelOf(state, 'bak').lv > 5);
    assert.ok(buyStat(keep, 'atk'));
    const total = keep.ypTotal;
    state = nextLoop(keep);
    assert.equal(levelOf(state, 'bak').lv, 1);
    assert.equal(keep.ypTotal, total);
    assert.equal(keep.ypSpent.stats.atk, 1);
    const unit = growUnit(bakUnit(keep), keep, state);
    assert.equal(unit.atk, Math.round(bakUnit(keep).atk * 1.05));
});

test('YP の 値段: n 段目は n YP、10 段まで。技は 条件と 値段', () => {
    const keep = createKeep();
    keep.ypTotal = 6;
    assert.equal(statCost(keep, 'hp'), 1);
    assert.ok(buyStat(keep, 'hp'));
    assert.ok(buyStat(keep, 'hp'));
    assert.equal(ypUsed(keep), 3);
    assert.equal(ypLeft(keep), 3);
    assert.ok(buyMove(keep, 'pillow'));
    assert.equal(ypLeft(keep), 0);
    assert.ok(!buyMove(keep, 'drowsy'), 'YP が たりない');
    keep.ypTotal = 100;
    assert.ok(!buyMove(keep, 'sunblanket'), '救った夢 3 が 必要');
    keep.growth.saved = 3;
    assert.ok(buyMove(keep, 'sunblanket'));
    assert.ok(ypMoves(keep).find((m) => m.id === 'gulp').locked);
    for (let i = 0; i < 12; i++) buyStat(keep, 'def');
    assert.equal(keep.ypSpent.stats.def, 10);
    assert.equal(statCost(keep, 'def'), null);
});

test('YP の 技は バクの 技に 出る', () => {
    const state = createState();
    const keep = createKeep();
    keep.ypTotal = 20;
    buyMove(keep, 'crush');
    const unit = growUnit(bakUnit(keep), keep, state);
    const b = createBattle(unit, [FOES.nanashi], { rng: steady });
    assert.ok(commands(b).some((c) => c.id === 'crush'));
});

test('ゆめくずし: 1 ターン ためて、次の 行動で はなつ', () => {
    const b = createBattle({ ...ALLIES.bak, hp: 300, maxHp: 300, atk: 20 }, [{ ...FOES.muresuima, truth: null, hp: 999, maxHp: 999 }], { rng: steady });
    act(b, 'crush');
    assert.ok(b.ally.charging);
    assert.deepEqual(commands(b).map((c) => c.id), ['release']);
    const before = b.foe.hp;
    const events = act(b, 'attack');
    assert.ok(!b.ally.charging);
    const hit = events.find((e) => e.t === 'hit' && e.target === 'foe');
    assert.ok(hit.amount > 25, '威力160');
    assert.equal(b.foe.hp, before - hit.amount);
});

test('まるのみ: 体力 3割以下の 雑魚だけ 一口。経験値 2倍', () => {
    const b = createBattle({ ...ALLIES.bak, hp: 300, maxHp: 300 }, [FOES.nanashi], { rng: steady });
    act(b, 'gulp');
    assert.ok(!b.foe.down, '元気な 敵は 飲みこめない');
    b.foe.hp = 5;
    b.ally.wait = 0;
    act(b, 'gulp');
    assert.equal(b.over, 'win');
    assert.equal(battleExp(b.foes.map((f) => ({ exp: f.exp * (f.expRate ?? 1) }))), 12);
});

test('よりそう: 本音を 外しても 相手が 強くならない', () => {
    const b = createBattle({ ...ALLIES.bak, hp: 300, maxHp: 300 }, [FOES.gakufume], { rng: steady });
    act(b, 'nestle');
    b.foe.chance = true;
    const atk = b.foe.atk;
    answer(b, 'まちがい');
    assert.equal(b.foe.atk, atk);
});

test('悪夢ばらい と ひだまり毛布: 味方全員が 回復する', () => {
    const party = [{ ...ALLIES.bak, hp: 10, maxHp: 100 }, { ...ALLIES.gakufume, hp: 10, maxHp: 100 }];
    const b = createBattle(party, [{ ...FOES.nanashi, atk: 1 }], { rng: steady });
    act(b, 'dispel');
    assert.ok(b.party[1].hp >= 40, '控えも 30% 回復');
    const b2 = createBattle([{ ...ALLIES.bak, hp: 10, maxHp: 100 }], [{ ...FOES.nanashi, atk: 1 }], { rng: steady });
    act(b2, 'sunblanket');
    assert.equal(b2.regen, 2);
});

test('ねぼけまなこ: 3 ターン 相手の 攻撃が 下がる', () => {
    const foe = { ...FOES.hari, atk: 40 };
    const b = createBattle({ ...ALLIES.bak, hp: 999, maxHp: 999 }, [foe], { rng: steady });
    const plain = act(createBattle({ ...ALLIES.bak, hp: 999, maxHp: 999 }, [foe], { rng: steady }), 'heal').find((e) => e.t === 'hit');
    const events = act(b, 'drowsy');
    const hit = events.find((e) => e.t === 'hit' && e.target === 'ally');
    assert.equal(b.foe.drowsy, 2);
    assert.ok(hit.amount < plain.amount, '下がった 攻撃');
});
