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
    assert.deepEqual(dreamsTonight(state, keep).filter((d) => d !== 'riku'), [], '活性化の 前は 合体の 夢にも 入れない');
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

test('デュエット: ミオ (哀しみの鳥) は カナ (怒りの鳥) より 先には 言い当てられない', () => {
    const b = createBattle({ ...ALLIES.bak, hp: 500, maxHp: 500, atk: 60 }, [FOES.duetDo, FOES.duetAi], { rng: () => 0.5 });
    setTarget(b, b.foes[1]);
    for (let i = 0; i < 10 && !b.foes[1].exhausted; i++) act(b, 'attack');
    assert.ok(b.foes[1].exhausted);
    assert.equal(b.foes[1].chance, false, 'カナより 先には チャンスに ならない');
    assert.ok(b.foes[0].raged, '相方が 尽きると 怒りの鳥が 怒る');
    setTarget(b, b.foes[0]);
    for (let i = 0; i < 10 && !b.foes[0].exhausted; i++) act(b, 'attack');
    assert.equal(chanceFoe(b), b.foes[0]);
    const events = answer(b, FOES.duetDo.truth.answer);
    assert.equal(b.over, null);
    assert.equal(b.foes[1].chance, true, 'カナに 届くと ミオの チャンスが 開く');
    assert.ok(events.some((e) => e.t === 'chance' && e.index === 1));
    answer(b, FOES.duetAi.truth.answer);
    assert.equal(b.over, 'truth');
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
