import test from 'node:test';
import assert from 'node:assert/strict';
import { nextLoop, createKeep } from '../src/core/calendar.js';
import { createState, isBlocked, objectsOf } from '../src/core/field.js';
import { battleExp, layerFoe, reachLayer, reachedLayer } from '../src/core/level.js';
import { DREAM_LAYERS, MAPS } from '../src/data/maps.js';
import { FOES } from '../src/data/units.js';

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function stateAt(map) {
    const state = createState();
    Object.assign(state, { map, x: MAPS[map].start.x, y: MAPS[map].start.y, phase: 'night', day: 8 });
    state.flags.bak = true;
    state.flags.active = true;
    state.flags.rikuWall = true;   // リクの夢の しおれた 壁 (3 周目に 開く)
    return state;
}

// 敵や物を よけて 歩いて 届く マス (target だけは 踏んでよい)
function canWalk(state, target, { ignoreFoes = false } = {}) {
    const objects = objectsOf(state);
    const seen = new Set([`${state.x},${state.y}`]);
    const queue = [[state.x, state.y]];
    while (queue.length) {
        const [x, y] = queue.shift();
        if (x === target.x && y === target.y) return true;
        for (const [dx, dy] of DIRS) {
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;
            if (seen.has(key)) continue;
            const isTarget = nx === target.x && ny === target.y;
            if (!isTarget && (isBlocked(state, nx, ny) || objects.some((o) => o.x === nx && o.y === ny && !(ignoreFoes && o.kind === 'foe')))) continue;
            seen.add(key);
            queue.push([nx, ny]);
        }
    }
    return false;
}

test('階層の数: 単独の夢は 3 階層＋最深部、合体の夢は 4 階層＋最深部', () => {
    assert.equal(DREAM_LAYERS.mio.length, 4);
    assert.equal(DREAM_LAYERS.kana.length, 4);
    assert.equal(DREAM_LAYERS.duet.length, 5);
    for (const list of Object.values(DREAM_LAYERS)) {
        list.forEach((id, i) => assert.equal(MAPS[id].layer, i + 1, id));
        assert.ok(MAPS[list.at(-1)].deepest);
    }
});

test('どの階層も 入口のそばに 毛布と 光る扉、部屋は 2〜5 つ (最深部は 舞台と通路)', () => {
    for (const list of Object.values(DREAM_LAYERS)) {
        for (const id of list) {
            const map = MAPS[id];
            const near = (o) => Math.abs(o.x - map.start.x) + Math.abs(o.y - map.start.y) <= 2;
            assert.ok(map.objects.some((o) => o.kind === 'wake' && near(o)), `${id} の 光る扉`);
            assert.ok(map.objects.some((o) => o.script === 'rest' && near(o)), `${id} の 毛布`);
            const rooms = map.rooms?.length ?? 0;
            assert.ok(rooms >= (map.deepest ? 2 : 3) && rooms <= 5, `${id} の 部屋 ${rooms}`);
        }
    }
});

test('階段で 次の階層へ。敵を よけても 階段に 届き、着く場所は 次の階層の 入口', () => {
    for (const [dream, list] of Object.entries(DREAM_LAYERS)) {
        list.slice(0, -1).forEach((id, i) => {
            const down = MAPS[id].objects.find((o) => o.kind === 'exit' && o.to === list[i + 1]);
            assert.ok(down, `${id} の 階段`);
            assert.equal(MAPS[id].tiles[down.y][down.x], 's', `${id} の 階段の 絵`);
            assert.deepEqual(down.at, MAPS[list[i + 1]].start);
            if (dream === 'duet' && i === 0) return;   // 二重奏ホールの 第 1 層は 扉と 中ボス (duet.test.js)
            // 第 1 層は 今までの 地図 (道を ふさぐ 敵を 倒して 進む)。第 2 層から下は 敵を よけても 届く
            assert.ok(canWalk(stateAt(id), down, { ignoreFoes: i === 0 }), `${id} から 階段へ`);
        });
    }
});

test('ボスは 最深部に いて、入口から 歩いて 届く。第 1 層には いない', () => {
    for (const list of Object.values(DREAM_LAYERS)) {
        const deep = MAPS[list.at(-1)];
        const boss = deep.objects.find((o) => o.kind === 'foe' && FOES[o.foe].truth);
        assert.ok(boss, deep.id);
        assert.ok(canWalk(stateAt(deep.id), boss));
        assert.ok(!MAPS[list[0]].objects.some((o) => o.kind === 'foe' && FOES[o.foe].truth), list[0]);
    }
});

test('下の階層ほど 敵が強く、経験値も 多い', () => {
    const base = FOES.onpu;
    assert.equal(layerFoe(base, 1), base);
    const deep = layerFoe(base, 3);
    assert.equal(deep.maxHp, Math.round(base.maxHp * 1.3));
    assert.equal(deep.hp, deep.maxHp);
    const boss = layerFoe(FOES.gakufume, 4);
    assert.equal(boss.atk, Math.round(FOES.gakufume.atk * 1.3), 'ボスは 1 階層 ＋10%');
    assert.equal(battleExp([FOES.gakufume], 4), Math.round(120 * 1.75));
});

test('たどり着いた 階層は その周だけ 覚えている', () => {
    const state = createState();
    assert.equal(reachedLayer(state, 'mio'), 1);
    reachLayer(state, 'mio', 3);
    reachLayer(state, 'mio', 2);
    assert.equal(reachedLayer(state, 'mio'), 3, '浅い 階層に 戻っても 減らない');
    assert.equal(reachedLayer(state, 'kana'), 1);
    const next = nextLoop(createKeep());
    assert.equal(reachedLayer(next, 'mio'), 1, 'ループで 消える');
});
