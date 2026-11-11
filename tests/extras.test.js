import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createBattle, SNACK_RATE } from '../src/core/battle.js';
import { createKeep } from '../src/core/calendar.js';
import { createState, isBlocked, objectsOf, pickWord } from '../src/core/field.js';
import { paint } from '../src/core/brush.js';
import { canWork, shopHint, useSnack, work, JOBS } from '../src/core/job.js';
import { isHeroSide, nextStage, portraitPath, startStage } from '../src/core/portraits.js';
import { MAPS } from '../src/data/maps.js';
import { ALLIES, FOES } from '../src/data/units.js';
import { WORDS } from '../src/data/words.js';
import { LINES } from '../src/scenes/story.js';

// ---- 会話の 立ち絵 ----------------------------------------------------------

test('立ち絵: 左は 主人公の側 (ハル・バク・仲間)、右は 話している 相手', () => {
    let stage = startStage();
    stage = nextStage(stage, '', 'neutral');
    assert.deepEqual(stage, { left: null, right: null }, '地の文だけなら だれも 出ない');
    stage = nextStage(stage, 'リク', 'smile');
    assert.equal(stage.left.name, 'ハル', '相手が 話すと 左に ハルが 立つ');
    assert.deepEqual(stage.right, { name: 'リク', expression: 'smile' });
    stage = nextStage(stage, 'バク');
    assert.equal(stage.left.name, 'バク', 'バクは 主人公の側 (左)');
    assert.equal(stage.right.name, 'リク', '相手は そのまま');
    stage = nextStage(stage, '');
    assert.equal(stage.right.name, 'リク', '地の文では 変わらない');
    stage = nextStage(stage, '？？？');
    assert.equal(stage.right, null, '絵の 無い 人が 話すと 右は 空く');
});

test('立ち絵: 救った 仲間は 左、まだ 仲間で ない ユメクイは 右', () => {
    assert.ok(isHeroSide('ガクフメ', ['bak', 'gakufume']));
    assert.ok(!isHeroSide('ガクフメ', ['bak']));
    assert.equal(nextStage(startStage(), 'ガクフメ', 'neutral', ['bak']).right.name, 'ガクフメ');
});

test('立ち絵の ファイル名は 素材制作仕様書のとおり', () => {
    assert.equal(portraitPath('ハル'), 'img/chara/haru_neutral.png');
    assert.equal(portraitPath('ハル', 'cry'), 'img/chara/haru_cry.png');
    assert.equal(portraitPath('ハル', 'へんな顔'), 'img/chara/haru_neutral.png');
    assert.equal(portraitPath('バク', 'smile'), 'img/yumekui/bak_normal.png');
    assert.equal(portraitPath('生徒'), null);
});

// ---- 夢の 新しい 層の 言葉と 夢筆 (橋) ---------------------------------------

function dreamState(map) {
    const state = createState();
    Object.assign(state, { map, x: MAPS[map].start.x, y: MAPS[map].start.y, phase: 'night', day: 8 });
    Object.assign(state.flags, { bak: true, active: true });
    return state;
}

test('深い 層の 言葉は どれも 言葉の 一覧に ある', () => {
    for (const map of Object.values(MAPS)) {
        for (const object of map.objects) if (object.kind === 'word') assert.ok(WORDS[object.word], `${map.id} ${object.word}`);
    }
});

for (const [map, gapId, wordId] of [['mizuzoko2', 'mz2Gap', 'mz2Word'], ['renshu2', 'rs2Gap', 'rs2Word'], ['duet2', 'du2Gap', 'du2Word']]) {
    test(`${map}: 裂け目は 通れず、夢筆で 橋を 描くと 奥の 言葉に 届く`, () => {
        const state = dreamState(map);
        const keep = { ...createKeep(), brush: true, images: ['stairs', 'bridge'] };
        const spot = MAPS[map].objects.find((o) => o.id === gapId);
        const target = MAPS[map].objects.find((o) => o.id === wordId);
        const reach = () => {
            const seen = new Set([`${state.x},${state.y}`]);
            const queue = [[state.x, state.y]];
            const blockers = objectsOf(state).filter((o) => o.kind !== 'foe' && o.id !== wordId);
            while (queue.length) {
                const [x, y] = queue.shift();
                if (x === target.x && y === target.y) return true;
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (seen.has(`${nx},${ny}`) || isBlocked(state, nx, ny) || blockers.some((o) => o.x === nx && o.y === ny)) continue;
                    seen.add(`${nx},${ny}`);
                    queue.push([nx, ny]);
                }
            }
            return false;
        };
        assert.ok(!reach(), '橋が 無いと 届かない');
        assert.equal(paint(state, keep, spot, 'piano'), 'useless', 'ピアノでは 渡れない');
        assert.equal(paint(state, keep, spot, 'bridge'), 'ok');
        assert.ok(reach(), '橋を かけると 届く');
    });
}

test('同じ 言葉を 2 か所で 拾っても 1 つ', () => {
    const state = dreamState('mizuzoko2');
    state.words.push('一緒に');
    pickWord(state, MAPS.mizuzoko2.objects.find((o) => o.id === 'mz2Word'));
    assert.deepEqual(state.words, ['一緒に']);
});

// ---- 土日の 昼の バイトと 駄菓子 ----------------------------------------------

test('バイトは 土日の 昼だけ、1 日 1 回。終わると 夕方', () => {
    const state = createState();
    Object.assign(state, { phase: 'day', day: 6 });   // 2/6 は 土曜
    assert.ok(canWork(state));
    assert.equal(work(state, 'carry'), JOBS.carry.snacks);
    assert.equal(state.snacks, 2);
    assert.equal(state.time, 'evening');
    assert.ok(!canWork(state), 'その日は もう できない');
    Object.assign(state, { day: 2, talkedToday: false });   // 平日
    assert.ok(!canWork(state));
});

test('駄菓子: アイテムで 前の 仲間の 体力が もどり、数が 減る', () => {
    const state = createState();
    state.snacks = 1;
    const unit = { ...ALLIES.bak, hp: 50, maxHp: 200, atk: 30 };
    const b = createBattle(unit, [FOES.nanashi], { rng: () => 0.5 });
    assert.ok(useSnack(state));
    const events = act(b, 'snack');
    const heal = events.find((e) => e.t === 'heal');
    assert.equal(heal.amount, Math.round(200 * SNACK_RATE));
    assert.equal(state.snacks, 0);
    assert.ok(!useSnack(state), '無ければ 使えない');
});

test('店番の お客さんの 話は 物語の 進み具合で 変わり、どれも セリフが ある', () => {
    const state = createState();
    const keep = createKeep();
    Object.assign(state, { day: 6 });
    assert.equal(shopHint(state, keep), 'band');
    keep.loop = 2;
    assert.equal(shopHint(state, keep), 'rikuHouse');
    for (const key of ['rikuHouse', 'band', 'empty', 'concert', 'quiet']) assert.ok(LINES.shopHint[key]?.length, key);
});
