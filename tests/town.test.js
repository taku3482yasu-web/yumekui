import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, isBlocked, objectAt, objectsOf, placeName, step } from '../src/core/field.js';
import { canDeepTalk, deepTalk, present, startDay, startMorning, timeLabel, timesBetween, MORNING_START, NIGHT_START, TOWN_START } from '../src/core/town.js';
import { TOWN_MAPS } from '../src/data/town.js';
import { MAPS } from '../src/data/maps.js';
import { LINES } from '../src/scenes/story.js';

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function dayState(day = 2) {
    const state = createState();
    state.day = day;
    state.phase = 'day';
    state.flags.bak = true;
    return state;
}

// 地図をまたいで 歩いて届くマス (出口を くぐる)。人などの物は 通れない
function reachable(state, from) {
    const seen = new Set([`${from.map},${from.x},${from.y}`]);
    const queue = [from];
    const probe = { ...state };
    while (queue.length) {
        const at = queue.shift();
        probe.map = at.map;
        for (const [dx, dy] of DIRS) {
            const x = at.x + dx;
            const y = at.y + dy;
            if (isBlocked(probe, x, y)) continue;
            const object = objectAt(probe, x, y);
            if (object && object.kind !== 'exit') continue;
            const next = object ? { map: object.to, x: object.at.x, y: object.at.y } : { map: at.map, x, y };
            const key = `${next.map},${next.x},${next.y}`;
            if (seen.has(key)) continue;
            seen.add(key);
            queue.push(next);
        }
    }
    return seen;
}

// その物の となりの マスに 立てるか
function canReach(seen, map, object) {
    return DIRS.some(([dx, dy]) => seen.has(`${map},${object.x + dx},${object.y + dy}`));
}

test('町の地図は 行の長さが そろっている', () => {
    for (const [id, map] of Object.entries(TOWN_MAPS)) {
        const width = map.tiles[0].length;
        assert.ok(map.tiles.every((row) => row.length === width), id);
    }
});

test('町の出口は ある地図の 通れるマスに つながっている', () => {
    const state = dayState();
    for (const map of Object.values(TOWN_MAPS)) {
        for (const exit of map.objects.filter((o) => o.kind === 'exit')) {
            assert.ok(MAPS[exit.to], `${map.id} → ${exit.to}`);
            state.map = exit.to;
            assert.ok(!isBlocked(state, exit.at.x, exit.at.y), `${map.id} → ${exit.to} ${exit.at.x},${exit.at.y}`);
            state.map = map.id;
            assert.ok(!isBlocked(state, exit.x, exit.y), `${exit.id} は 踏める`);
        }
    }
});

test('放課後: 教室から 学校・商店街の 人と 家の玄関に 歩いて届く', () => {
    const state = dayState(2);
    startDay(state);
    const seen = reachable(state, TOWN_START.weekday);
    for (const id of ['school', 'saka']) {
        state.map = id;
        for (const object of objectsOf(state).filter((o) => o.kind !== 'exit')) {
            assert.ok(canReach(seen, id, object), `${id} の ${object.id} に 届かない`);
        }
    }
});

test('土日は 朝が 飛んで 昼に 自分の部屋から 始まり、玄関から出て 学校の ミオにも 届く', async () => {
    const { advance } = await import('../src/core/calendar.js');
    const state = dayState(5);
    state.phase = 'night';
    assert.equal(advance(state), 'day', '金曜の夜の 次は 土曜の 昼');
    assert.equal(state.day, 6);
    startDay(state);
    assert.equal(state.map, 'home');
    assert.equal(placeName(state), 'ハルの部屋');
    assert.equal(timeLabel(state), '昼');
    const seen = reachable(state, TOWN_START.weekend);
    state.map = 'school';
    const mio = objectsOf(state).find((o) => o.who === 'mio');
    assert.ok(mio && canReach(seen, 'school', mio));
});

test('ハルの部屋: キャンバスの前から 始まり、キャンバスと ベッドと 玄関に 届く', () => {
    const state = dayState();
    state.phase = 'night';
    Object.assign(state, NIGHT_START);
    assert.equal(placeName(state), 'ハルの部屋');
    assert.equal(objectAt(state, NIGHT_START.x + 1, NIGHT_START.y)?.kind, 'canvas');
    const seen = reachable(state, NIGHT_START);
    const bed = TOWN_MAPS.home.objects.find((o) => o.kind === 'bed');
    assert.ok(canReach(seen, 'home', bed));
    assert.ok(seen.has('saka,4,17'), '玄関から 町へ出られる');
});

