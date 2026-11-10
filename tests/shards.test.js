import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeep, dreamsTonight, nextLoop, rescue } from '../src/core/calendar.js';
import { createState, objectsOf } from '../src/core/field.js';
import { growCanvas, knowsDream } from '../src/core/canvas.js';
import { gainExp, growUnit, levelOf } from '../src/core/level.js';
import { dreamShardOf, giveHeart, isDormant, pickHeart, setDormant, teachHeart, useDreamShard } from '../src/core/shards.js';
import { MAPS } from '../src/data/maps.js';
import { ALLIES } from '../src/data/units.js';

function knowAll(keep) {
    for (const id of ['mio', 'kana']) {
        growCanvas(keep, id, true);
        growCanvas(keep, id, true);
    }
}

test('完ぺきな 絵 (段階 5 まで 描き上げた 夢) なら、次の周は 活性化前でも 入れる', () => {
    const keep = createKeep();
    growCanvas(keep, 'mio', true);
    assert.ok(!knowsDream(keep, 'mio'));
    growCanvas(keep, 'mio', true);
    assert.ok(knowsDream(keep, 'mio'), '段階 5');
    const state = nextLoop(keep, createState());
    state.day = 2;
    assert.deepEqual(dreamsTonight(state, keep).filter((d) => d !== 'riku'), ['mio'], 'カナの 絵は まだ 漠然としている');
});

test('合体の夢も 2 人とも 絵を 知っていれば 活性化前に 入れる', () => {
    const keep = createKeep();
    knowAll(keep);
    const state = nextLoop(keep, createState());
    state.day = 3;
    assert.deepEqual(dreamsTonight(state, keep).filter((d) => d !== 'riku'), ['mio', 'kana', 'duet']);
});

test('活性化前に 救うと、もう片方は 刈り取られない (ナイトメアは まだ 来ない)', () => {
    const state = createState();
    state.day = 3;
    const keep = createKeep();
    rescue(state, keep, 'mio', 'gakufume');
    assert.equal(state.status.kana, 'idle');
});

test('活性化前の ボスは 夢に いる (完ぺきな 絵で 入ったとき)', () => {
    const state = createState();
    Object.assign(state, { map: 'mizuzoko4', day: 3 });
    assert.ok(!objectsOf(state).some((o) => o.id === 'mioBoss'));
    state.flags.early = true;
    assert.ok(objectsOf(state).some((o) => o.id === 'mioBoss'));
});

test('夢のかけら: 前の周に 救った ユメクイが 変化したもの。使うと 前の周の レベルで 活性化する', () => {
    const keep = createKeep();
    const prev = createState();
    prev.status.mio = 'saved';
    prev.levels = { gakufume: { lv: 9, exp: 40 } };
    const state = nextLoop(keep, prev);
    assert.deepEqual(dreamShardOf(keep, 'gakufume'), { lv: 9, exp: 40 });
    assert.equal(dreamShardOf(keep, 'togemetoro'), null, '救っていない ユメクイは かけらに ならない');
    setDormant(state, 'gakufume');
    assert.ok(isDormant(state, 'gakufume'));
    assert.ok(useDreamShard(state, keep, 'gakufume'));
    assert.ok(!isDormant(state, 'gakufume'));
    assert.equal(levelOf(state, 'gakufume').lv, 9);
    assert.equal(dreamShardOf(keep, 'gakufume'), null, '使うと なくなる');
});

test('心のかけら (経験値): 持たせた ユメクイは 経験値 1.5 倍。ループしても なくならない', () => {
    const keep = createKeep();
    assert.ok(pickHeart(keep, 'heartMio'));
    assert.ok(!pickHeart(keep, 'heartMio'), '同じ かけらは 1 つ');
    giveHeart(keep, 'heartMio', 'gakufume');
    const state = createState();
    gainExp(state, keep, { party: ['bak', 'gakufume'] }, 100);
    assert.ok(levelOf(state, 'gakufume').lv > levelOf(state, 'bak').lv || levelOf(state, 'gakufume').exp > levelOf(state, 'bak').exp);
    const next = nextLoop(keep, state);
    assert.equal(keep.hearts.heartMio.holder, 'gakufume');
    assert.ok(next.gone.heartMio, '拾った かけらは もう 落ちていない');
    assert.ok(MAPS.mizuzoko3.objects.some((o) => o.id === 'heartMio'));
});

test('心のかけら (技): 本来 覚えない 技を 覚えさせる', () => {
    const keep = createKeep();
    pickHeart(keep, 'heartDispel');
    assert.ok(teachHeart(keep, 'heartDispel', 'togemetoro'));
    assert.ok(!teachHeart(keep, 'heartDispel', 'gakufume'), '1 つの かけらで 1 体');
    const unit = growUnit(ALLIES.togemetoro, keep, createState());
    assert.ok(unit.moves.extra.some((m) => m.id === 'dispel'));
});
