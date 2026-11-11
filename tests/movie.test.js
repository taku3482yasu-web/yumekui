import test from 'node:test';
import assert from 'node:assert/strict';
import { checkMovie, kindOf, runMovie, stepsOf } from '../src/core/movie.js';
import { MOVIES } from '../src/scenes/movies.js';
import { BGM, SE } from '../src/data/sounds.js';

// 命令を 記録する だけの 再生役。flag の 命令で 状態を 変える
function recorder() {
    const log = [];
    const state = { bgm: undefined, flags: {} };
    return {
        log, state,
        run(step, instant) {
            log.push({ kind: kindOf(step), instant });
            if ('bgm' in step) state.bgm = step.bgm;
            if (step.flag) state.flags[step.flag] = true;
        }
    };
}

const SAMPLE = {
    steps: [
        { bgm: 'M07' },
        { show: 'haru', sprite: 'hal-down', x: 100, y: 100 },
        { move: 'haru', to: [200, 100], ms: 500 },
        { wait: 300, keep: true, flag: 'sawShadow' },
        { bgm: null, hard: true },
        { say: ['', '……'] },
        { bgm: 'M03' }
    ],
    short: [{ bgm: 'M03' }, { wait: 0, keep: true, flag: 'sawShadow' }]
};

test('最後まで 流すと、すべての 命令を 順に 実行する', async () => {
    const p = recorder();
    const result = await runMovie(SAMPLE.steps, p);
    assert.equal(result.skipped, false);
    assert.equal(p.log.length, SAMPLE.steps.length);
    assert.ok(p.log.every((entry) => !entry.instant));
});

test('途中で 飛ばしても、最後まで 見たときと 同じ 状態で 次へ 進む', async () => {
    const full = recorder();
    await runMovie(SAMPLE.steps, full);
    for (let at = 0; at < SAMPLE.steps.length; at++) {
        const p = recorder();
        let count = 0;
        const result = await runMovie(SAMPLE.steps, { ...p, run: (step, instant) => { count++; return p.run(step, instant); } }, { skipped: () => count >= at });
        assert.equal(result.skipped, at < SAMPLE.steps.length, `at ${at}`);
        assert.deepEqual(p.state, full.state, `at ${at}`);
    }
});

test('飛ばしたあとは 見た目の 命令を 実行しない (keep と 最後の 曲だけ)', async () => {
    const p = recorder();
    await runMovie(SAMPLE.steps, p, { skipped: () => true });
    assert.deepEqual(p.log, [{ kind: 'wait', instant: true }, { kind: 'bgm', instant: true }]);
});

test('2 回目からは 短い版', () => {
    assert.equal(stepsOf(SAMPLE, false), SAMPLE.steps);
    assert.equal(stepsOf(SAMPLE, true), SAMPLE.short);
    assert.equal(stepsOf(MOVIES.NIGASANAI, true), MOVIES.NIGASANAI.steps);   // 短い版が 無ければ ふつうの版
});

test('どの ムービーも 命令の 書き方が 正しく、曲と 効果音の 番号が ある', () => {
    for (const [id, movie] of Object.entries(MOVIES)) {
        assert.deepEqual(checkMovie(movie), [], id);
        for (const step of [...movie.steps, ...(movie.short ?? [])]) {
            if (step.bgm) assert.ok(BGM[step.bgm], `${id} ${step.bgm}`);
            if (step.se) assert.ok(SE[step.se], `${id} ${step.se}`);
        }
    }
    assert.deepEqual(checkMovie({ steps: [{ nope: 1 }, { move: 'a' }] }), ['0: 知らない 命令', '1: move に to が ない']);
});