test('リクは 2 日まで 教室にいて、3 日から いない', () => {
    assert.ok(present(dayState(2), 'riku'));
    assert.ok(!present(dayState(3), 'riku'));
});

test('ミオとカナは 6 日まで 学校にいて、7 日から 倒れて いない。救うと 戻り、刈り取られると 来ない', () => {
    const state = dayState(6);
    assert.ok(present(state, 'mio'));
    state.day = 7;
    assert.ok(!present(state, 'mio'));
    state.status.mio = 'saved';
    state.status.kana = 'reaped';
    assert.ok(present(state, 'mio'));
    assert.ok(!present(state, 'kana'));
    state.status.kana = 'eaten';
    assert.ok(present(state, 'kana'));
    assert.ok(LINES.town('kana', state).length > 0, '喰らった人にも セリフがある');
});

test('じっくり話す: 言葉を 1 回だけ聞いて、夕方になる。その日は もう じっくり話せない', () => {
    const state = dayState(2);
    startDay(state);
    assert.equal(timeLabel(state), '放課後');
    assert.ok(canDeepTalk(state, 'mio'));
    const first = deepTalk(state, 'mio', '一緒に');
    assert.deepEqual(first, { count: 0, word: '一緒に' });
    assert.equal(timeLabel(state), '夕方');
    assert.ok(!canDeepTalk(state, 'kana'), '1 日 1 人');
    startDay(state);
    const again = deepTalk(state, 'mio', '一緒に');
    assert.deepEqual(again, { count: 1, word: null });
    assert.deepEqual(state.words, ['一緒に']);
});

test('リクの家への道は ふさがっていて、ぶつかると セリフ。開いたら 通れる', () => {
    const state = dayState(2);
    state.map = 'saka';
    state.x = 22;
    state.y = 8;
    assert.equal(step(state, 'right').object.script, 'rikuRoad');
    assert.equal(state.x, 22);
    state.flags.rikuOpen = true;
    assert.equal(step(state, 'right').type, 'exit');
});

test('学校では 部屋ごとに 場所の名前が変わる', () => {
    const state = dayState();
    Object.assign(state, { map: 'school', x: 18, y: 5 });
    assert.equal(placeName(state), '音楽室');
    Object.assign(state, { x: 40, y: 8 });
    assert.equal(placeName(state), '渡り廊下');
    Object.assign(state, { x: 3, y: 6 });
    assert.equal(placeName(state), '2年1組の教室');
});

test('町の 人には みんな セリフがある', () => {
    const state = dayState(2);
    for (const map of Object.values(TOWN_MAPS)) {
        for (const object of map.objects.filter((o) => o.kind === 'person')) {
            if (['mio', 'kana'].includes(object.who)) continue;   // 元気なうちは じっくり話す
            assert.ok(LINES.town(object.who, state).length > 0, object.who);
        }
    }
});

test('夜の町には 人がいない (父は 家にいる)。校門は 閉まっている', () => {
    const state = dayState(2);
    state.phase = 'night';
    assert.ok(!present(state, 'tome'));
    assert.ok(!present(state, 'mio'));
    assert.ok(present(state, 'father'));
    Object.assign(state, { map: 'saka', x: 11, y: 2 });
    const gate = step(state, 'up');
    assert.equal(gate.type, 'bump');
    assert.equal(gate.object.script, 'schoolClosed');
    state.phase = 'day';
    assert.equal(step(state, 'up').type, 'exit', '昼は 学校に入れる');
});

test('ループした 2 月 1 日は 朝 (家の前) から始まり、放課後には ミオとカナが まだ元気', async () => {
    const { advance, createKeep, nextLoop } = await import('../src/core/calendar.js');
    const keep = createKeep();
    keep.tutorial = true;
    const state = nextLoop(keep);
    startMorning(state);
    assert.equal(state.day, 1);
    assert.equal(timeLabel(state), '朝');
    assert.deepEqual({ map: state.map, x: state.x, y: state.y }, { map: MORNING_START.map, x: MORNING_START.x, y: MORNING_START.y });
    assert.equal(advance(state), 'day');
    startDay(state);
    assert.equal(timeLabel(state), '放課後');
    assert.equal(state.map, 'school');
    assert.ok(present(state, 'riku') && present(state, 'mio'));
    assert.ok(LINES.morningEvent[1].length > 0);
    assert.ok(Array.isArray(LINES.morning), "チュートリアルの 結末の 文は そのまま");
});

