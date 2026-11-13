import test from 'node:test';
import assert from 'node:assert/strict';
import { affinity, damage } from '../src/core/rules.js';
import { buildChoices } from '../src/core/truth.js';
import { act, answer, commands, createBattle } from '../src/core/battle.js';
import { createState, isBlocked, objectAt, pickWord, step } from '../src/core/field.js';
import { BAK, FOES } from '../src/data/units.js';
import { MAPS } from '../src/data/maps.js';
import { advance, createKeep, dateLabel, devour, dreamsTonight, nextLoop, rescue } from '../src/core/calendar.js';
import { bakUnit, grow, MAX_GROWTH } from '../src/core/growth.js';
import { ALLIES } from '../src/data/units.js';
import { actionOf, DEFAULT_KEYS, rebind } from '../src/core/keys.js';

const truth = FOES.muresuima.truth;

const seeded = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};

test('相性は 喜→怒→哀→楽→喜 の順に強い', () => {
    assert.equal(affinity('喜', '怒'), 1.5);
    assert.equal(affinity('怒', '哀'), 1.5);
    assert.equal(affinity('哀', '楽'), 1.5);
    assert.equal(affinity('楽', '喜'), 1.5);
    assert.equal(affinity('怒', '喜'), 0.75);
    assert.equal(affinity('喜', '哀'), 1);
});

test('ダメージは 最低 1', () => {
    assert.equal(damage({ atk: 1, attr: '喜' }, { def: 99, attr: '喜' }, 100, () => 0.5), 1);
});

test('情報が足りないと 正解は出ない', () => {
    for (let i = 0; i < 50; i++) {
        const list = buildChoices(truth, ['ほんとは', '自分で']);
        assert.equal(list.length, 3);
        assert.ok(!list.includes(truth.answer));
    }
});

test('言葉がそろうと 正解が出る', () => {
    const list = buildChoices(truth, truth.words);
    assert.equal(list.length, 3);
    assert.ok(list.includes(truth.answer));
});

test('前の周で言い当てた相手は 情報なしでも 正解が出る', () => {
    assert.ok(buildChoices(truth, [], { solvedBefore: true }).includes(truth.answer));
});

function playBoss(seed) {
    const b = createBattle(BAK, FOES.muresuima, { rng: seeded(seed) });
    for (let turn = 0; turn < 60 && !b.over; turn++) {
        if (b.chance) { answer(b, truth.answer); break; }
        const healReady = !commands(b).find((c) => c.id === 'heal').disabled;
        const next = b.foe.pattern[b.step % b.foe.pattern.length];
        if (next === 'swirl') act(b, 'guard');
        else if (b.ally.hp < 25 && healReady) act(b, 'heal');
        else act(b, 'shake');
    }
    return b;
}

test('ふつうに戦えば ボスに ほぼ勝てる', () => {
    let wins = 0;
    for (let seed = 1; seed <= 300; seed++) if (playBoss(seed).over === 'truth') wins++;
    assert.ok(wins >= 285, `勝率 ${wins}/300`);
});

test('ココロ攻撃で ゆらぎが満ちると 本音を選べる', () => {
    const b = createBattle(BAK, FOES.muresuima, { rng: () => 0.1 });
    act(b, 'shake');
    act(b, 'shake');
    assert.equal(b.chance, false);
    act(b, 'shake');
    assert.equal(b.chance, true);
    assert.equal(commands(b)[0].id, 'truth');
});

test('外すと 相手が強くなるが バトルは続く', () => {
    const b = createBattle(BAK, FOES.muresuima, { rng: () => 0.1 });
    b.chance = true;
    const atk = b.foe.atk;
    answer(b, 'べつに、どれでもよかった');
    assert.ok(b.foe.atk > atk);
    assert.equal(b.chance, false);
    assert.equal(b.over, null);
});

test('本音を持つ相手は HP が尽きても 消えず チャンスになる', () => {
    const b = createBattle(BAK, FOES.muresuima, { rng: () => 0.5 });
    b.foe.hp = 1;
    act(b, 'attack');
    assert.equal(b.foe.hp, 1);
    assert.equal(b.chance, true);
    assert.equal(b.over, null);
});

test('雑魚は 倒せる。ココロ攻撃は 出ない', () => {
    const b = createBattle(BAK, FOES.nanashi, { rng: () => 0.5 });
    assert.ok(!commands(b).some((c) => c.id === 'shake'));
    for (let i = 0; i < 5 && !b.over; i++) act(b, 'attack');
    assert.equal(b.over, 'win');
});

