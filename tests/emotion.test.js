import test from 'node:test';
import assert from 'node:assert/strict';
import { act, commands, createBattle } from '../src/core/battle.js';
import { createKeep } from '../src/core/calendar.js';
import { addEmotion, applyEmotion, declineReborn, emotionsOf, gainEmotions, pendingReborn, reborn, topEmotion } from '../src/core/emotion.js';
import { ALLIES, FOES } from '../src/data/units.js';

const steady = () => 0.5;
const gaku = () => ({ ...ALLIES.gakufume });

test('たまり方: 雑魚 ＋2、ボス ＋10、合体ボスは ＋8 ずつ、とどめは 2 倍。救うと 喜 ＋5、喰らうと バクの 怒 ＋10', () => {
    const keep = createKeep();
    const party = [{ ...ALLIES.bak, native: '楽' }, { ...ALLIES.gakufume, native: '哀' }];
    gainEmotions(keep, party, [{ ...FOES.nanashi, finisher: 'bak' }], 'win');
    assert.equal(emotionsOf(keep, 'bak').喜, 4);
    assert.equal(emotionsOf(keep, 'gakufume').喜, 2);
    gainEmotions(keep, party, [FOES.gakufume], 'truth');
    assert.equal(emotionsOf(keep, 'gakufume').哀, 10);
    assert.equal(emotionsOf(keep, 'gakufume').喜, 7);
    gainEmotions(keep, party, [FOES.duetDo, FOES.duetAi], 'truth');
    assert.equal(emotionsOf(keep, 'gakufume').怒, 8);
    assert.equal(emotionsOf(keep, 'gakufume').哀, 18);
    gainEmotions(keep, party, [FOES.togemetoro], 'devour');
    assert.equal(emotionsOf(keep, 'bak').怒, 8 + 10 + 10);
});

test('いちばん高い 感情: 同じ点なら 本来の 属性。30 で 傾き、60 で 感情技、80 で 気まぐれ', () => {
    const keep = createKeep();
    Object.assign(emotionsOf(keep, 'gakufume'), { 怒: 20, 哀: 20 });
    assert.equal(topEmotion(keep, 'gakufume', '哀').attr, '哀');
    emotionsOf(keep, 'gakufume').怒 = 35;
    let unit = applyEmotion(gaku(), keep);
    assert.equal(unit.atk, Math.round(ALLIES.gakufume.atk * 1.1), '怒の 傾き');
    assert.ok(!unit.moves.extra?.some((m) => m.id === 'emo:怒'));
    emotionsOf(keep, 'gakufume').怒 = 65;
    unit = applyEmotion(gaku(), keep);
    assert.equal(unit.atk, Math.round(ALLIES.gakufume.atk * 1.2), '傾きが 2 倍');
    assert.ok(unit.moves.extra.some((m) => m.label === 'いかりの火'));
    assert.equal(unit.whim, undefined);
    emotionsOf(keep, 'gakufume').怒 = 85;
    assert.equal(applyEmotion(gaku(), keep).whim, '怒');
});

test('100 で 夢変わり。断ると 99 で 止まる。姿の ない 組み合わせは 99 まで', () => {
    const keep = createKeep();
    addEmotion(keep, 'gakufume', '哀', '怒', 120);
    assert.equal(emotionsOf(keep, 'gakufume').怒, 100);
    addEmotion(keep, 'gakufume', '哀', '楽', 120);
    assert.equal(emotionsOf(keep, 'gakufume').楽, 99, 'ユラガクフメは まだ ない');
    const units = [applyEmotion(gaku(), keep)];
    assert.deepEqual(pendingReborn(keep, units), [{ id: 'gakufume', attr: '怒', sublime: false }]);
    declineReborn(keep, 'gakufume', '怒');
    assert.equal(emotionsOf(keep, 'gakufume').怒, 99);
    assert.deepEqual(pendingReborn(keep, units), []);
});

test('夢変わり: 属性と 名前が 変わり、技を 1 つ 覚え、感情は 1 本 (200 で 夢現)', () => {
    const keep = createKeep();
    reborn(keep, 'gakufume', '怒', '哀');
    let unit = applyEmotion(gaku(), keep);
    assert.equal(unit.name, 'アラガクフメ');
    assert.equal(unit.attr, '怒');
    assert.ok(unit.moves.extra.some((m) => m.label === '燃える大合奏'));
    assert.ok(Object.values(emotionsOf(keep, 'gakufume')).every((v) => v === 0));
    addEmotion(keep, 'gakufume', '哀', '喜', 150);
    addEmotion(keep, 'gakufume', '哀', '楽', 150);
    assert.equal(keep.reborn.gakufume.point, 200);
    unit = applyEmotion(gaku(), keep);
    assert.ok(unit.moves.extra.some((m) => m.label.includes('終わらない協奏曲')));
});

test('夢昇華: 本来と 同じ 感情が 100。属性は そのまま、全ステータス ＋15%', () => {
    const keep = createKeep();
    reborn(keep, 'togemetoro', '怒', '怒');
    const unit = applyEmotion({ ...ALLIES.togemetoro }, keep);
    assert.equal(unit.name, 'プレスト');
    assert.equal(unit.attr, '怒');
    assert.equal(unit.maxHp, Math.round(ALLIES.togemetoro.maxHp * 1.15));
});

test('夢現は バトルで 1 度だけ', () => {
    const keep = createKeep();
    reborn(keep, 'togemetoro', '怒', '怒');
    keep.reborn.togemetoro.point = 200;
    const unit = { ...applyEmotion({ ...ALLIES.togemetoro }, keep), hp: 500, maxHp: 500 };
    const b = createBattle(unit, [{ ...FOES.muresuima, truth: null, hp: 999, maxHp: 999 }], { rng: steady });
    const id = 'utsutsu:togemetoro';
    const events = act(b, id);
    assert.equal(events.filter((e) => e.t === 'hit' && e.target === 'foe').length, 6, '威力60を 6回');
    assert.ok(commands(b).find((c) => c.id === id).disabled);
});

test('気まぐれ: 哀は 体力が 半分を 切ると 勝手に まもる、楽は 遊ぶことも ある', () => {
    const keep = createKeep();
    emotionsOf(keep, 'gakufume').哀 = 90;
    const unit = { ...applyEmotion(gaku(), keep), hp: 10, maxHp: 100 };
    const b = createBattle(unit, [{ ...FOES.nanashi, atk: 1 }], { rng: () => 0.1 });
    act(b, 'attack');
    assert.equal(b.foe.hp, FOES.nanashi.hp, '攻撃しなかった');
    emotionsOf(keep, 'togemetoro').楽 = 90;
    const fun = createBattle({ ...applyEmotion({ ...ALLIES.togemetoro }, keep), hp: 100, maxHp: 100 }, [{ ...FOES.nanashi, atk: 1 }], { rng: () => 0.1 });
    const events = act(fun, 'attack');
    assert.ok(events.some((e) => e.t === 'say' && e.text.includes('遊び')));
});

test('楽の 傾き: ときどき 攻撃を かわす', () => {
    const keep = createKeep();
    emotionsOf(keep, 'bak').楽 = 40;
    const unit = { ...applyEmotion({ ...ALLIES.bak }, keep), hp: 100, maxHp: 100 };
    assert.equal(unit.dodge, 0.1);
    const b = createBattle(unit, [FOES.hari], { rng: () => 0.05 });
    const events = act(b, 'guard');
    assert.ok(events.some((e) => e.t === 'say' && e.text.includes('かわした')));
});
