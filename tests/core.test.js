import test from 'node:test';
import assert from 'node:assert/strict';
import { affinity, damage } from '../src/core/rules.js';
import { buildChoices } from '../src/core/truth.js';
import { act, answer, commands, createBattle } from '../src/core/battle.js';
import { createState, isBlocked, objectAt, pickWord, step } from '../src/core/field.js';
import { BAK, FOES } from '../src/data/units.js';
import { MAPS } from '../src/data/maps.js';

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