test('悪夢を食べると しばらく 使えない', () => {
    const b = createBattle(BAK, FOES.nanashi, { rng: () => 0.5 });
    b.ally.hp = 10;
    act(b, 'heal');
    assert.ok(b.ally.hp > 10);
    assert.equal(commands(b).find((c) => c.id === 'heal').disabled, true);
});

// 相手は倒せるものとして、歩いて届く範囲を調べる
function reach(state) {
    const seen = new Set([`${state.x},${state.y}`]);
    const queue = [[state.x, state.y]];
    while (queue.length) {
        const [x, y] = queue.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;
            if (seen.has(key)) continue;
            const object = objectAt(state, nx, ny);
            if (isBlocked(state, nx, ny) && !object) continue;
            seen.add(key);
            if (!object || object.kind === 'foe') queue.push([nx, ny]);
        }
    }
    return seen;
}

test('どの地図の 物も 壁に埋まっていない', () => {
    for (const map of Object.values(MAPS)) {
        for (const o of map.objects) {
            assert.ok(map.tiles[o.y]?.[o.x], `${map.id}/${o.id}`);
            assert.ok(!'wM'.includes(map.tiles[o.y][o.x]), `${map.id}/${o.id} は 壁の中`);
        }
    }
});

test('踊り場: 毛布と 階段に 歩いて届く', () => {
    const state = createState();
    assert.ok(reach(state).has('9,4'));
    state.flags.bak = true;
    assert.ok(reach(state).has('9,2'));
    state.gone.nanashi1 = true;
    state.gone.nanashi2 = true;
    assert.ok(reach(state).has('9,1'));
});

test('お面通り: 言葉が 3 つ拾えて、そろうと 門が開く', () => {
    const state = createState();
    state.map = 'omen';
    state.x = 2;
    state.y = 5;
    const seen = reach(state);
    const words = MAPS.omen.objects.filter((o) => o.kind === 'word');
    assert.equal(words.length, 3);
    for (const w of words) assert.ok(seen.has(`${w.x},${w.y}`), w.id);
    assert.ok(isBlocked(state, 30, 5));
    for (const w of words) pickWord(state, w);
    assert.equal(isBlocked(state, 30, 5), false);
});

test('門が閉じているあいだは 通り抜けられない', () => {
    const state = createState();
    state.map = 'omen';
    state.x = 29;
    state.y = 5;
    assert.equal(step(state, 'right').type, 'stop');
});

test('J キーは 最初から 決定', () => {
    assert.equal(actionOf(DEFAULT_KEYS, 'j'), 'a');
});

test('キーを変えると 前のキーは 効かなくなる', () => {
    const next = rebind(DEFAULT_KEYS, 'a', 'k');
    assert.equal(actionOf(next, 'k'), 'a');
    assert.equal(actionOf(next, 'j'), null);
    assert.ok(DEFAULT_KEYS.a.includes('j'));
});

test('ほかの操作のキーを取っても 操作が 空にならない', () => {
    const single = rebind(DEFAULT_KEYS, 'b', 'x');
    const next = rebind(single, 'a', 'x');
    assert.equal(actionOf(next, 'x'), 'a');
    assert.ok(next.b.length > 0);
});

function fightBoss(foe, party, seed) {
    const b = createBattle(party, foe, { rng: seeded(seed) });
    for (let turn = 0; turn < 80 && !b.over; turn++) {
        if (b.chance) { answer(b, foe.truth.answer); break; }
        const list = commands(b);
        const heal = list.find((c) => c.id === 'heal');
        const next = foe.pattern[b.step % foe.pattern.length];
        if (next === 'swirl') act(b, 'guard');
        else if (heal && !heal.disabled && b.ally.hp < 25) act(b, 'heal');
        else act(b, 'shake');
    }
    return b;
}

for (const id of ['gakufume', 'togemetoro']) {
    test(`${id} に バク 1 体でも ふつうに勝てる`, () => {
        let wins = 0;
        for (let seed = 1; seed <= 300; seed++) if (fightBoss(FOES[id], [BAK], seed).over === 'truth') wins++;
        assert.ok(wins >= 240, `勝率 ${wins}/300`);
    });
}

test('倒れると 控えが 前に出る', () => {
    const b = createBattle([BAK, ALLIES.gakufume], FOES.muresuima, { rng: () => 0.5 });
    b.ally.hp = 1;
    act(b, 'guard');
    assert.equal(b.ally.id, 'gakufume');
    assert.equal(b.over, null);
});

test('ほそいソロで 相手が 1 回休む', () => {
    const b = createBattle(ALLIES.gakufume, FOES.nanashi, { rng: () => 0.5 });
    const hp = b.ally.hp;
    act(b, 'sleep');
    assert.equal(b.ally.hp, hp);
});

