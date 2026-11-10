import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, isBlocked, objectAt, objectsOf, step } from '../src/core/field.js';
import { createKeep } from '../src/core/calendar.js';
import { canUseBrush, hasImageFor, learnImage, paint } from '../src/core/brush.js';
import { IMAGES, TILE_IMAGES, dreamKind } from '../src/data/brush.js';
import { MAPS } from '../src/data/maps.js';
import { LINES } from '../src/scenes/story.js';

const spotsOf = (mapId) => MAPS[mapId].objects.filter((o) => o.kind === 'brushSpot');

function inDream(mapId) {
    const state = createState();
    const keep = createKeep();
    state.map = mapId;
    state.flags.bak = true;
    keep.brush = true;
    return { state, keep };
}

test('夢筆は はじめは 持っていない。学校の階段の イメージだけ 最初から ある', () => {
    const keep = createKeep();
    assert.equal(keep.brush, false);
    assert.deepEqual(keep.images, ['stairs']);
});

test('踊り場: 崩れた階段は 通れず、夢筆で 階段を描くと 上って お面通りへ 行ける', () => {
    const { state, keep } = inDream('odoriba');
    Object.assign(state, { x: 9, y: 2 });
    assert.ok(isBlocked(state, 9, 1));
    const bump = step(state, 'up');
    assert.equal(bump.type, 'bump');
    assert.equal(bump.object.kind, 'brushSpot');
    assert.ok(hasImageFor(keep, bump.object), '階段は 最初から 描ける');
    assert.equal(paint(state, keep, bump.object, 'stairs'), 'ok');
    assert.ok(!isBlocked(state, 9, 1) && !isBlocked(state, 10, 1), '両方の マスが 階段に なる');
    assert.ok(!objectsOf(state).some((o) => o.kind === 'brushSpot'), '描いたら 光る場所は 消える');
    assert.equal(step(state, 'up').type, 'exit');
});

test('その夢に 合わない物は 描けない (音楽室に 海)、合っていても 役に立たない物は 何も起きない', () => {
    const { state, keep } = inDream('mizuzoko');
    const spot = spotsOf('mizuzoko')[0];
    for (const id of ['sea', 'metronome', 'piano']) learnImage(keep, id);
    assert.equal(paint(state, keep, spot, 'sea'), 'unfit', '水底の音楽室に 海は 描けない');
    assert.equal(paint(state, keep, spot, 'metronome'), 'useless', '楽器は 描けるが ここでは 役に立たない');
    assert.ok(!state.flags.painted_pianoSpot);
    assert.equal(paint(state, keep, spot, 'piano'), 'ok');
    assert.equal(objectAt(state, spot.x, spot.y).script, 'pianoRest', 'ピアノが 現れる');

    const hal = inDream('odoriba');
    learnImage(hal.keep, 'piano');
    assert.equal(paint(hal.state, hal.keep, spotsOf('odoriba')[0], 'piano'), 'unfit', 'ハルの夢の 坂に ピアノは 合わない');
});

test('イメージは 現実で 見て 覚える。覚えていないと 描く候補に 出ない', () => {
    const keep = createKeep();
    const spot = spotsOf('mizuzoko')[0];
    assert.ok(!hasImageFor(keep, spot));
    assert.equal(learnImage(keep, 'piano'), true);
    assert.equal(learnImage(keep, 'piano'), false, '2 回目は 新しくない');
    assert.ok(hasImageFor(keep, spot));
});

test('現実では 夢筆を 使えない (バクが 筆に なれない)', () => {
    const { state, keep } = inDream('odoriba');
    assert.ok(canUseBrush(state, keep));
    for (const id of ['school', 'saka', 'home']) {
        state.map = id;
        assert.ok(!canUseBrush(state, keep), id);
    }
});

test('描ける場所は どれも、その夢に 合っていて 現実で 見られる物で 解ける', () => {
    const seeable = new Set(Object.values(TILE_IMAGES));
    seeable.add('sea');
    for (const map of Object.values(MAPS)) {
        for (const o of map.objects.filter((x) => x.kind === 'look')) seeable.add(o.image);
    }
    for (const map of Object.values(MAPS).filter((m) => !m.real)) {
        for (const spot of spotsOf(map.id)) {
            const ok = spot.accepts.filter((id) => IMAGES[id].fits.includes(dreamKind(map)) && seeable.has(id));
            assert.ok(ok.length > 0, `${map.id}/${spot.id}`);
            assert.ok(LINES[spot.hint] && LINES[spot.done], `${spot.id} の セリフ`);
        }
    }
});

test('現実の 学校で ピアノ・メトロノーム・イーゼル・渡り廊下の手すりが 見られる', () => {
    const tiles = MAPS.school.tiles.join('');
    for (const [tile, id] of Object.entries(TILE_IMAGES)) {
        if (['p', 'e', 'f', 's'].includes(tile)) assert.ok(tiles.includes(tile), `${id} の タイル`);
    }
    assert.ok(MAPS.school.objects.some((o) => o.kind === 'look' && o.image === 'metronome'));
});

test('止まらない練習室: メトロノームを 描く場所に 歩いて届く', () => {
    const { state } = inDream('renshu');
    const spot = spotsOf('renshu')[0];
    const start = MAPS.renshu.start;
    assert.ok(Math.abs(spot.x - start.x) + Math.abs(spot.y - start.y) <= 2, '最初の場所の すぐ近く');
    assert.ok(!isBlocked(state, spot.x, spot.y));
});
