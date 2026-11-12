import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeyQueue, pushKey, QUEUE_MS, QUEUE_SIZE, takeKey } from '../src/core/keyqueue.js';

test('キーの ためおき: 押した 順に 1 つずつ 出てくる', () => {
    const queue = createKeyQueue();
    pushKey(queue, 'down', 0);
    pushKey(queue, 'a', 50);
    assert.equal(takeKey(queue, 150), 'down', 'ベッドの 前で 下 → 向きが 変わる');
    assert.equal(takeKey(queue, 160), 'a', 'つぎに 決定 → 調べる');
    assert.equal(takeKey(queue, 170), null, '空に なったら null');
});

test('キーの ためおき: 古すぎる キーは 捨てて、次の キーを 出す', () => {
    const queue = createKeyQueue();
    pushKey(queue, 'left', 0);
    pushKey(queue, 'a', 200);
    assert.equal(takeKey(queue, QUEUE_MS + 1), 'a', '0 に 押した 左は 古いので とばす');
    assert.equal(queue.length, 0);

    pushKey(queue, 'up', 1000);
    assert.equal(takeKey(queue, 1000 + QUEUE_MS), 'up', 'ちょうど QUEUE_MS なら まだ 使う');
});

test('キーの ためおき: いっぱいなら それより あとの キーは 捨てる', () => {
    const queue = createKeyQueue();
    const keys = ['up', 'down', 'left', 'right', 'a'];
    for (const key of keys) pushKey(queue, key, 0);
    assert.equal(queue.length, QUEUE_SIZE);
    const out = [];
    for (let key; (key = takeKey(queue, 10)) !== null;) out.push(key);
    assert.deepEqual(out, keys.slice(0, QUEUE_SIZE), '先に 押した 3 つが 残る');
});