test('せかすリズムの次は 2 回攻撃', () => {
    const b = createBattle(ALLIES.togemetoro, FOES.muresuima, { rng: () => 0.5 });
    act(b, 'rush');
    const hits = act(b, 'attack').filter((e) => e.t === 'hit' && e.target === 'foe');
    assert.equal(hits.length, 2);
});

test('日付の表示', () => {
    assert.equal(dateLabel(1), '2月1日（月）');
    assert.equal(dateLabel(14), '2月14日（日）');
});

test('活性化したあと 片方を救うと もう片方は 刈り取られ 仲間が増える', () => {
    const state = createState();
    state.day = 7;
    const keep = createKeep();
    const result = rescue(state, keep, 'mio', 'gakufume');
    assert.equal(result.other, 'kana');
    assert.equal(state.status.kana, 'reaped');
    assert.ok(keep.allies.includes('gakufume'));
    assert.deepEqual(dreamsTonight({ ...state, day: 8 }).filter((d) => d !== 'riku'), []);
});

test('9 日の夜を過ぎると 結界が破られる', () => {
    const state = createState();
    state.day = 9;
    state.phase = 'night';
    advance(state);
    assert.equal(state.status.mio, 'broken');
    assert.equal(state.day, 10);
});

test('7 日に ボスが現れる', () => {
    const state = createState();
    state.day = 6;
    state.phase = 'night';
    advance(state);
    assert.equal(state.flags.active, true);
});

test('14 日の夜の次は ループする。仲間は残り 周の状態は消える', () => {
    const state = createState();
    const keep = createKeep();
    rescue(state, keep, 'mio', 'gakufume');
    state.day = 14;
    state.phase = 'night';
    assert.equal(advance(state), 'loop');
    const next = nextLoop(keep);
    assert.equal(keep.loop, 2);
    assert.equal(next.day, 1, '2 月 1 日へ戻る');
    assert.equal(next.phase, 'morning', '朝 (自分のベッド) から');
    assert.equal(next.status.mio, 'idle');
    assert.deepEqual(next.words, []);
    assert.ok(keep.allies.includes('gakufume'));
});

test('同じユメクイを また救うと 夢写しになる', () => {
    const keep = createKeep();
    rescue(createState(), keep, 'mio', 'gakufume');
    const result = rescue(createState(), keep, 'mio', 'gakufume');
    assert.equal(result.copied, true);
    assert.equal(keep.copies.gakufume, 1);
    assert.equal(keep.allies.filter((id) => id === 'gakufume').length, 1);
});

test('ミオとカナの夢 (第 1 層): 言葉と 下の階層への 階段に 歩いて届く', () => {
    for (const [map, word, boss] of [['mizuzoko', '15,1', '9,4'], ['renshu', '15,3', '9,5']]) {
        const state = createState();
        state.map = map;
        state.x = MAPS[map].start.x;
        state.y = MAPS[map].start.y;
        state.flags.active = true;
        const seen = reach(state);
        assert.ok(seen.has(word), map + ' の言葉');
        assert.ok(seen.has(boss), map + ' の 階段 (ボスは 最深部)');
    }
});

test('門が開くのは お面通りで 言葉がそろったときだけ', () => {
    const state = createState();
    state.map = 'mizuzoko';
    const word = MAPS.mizuzoko.objects.find((o) => o.kind === 'word');
    assert.equal(pickWord(state, word), false);
    assert.equal(state.flags.gateOpen, undefined);
});

test('ミオとカナの夢には 最初の場所のすぐ近くに 見える出口がある', () => {
    for (const map of ['mizuzoko', 'renshu']) {
        const state = createState();
        state.map = map;
        state.x = MAPS[map].start.x;
        state.y = MAPS[map].start.y;
        const door = MAPS[map].objects.find((o) => o.kind === 'wake');
        assert.ok(door, map);
        assert.ok(reach(state).has(`${door.x},${door.y}`), map);
        state.x = door.x;
        state.y = door.y - 1;
        assert.equal(step(state, 'down').type, 'bump');
    }
});

test('救うと 防御と言葉が伸び、喰らうと 攻撃が伸びる', () => {
    const base = bakUnit(createKeep());
    const savedKeep = createKeep();
    grow(savedKeep, 'saved');
    const kind = bakUnit(savedKeep);
    assert.ok(kind.def > base.def);
    assert.ok(kind.kokoro > base.kokoro);
    assert.equal(kind.atk, base.atk);
    assert.deepEqual(kind.moves.extra.map((s) => s.id), ['shield']);

    const eatenKeep = createKeep();
    grow(eatenKeep, 'eaten');
    const wild = bakUnit(eatenKeep);
    assert.ok(wild.atk > base.atk);
    assert.equal(wild.def, base.def);
    assert.equal(wild.sprite, 'bak-wild');
    assert.deepEqual(wild.moves.extra.map((s) => s.id), ['bite']);
});