test('時間の流れ: 平日は 朝 → 昼 → 放課後、夕方 → 夜。土日は 放課後が ない', () => {
    assert.deepEqual(timesBetween('朝', '放課後'), ['朝', '昼', '放課後']);
    assert.deepEqual(timesBetween('放課後', '夜'), ['放課後', '夕方', '夜']);
    assert.deepEqual(timesBetween('夕方', '夜'), ['夕方', '夜']);
    assert.deepEqual(timesBetween('朝', '昼', true), ['朝', '昼']);
    assert.deepEqual(timesBetween('昼', '夜', true), ['昼', '夕方', '夜']);
});

test('1 日は 朝 → 放課後 → 夜 → 次の日の朝', async () => {
    const { advance } = await import('../src/core/calendar.js');
    const state = dayState(4);
    state.phase = 'morning';
    assert.equal(advance(state), 'day');
    assert.equal(advance(state), 'night');
    assert.equal(advance(state), 'morning');
    assert.equal(state.day, 5);
});

test('プロローグ: 教室で 目が覚め、学校を出て 坂道を下って 家の玄関に 届く。外に出たら 学校には 戻れない', async () => {
    const { PROLOGUE_START, RIKU_BRANCH_Y } = await import('../src/core/town.js');
    const state = dayState(1);
    state.flags.prologue = true;
    Object.assign(state, PROLOGUE_START);
    assert.equal(placeName(state), '2年1組の教室');
    assert.equal(timeLabel(state), '放課後');
    assert.ok(!present(state, 'riku') && !present(state, 'mio') && !present(state, 'kana'), 'リクは いっしょに歩く・ミオとカナは 部活');
    assert.ok(present(state, 'momo'), 'ほかの クラスメイトは いる');
    const seen = reachable(state, PROLOGUE_START);
    const door = TOWN_MAPS.saka.objects.find((o) => o.id === 'homeDoor');
    assert.ok(canReach(seen, 'saka', door), '家の玄関に 届く');
    const gate = step({ ...state, map: 'saka', x: 11, y: 2 }, 'up');
    assert.equal(gate.object.script, 'prologueSchool', '学校には 戻らない');
    // 家の玄関 (4,16) へは 分かれ道の 行 (RIKU_BRANCH_Y) を かならず 通る
    assert.ok(door.y > RIKU_BRANCH_Y);
});

test('プロローグ: 家では 玄関から 出られず、机・キャンバス・ベッドに 届く', () => {
    const state = dayState(1);
    state.flags.prologue = true;
    // 1 階の 玄関から 入り、階段で 2 階の 自分の部屋へ (11/13 ユーザー指定で 2 階建て)
    Object.assign(state, { map: 'home1', x: 10, y: 7 });
    assert.equal(step({ ...state }, 'down').object.script, 'prologueStay');
    const seen = reachable(state, { map: 'home1', x: 10, y: 7 });
    assert.ok(seen.has('home1,9,4') || seen.has('home1,10,3'), '居間の 父の そばに 立てる');
    assert.ok(!seen.has('saka,4,17'), '外へは 出られない');
    assert.ok(seen.has('home,9,3') || seen.has('home,10,3'), '机の前に 立てる');
    for (const kind of ['canvas', 'bed']) {
        const object = TOWN_MAPS.home.objects.find((o) => o.kind === kind);
        assert.ok(canReach(seen, 'home', object), kind);
    }
    assert.equal(TOWN_MAPS.home.tiles[2][9], 'd', '机');
});

test('プロローグと オープニングの セリフ (台本 1-0・1-1)', () => {
    assert.ok(LINES.prologueStart.some(([n]) => n === 'リク'));
    assert.equal(LINES.fatherChoices.length, 3);
    assert.ok(LINES.opening.some(([, t]) => t.includes('さっき描いた海')));
});
