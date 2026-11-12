// 歩いている とちゅうに ちょんと 押した キーを ためておく 入れもの。
//   1 マス 着いてから 古い順に 使う (着く 直前に 向きを かえたり 調べたり しても、
//   むしされて 止まったように ならないように)。時間は 外から もらう (テストしやすいように)
export const QUEUE_MS = 300;   // これより 前に 押した キーは 古いので 捨てる
export const QUEUE_SIZE = 3;   // ためる キーは 3 つまで (それより あとの キーは 捨てる)

export function createKeyQueue() {
    return [];
}

// キーを ためる。いっぱいなら ためない
export function pushKey(queue, key, now) {
    if (queue.length < QUEUE_SIZE) queue.push({ key, at: now });
}

// いちばん 古い キーを 1 つ 取り出す。古すぎる キーは とばす。無ければ null
export function takeKey(queue, now) {
    while (queue.length) {
        const { key, at } = queue.shift();
        if (now - at <= QUEUE_MS) return key;
    }
    return null;
}