test('成長には 上限がある', () => {
    const keep = createKeep();
    for (let i = 0; i < 20; i++) grow(keep, 'saved');
    assert.equal(keep.growth.saved, MAX_GROWTH);
});

test('言葉の成長で ココロ攻撃の ゆらぎが増える', () => {
    const keep = createKeep();
    grow(keep, 'saved');
    const b = createBattle(bakUnit(keep), FOES.muresuima, { rng: () => 0.1 });
    assert.equal(act(b, 'shake').find((e) => e.t === 'shake').gain, 40);
});

test('ふとんの守りで 防御が上がる', () => {
    const keep = createKeep();
    grow(keep, 'saved');
    const b = createBattle(bakUnit(keep), FOES.nanashi, { rng: () => 0.5 });
    const def = b.ally.def;
    act(b, 'shield');
    assert.ok(b.ally.def > def);
});

test('かみくだくは 強いが 自分も傷つく', () => {
    const keep = createKeep();
    grow(keep, 'eaten');
    const b = createBattle(bakUnit(keep), FOES.gakufume, { rng: () => 0.5 });
    b.foe.pattern = ['charge'];
    const foeHp = b.foe.hp;
    const hp = b.ally.hp;
    act(b, 'bite');
    assert.ok(foeHp - b.foe.hp > 20);
    assert.ok(b.ally.hp < hp);
});

test('むさぼると 体力を奪う', () => {
    const keep = createKeep();
    grow(keep, 'eaten');
    grow(keep, 'eaten');
    const b = createBattle(bakUnit(keep), FOES.gakufume, { rng: () => 0.5 });
    b.foe.pattern = ['charge'];
    b.ally.hp = 10;
    act(b, 'gorge');
    assert.ok(b.ally.hp > 10);
});

test('体力を尽くすと 喰らえる。チュートリアルのボスは 喰らえない', () => {
    const b = createBattle(BAK, FOES.gakufume, { rng: () => 0.5 });
    assert.ok(!commands(b).some((c) => c.id === 'devour'));
    b.foe.hp = 1;
    act(b, 'attack');
    assert.ok(commands(b).some((c) => c.id === 'devour'));
    act(b, 'devour');
    assert.equal(b.over, 'devour');

    const first = createBattle(BAK, FOES.muresuima, { rng: () => 0.5 });
    first.foe.hp = 1;
    act(first, 'attack');
    assert.ok(!commands(first).some((c) => c.id === 'devour'));
});

test('喰らった夢主は 次の周も 抜け殻のまま', () => {
    const state = createState();
    state.day = 7;
    const keep = createKeep();
    devour(state, keep, 'mio');
    assert.equal(state.status.mio, 'eaten');
    assert.equal(state.status.kana, 'reaped');
    assert.equal(keep.growth.eaten, 1);
    assert.ok(!keep.allies.includes('gakufume'));
    const next = nextLoop(keep);
    assert.equal(next.status.mio, 'eaten');
    assert.equal(next.status.kana, 'idle');
    assert.deepEqual(dreamsTonight(next).filter((d) => d !== 'riku'), [], '2 月 1 日は まだ 夢が開いていない');
    next.day = 2;
    assert.deepEqual(dreamsTonight(next).filter((d) => d !== 'riku'), ['kana'], '目覚める前も 夢には 入れる (奥の 扉は 閉じている)');
    next.day = 7;
    assert.deepEqual(dreamsTonight(next).filter((d) => d !== 'riku'), ['kana']);
});

test('カナを救っても 喰らったミオは 抜け殻のまま', () => {
    const keep = createKeep();
    const first = createState();
    devour(first, keep, 'mio');
    const next = nextLoop(keep);
    rescue(next, keep, 'kana', 'togemetoro');
    assert.equal(next.status.mio, 'eaten');
});

test('B ボタン (K キー・Shift) は ダッシュ', () => {
    assert.equal(actionOf(DEFAULT_KEYS, 'k'), 'dash');
    assert.equal(actionOf(DEFAULT_KEYS, 'Shift'), 'dash');
    assert.equal(actionOf(DEFAULT_KEYS, 'x'), 'b', 'メニューは 今までどおり X キー');
});
