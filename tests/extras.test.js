import test from 'node:test';
import assert from 'node:assert/strict';
import { act, createBattle, SNACK_RATE } from '../src/core/battle.js';
import { createKeep } from '../src/core/calendar.js';
import { createState, isBlocked, objectsOf, pickWord } from '../src/core/field.js';
import { paint } from '../src/core/brush.js';
import { canWork, shopHint, useSnack, work, JOBS } from '../src/core/job.js';
import { flipFor, nextStage, portraitPath, scenePlan, startStage } from '../src/core/portraits.js';
import { MAPS } from '../src/data/maps.js';
import { ALLIES, FOES } from '../src/data/units.js';
import { WORDS } from '../src/data/words.js';
import { LINES } from '../src/scenes/story.js';

// ---- 会話の 立ち絵 ----------------------------------------------------------

test('立ち絵: 立ち位置は 場面の 最初に 決める (ハルは 左、1 人なら まん中)', () => {
    const lines = [['', '地の文'], ['リク', 'よっ', 'smile'], ['ハル', '……'], ['バク', 'おい'], ['生徒', 'ねえ']];
    const plan = scenePlan(lines);
    assert.equal(plan.left, 'ハル', 'リクが 先に 話しても ハルは 左');
    let stage = startStage();
    stage = nextStage(stage, '', 'neutral', plan);
    assert.deepEqual(stage, { left: null, right: null, center: null, speaking: null }, '地の文だけなら だれも 出ない');
    stage = nextStage(stage, 'リク', 'smile', plan);
    assert.deepEqual(stage.right, { name: 'リク', expression: 'smile' });
    assert.equal(stage.left, null, 'ハルは 話すまで 出ない');
    assert.equal(stage.speaking, 'right');
    stage = nextStage(stage, 'ハル', undefined, plan);
    assert.equal(stage.left.name, 'ハル');
    assert.equal(stage.speaking, 'left', '話している ハルが 明るく、リクは 暗く なる');
    stage = nextStage(stage, 'バク', undefined, plan);
    assert.equal(stage.right.name, 'バク', '3 人目は 右を 入れかえる');
    assert.equal(stage.left.name, 'ハル', '左は 動かさない');
    stage = nextStage(stage, '生徒', undefined, plan);
    assert.equal(stage.speaking, 'none', '絵の 無い 人が 話すと みんな 暗く なる');
    stage = nextStage(stage, '', undefined, plan);
    assert.equal(stage.speaking, null, '地の文では みんな 明るい');

    const solo = scenePlan([['', '……'], ['アキ先生', 'おはよう！', 'smile'], ['生徒', 'はーい']]);
    assert.equal(solo.center, 'アキ先生', '話す人が 1 人なら まん中');
    assert.equal(nextStage(startStage(), 'アキ先生', 'smile', solo).center.name, 'アキ先生');
    assert.equal(scenePlan([['ミオ', 'カナ……'], ['カナ', '……ミオ']]).left, 'ミオ', 'ハルが いなければ 最初の人が 左');
});

test('立ち絵の 向き: 左の 人は 右を、右の 人は 左を 向く', () => {
    assert.ok(!flipFor('left', 'img/chara/haru_neutral.png'), 'ふつうの 立ち絵は 右向き');
    assert.ok(flipFor('right', 'img/chara/riku_smile.png'));
    assert.ok(flipFor('left', 'img/chara/haru_profile.png'), '横顔は 左向き');
    assert.ok(!flipFor('left', 'img/chara/kana_profile.png'), 'カナの 横顔だけ 右向き');
    assert.ok(flipFor('left', 'img/yumekui/bak.png'), 'バクは 左向き');
    assert.ok(!flipFor('right', 'img/enemy/queen_mio.png'), '夢の 住人は 正面');
    assert.ok(!flipFor('center', 'img/chara/aki_smile.png'), 'まん中は そのまま');
});

test('立ち絵の ファイル名は 素材制作仕様書のとおり', () => {
    assert.equal(portraitPath('ハル'), 'img/chara/haru_neutral.png');
    assert.equal(portraitPath('ハル', 'cry'), 'img/chara/haru_neutral.png');   // ハルの 泣き顔は 入れない
    assert.equal(portraitPath('リク', 'cry'), 'img/chara/riku_cry.png');
    assert.equal(portraitPath('父', 'silent'), 'img/chara/haru_father_silent.png');
    assert.equal(portraitPath('リクの父', 'sad'), 'img/chara/riku_father_sad.png');
    assert.equal(portraitPath('トメ'), null);   // まだ 絵の 無い 人
    assert.equal(portraitPath('審査員カナ'), 'img/enemy/judge_kana.png');
    assert.equal(portraitPath('ハル', 'へんな顔'), 'img/chara/haru_neutral.png');
    assert.equal(portraitPath('バク', 'smile'), 'img/yumekui/bak.png');
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
