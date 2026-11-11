// 演出スクリプト: 1 本の ムービーを「命令の リスト」として 順に 流す (素材制作仕様書「ムービー」)。
//   画面に 描く 部分は view/movie.js、各ムービーの リストは scenes/movies.js。
//
//   命令 (1 つの 命令に 1 つの 名前):
//     { bg: '#000' }                              背景の 色
//     { show: 'id', sprite: 'bak', x, y, scale }  絵を 出す (frames: ['a','b'] と frameMs で コマ送り)
//     { hide: 'id' }                              絵を 消す
//     { move: 'id', to: [x, y], ms }              絵を 動かす (歩く・横移動)
//     { zoom: 'id', scale, ms }                   絵を 拡大する (寄る)
//     { frames: 'id', list: [...], frameMs }      コマを 切り替える
//     { shake: ms }                               画面を 揺らす
//     { dark: 0〜1, ms }                          画面を 暗くする (1 で 真っ黒)
//     { gray: true / false }                      色を 抜く
//     { say: ['名前', 'セリフ'], ms }              字幕 (セリフの 声も 鳴る)
//     { text: '文字', color, ms }                 画面の まん中に 文字 (赤い「にがさない」など)
//     { bgm: 'M15' } / { bgm: null, hard: true }  曲を 鳴らす・止める
//     { se: 'SE40' }                              効果音
//     { wait: ms }                                待つ
//     { call: '名前', ... }                       今ある 演出を 呼ぶ (カレンダー・時間・描く画面 など)
//   keep: true の 命令は、飛ばしても 必ず 実行する (状態を 変える 命令)。
//   曲の 命令は、飛ばしたとき 最後の 1 つだけ 実行する (飛ばしても 同じ 曲で 次へ 進む)。

export const SKIP_HOLD_MS = 700;   // 決定ボタンを これだけ 押し続けると 飛ばす

// 2 回目からは 短い版 (あれば)
export function stepsOf(movie, seen = false) {
    if (!movie) return [];
    return seen && movie.short ? movie.short : movie.steps;
}

const isAudio = (step) => 'bgm' in step;

// 命令を 順に 流す。player.run(step, instant) が 1 つの 命令を 実行する (instant なら 待たずに 結果だけ)。
//   skipped() が true に なったら、残りは keep の 命令と 最後の 曲の 命令だけ を すぐに 実行する
export async function runMovie(steps, player, { skipped = () => false } = {}) {
    let index = 0;
    for (; index < steps.length; index++) {
        if (skipped()) break;
        await player.run(steps[index], false);
    }
    if (index >= steps.length) return { skipped: false };
    const rest = steps.slice(index);
    const lastAudio = rest.findLast(isAudio);
    for (const step of rest) {
        if (step.keep || step === lastAudio) await player.run(step, true);
    }
    return { skipped: true };
}

// 命令の 書き方の まちがいを 探す (テスト用)
const KINDS = ['bg', 'show', 'hide', 'move', 'zoom', 'frames', 'shake', 'dark', 'gray', 'say', 'text', 'bgm', 'se', 'wait', 'call'];
export function kindOf(step) {
    return KINDS.find((kind) => kind in step) ?? null;
}
export function checkMovie(movie) {
    const problems = [];
    for (const list of [movie.steps, movie.short].filter(Boolean)) {
        list.forEach((step, i) => {
            if (!kindOf(step)) problems.push(`${i}: 知らない 命令`);
            if ('move' in step && !Array.isArray(step.to)) problems.push(`${i}: move に to が ない`);
            if ('show' in step && !step.sprite && !step.frames) problems.push(`${i}: show に 絵が ない`);
        });
    }
    return problems;
}
