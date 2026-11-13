import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, isBlocked, objectAt, objectsOf } from '../src/core/field.js';
import { createKeep, dreamsTonight, rescuePair } from '../src/core/calendar.js';
import { act, answer, chanceFoe, createBattle, setTarget } from '../src/core/battle.js';
import { ALLIES, FOES } from '../src/data/units.js';
import { MAPS } from '../src/data/maps.js';
import { LINES } from '../src/scenes/story.js';

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function reach(state, from) {
    const seen = new Set([`${from.x},${from.y}`]);
    const queue = [from];
    while (queue.length) {
        const { x, y } = queue.shift();
        for (const [dx, dy] of DIRS) {
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;
            if (seen.has(key) || isBlocked(state, nx, ny) || objectAt(state, nx, ny)) continue;
            seen.add(key);
            queue.push({ x: nx, y: ny });
        }
    }
    return seen;
}
const near = (seen, o) => DIRS.some(([dx, dy]) => seen.has(`${o.x + dx},${o.y + dy}`));

function hall() {
    const state = createState();
    Object.assign(state, { map: 'duet', x: 12, y: 10, phase: 'night', day: 8 });
    state.flags.bak = true;
    state.flags.active = true;
    return state;
}

test('二重奏ホールは 2 周目から、2 人とも 元気で 活性化した夜に 描ける', () => {
    const state = createState();
    state.day = 3;
    const keep = createKeep();
    keep.loop = 2;
    assert.ok(dreamsTonight(state, keep).includes('duet'), '目覚める前も 合体の 夢に 入れる (奥の 扉は 閉じている)');
    keep.loop = 1;
    state.day = 7;
    assert.ok(!dreamsTonight(state, keep).includes('duet'), '1 周目は 描けない');
    keep.loop = 2;
    assert.ok(dreamsTonight(state, keep).includes('duet'));
    state.status.kana = 'reaped';
    assert.ok(!dreamsTonight(state, keep).includes('duet'), '片方が 倒れていたら 描けない');
    assert.ok(LINES.dreamNames.duet.includes('二重奏ホール'));
});

test('二重奏ホール: 左の音で 右の扉、右の音で 左の扉が 開き、奥の 言葉に 届く', () => {
    const state = hall();
    const words = objectsOf(state).filter((o) => o.kind === 'word');
    const notes = objectsOf(state).filter((o) => o.script === 'noteMio' || o.script === 'noteKana');
    let seen = reach(state, MAPS.duet.start);
    assert.ok(notes.every((n) => near(seen, n)), '音の石には 最初から 届く');
    assert.ok(!words.some((w) => near(seen, w)), '扉が 閉まっていると 言葉に 届かない');
    state.flags.gateR = true;   // 左の 石 (ミオ) を 鳴らした
    seen = reach(state, MAPS.duet.start);
    assert.ok(near(seen, words.find((w) => w.word === 'ほしかった')), '右の奥 (カナの 言葉) に 届く');
    assert.ok(!near(seen, words.find((w) => w.word === '吹きたかった')));
    state.flags.gateL = true;
    seen = reach(state, MAPS.duet.start);
    assert.ok(words.every((w) => near(seen, w)));
    const mid = objectsOf(state).find((o) => o.script === 'duetMid');
    assert.ok(near(seen, mid), '中ボスに 届く');
});

test('中ボスの ムレスイマは 行動のたびに 哀と怒が 入れかわる', () => {
    const b = createBattle({ ...ALLIES.bak, hp: 300, maxHp: 300 }, FOES.duetSuima, { rng: () => 0.5 });
    const attrs = [];
    for (let i = 0; i < 4; i++) {
        act(b, 'guard');
        attrs.push(b.foe.attr);
    }
    assert.deepEqual(attrs, ['哀', '怒', '哀', '怒']);
});

test('デュエット: 2 羽が 合体した 1 体。カナの 本音で 哀の 姿に 変わり、ミオの 本音で 救える', () => {
    const b = createBattle({ ...ALLIES.bak, hp: 500, maxHp: 500, atk: 60 }, FOES.duet, { rng: () => 0.5 });
    assert.equal(b.foes.length, 1, '戦うのは 1 体');
    assert.equal(b.foe.attr, '怒');
    assert.equal(b.foe.solvedAs, 'togemetoro');
    for (let i = 0; i < 10 && !b.foe.exhausted; i++) act(b, 'attack');
    assert.equal(chanceFoe(b), b.foes[0]);
    const events = answer(b, FOES.duet.truth.answer);
    assert.equal(b.over, null, 'カナの 本音だけでは 終わらない');
    assert.ok(events.some((e) => e.t === 'phase'));
    assert.equal(b.foe.attr, '哀', '哀の 姿に 変わる');
    assert.equal(b.foe.solvedAs, 'gakufume');
    assert.equal(b.foe.truthHead, 'ミオの本音は？');
    assert.equal(b.foe.chance, false);
    assert.ok(b.foe.hp > 1, '体力が 少し 戻る');
    for (let i = 0; i < 10 && !b.foe.exhausted; i++) act(b, 'attack');
    assert.equal(chanceFoe(b), b.foes[0]);
    answer(b, FOES.duet.phases[0].truth.answer);
    assert.equal(b.over, 'truth');
    assert.equal(FOES.duet.attr, '怒', '元の データは 変わらない');
});

test('夢合体で 2 人とも 救う: だれも 刈り取られず、ガクフメと トゲメトロが 仲間に。夢双の 相性', () => {
    const state = createState();
    const keep = createKeep();
    keep.loop = 2;
    keep.allies.push('gakufume');   // 1 周目に ミオを 救っていた
    const joined = rescuePair(state, keep);
    assert.deepEqual(state.status, { mio: 'saved', kana: 'saved', riku: 'idle' });
    assert.ok(keep.allies.includes('togemetoro'));
    assert.equal(keep.copies.gakufume, 1, 'ガクフメは 夢写し');
    assert.deepEqual(joined.sort(), ['gakufume', 'togemetoro']);
    assert.ok(keep.musou.includes('duet'));
    assert.equal(keep.growth.saved, 2);
});
