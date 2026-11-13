// 朝の通学路のムービー (2026-11-10 ユーザー指定)
// ハルが 家の前から 坂道を 校門まで 歩く様子を 自動で 流す。途中の 3 か所 (stop) で 立ち止まり、その日の 出来事が起きる。
// 出来事は 日付・周・夢主の状態 (救った / 喰らった / 刈り取られた) で 選ぶ。上から順に 条件に 合う 最初の 1 つ。
// once: その周で 1 回だけ (見たら state.flags に 残す)。セリフは 口調を キャラクター設定資料集に 合わせた案
import { PAIR, activeDay, lastRescueDay } from '../core/days.js';

const N = '';
const HAL = 'ハル';
const BAK = 'バク';
const GIRL = '女子生徒';
const BOY = '男子生徒';
const NAME = { mio: 'ミオ', kana: 'カナ' };
const other = (id) => PAIR.find((item) => item !== id);

// ハルの 歩く道 (坂道と商店街の 地図の マス)。家の前から 校門まで (朝が あるのは 平日だけ。土日は 朝が 飛んで 昼から)
const ROUTE = [{ walk: [9, 17] }, { walk: [9, 13] }, { stop: 1 }, { walk: [9, 7] }, { stop: 2 }, { walk: [11, 3] }, { stop: 3 }, { walk: [11, 2] }];

// 出来事の 登場人物の 立ち位置 (stop ごと。ハルの 道の となり)
const SPOT = {
    1: [[10, 12], [11, 12], [10, 13]],
    2: [[7, 7], [6, 7], [12, 6], [13, 6]],
    3: [[12, 2], [13, 3], [12, 3]]
};
const cast = (stop, ...who) => who.map((id, i) => ({ who: id, x: SPOT[stop][i][0], y: SPOT[stop][i][1] }));

const statusIs = (c, value) => PAIR.filter((id) => c.state.status[id] === value);

export const MORNING_EVENTS = [
    // ---- stop 1: 坂の下 ----
    {
        id: 'eatenWalk', stop: 1, once: true,
        when: (c) => statusIs(c, 'eaten').length > 0 && c.state.day >= 2,
        cast: (c) => cast(1, statusIs(c, 'eaten')[0]),
        lines: (c) => {
            const id = statusIs(c, 'eaten')[0];
            return [[N, `${NAME[id]}が、ぼんやりと坂を上っていく。`], [NAME[id], '……あ、ハルくん。おはよう。'], [HAL, '……おはよう。'], [N, 'その目は、どこも見ていなかった。'], [BAK, '……喰らったのは、お前だぞ。']];
        }
    },
    {
        id: 'savedMio', stop: 1, once: true,
        when: (c) => c.state.status.mio === 'saved',
        cast: () => cast(1, 'mio'),
        lines: () => [['ミオ', 'ハルくん、おはよう。……昨日、変な夢を見たの。水の中で、ずっと一人で吹いてる夢。'], ['ミオ', 'でも最後に、だれかが「一緒に」って言ってくれた気がする。……変だよね。', 'smile'], [HAL, '……ううん。変じゃないよ。', 'smile']]
    },
    {
        id: 'savedKana', stop: 1, once: true,
        when: (c) => c.state.status.kana === 'saved',
        cast: () => cast(1, 'kana'),
        lines: () => [['カナ', 'ハル！ おはよ。なんか今日、体が軽いんだ。', 'smile'], ['カナ', 'ずっと頭の中で鳴ってたメトロノーム、止まったの。……なんでだろ。', 'smile'], [HAL, '……よかった。', 'smile']]
    },
    {
        id: 'reaped', stop: 1, once: true,
        when: (c) => statusIs(c, 'reaped').length > 0,
        cast: () => cast(1, 'commuterA', 'commuterB'),
        lines: (c) => {
            const id = statusIs(c, 'reaped')[0];
            return [[GIRL, `${NAME[id]}、昨日から目を覚まさないんだって……。${NAME[other(id)]}は起きたのに。`], [BOY, '一緒に倒れて、片方だけ起きるなんてな……。'], [BAK, '……前を向いて歩け。']];
        }
    },
    {
        id: 'rikuLoop', stop: 1,
        when: (c) => c.state.day < 3 && c.loop >= 2,
        cast: () => cast(1, null, null, 'riku'),
        lines: () => [['リク', 'ハル、おはよ！ ……ん？ なんか今日のお前、顔つき違くね？', 'surprised'], ['リク', 'ま、いっか！ だいじょうぶだいじょうぶ！', 'smile'], [HAL, '……リク。', 'troubled'], [BAK, '……言っても信じねえよ。今は、やれることをやれ。']]
    },
    {
        id: 'riku', stop: 1,
        when: (c) => c.state.day < 3,
        cast: () => cast(1, null, null, 'riku'),
        lines: () => [['リク', 'ハル、おはよ！ 今日も坂、きっついなー。', 'smile'], ['リク', '……なあ、今度の春休みさ。……いや、やっぱなんでもねえ！', 'troubled'], [HAL, '……？', 'surprised']]
    },
    {
        id: 'classmates', stop: 1,
        when: (c) => c.state.day >= 3 && c.state.day < 7,
        cast: () => cast(1, 'kaito', 'momo'),
        lines: () => [['カイト', 'リクのやつ、見舞いに行ったけど、寝てるだけだった。……笑ってたぞ、寝顔。'], ['モモ', 'ハルくんも、行ってあげて？ ……きっと、待ってるよ？']]
    },
    {
        id: 'gossip', stop: 1,
        when: () => true,
        cast: () => cast(1, 'commuterA', 'commuterB'),
        lines: (c) => {
            const d = c.state.day;
            if (d < activeDay(c.state)) return [[GIRL, 'ミオ、放課後はずっと音楽室で、一人で吹いてるんだって。'], [BOY, 'カナは渡り廊下で、メトロノーム鳴らしっぱなしだったぞ。……話しかけたら、なんか言うかもな。']];
            if (d <= lastRescueDay(c.state)) return [[GIRL, 'ミオもカナも、目を覚まさないんだって……。'], [BOY, '眠り病ってさ、倒れてから何日もたつと、もう起きないって噂だぜ。……9日くらいが山だって。']];
            return [[GIRL, 'コンクール、どうなるんだろうね。'], [BOY, '……なあ、最近、空の色おかしくね？']];
        }
    },

    // ---- stop 2: 商店街 ----
    {
        id: 'kenDejavu', stop: 2,
        when: (c) => c.loop >= 2 && c.state.day < 3,
        cast: () => cast(2, 'tome', 'ken'),
        lines: () => [['ケン', 'なあなあ、ハル兄ちゃん。……あれ？ この話、昨日もしなかったっけ？'], ['トメ', 'なに言ってんだい。寝ぼけてるねぇ。'], [BAK, '……鋭いガキだな。']]
    },
    {
        id: 'tome', stop: 2,
        when: () => true,
        cast: () => cast(2, 'tome'),
        lines: (c) => {
            const d = c.state.day;
            if (d < 3) return [['トメ', 'おはよう、ハルちゃん。いってらっしゃい。車に気をつけるんだよぉ。']];
            if (d < 7) return [['トメ', 'リクちゃん、まだ目を覚まさないんだってねぇ……。'], ['トメ', 'あの子の笑い声が聞こえないと、坂が静かでいけないよ。']];
            return [['トメ', 'このごろ、眠ったまま起きない子が増えてねぇ。'], ['トメ', 'ハルちゃんも、ちゃんと寝るんだよぉ。……ちゃんと、起きるんだよぉ。']];
        }
    },

    // ---- stop 3: 校門 (平日だけ) ----
    {
        id: 'akiLoop', stop: 3,
        when: (c) => c.loop >= 2 && c.state.day === 1,
        cast: () => cast(3, 'aki'),
        lines: () => [['アキ先生', 'おはようございます！ あれ、夜見くん、今日はなんだか早いですよね！', 'smile'], [HAL, '……おはようございます。'], [BAK, '2回目の2月1日だ。……顔に出すなよ。']]
    },
    {
        id: 'hintAffinity', stop: 3,
        when: (c) => c.state.day < activeDay(c.state) && c.state.status.mio === 'idle' && c.state.status.kana === 'idle',   // 解放された人の ヒントは 朝にも 聞ける (11/11)
        cast: () => cast(3, null, 'commuterC', 'commuterD'),
        // 相性 (喜 > 怒 > 哀 > 楽 > 喜) の ヒント。ガクフメ (哀) だけ 仲間なら、カナ (怒) は 喜に弱い・バク (楽) は 哀に弱い
        lines: (c) => (c.keep.allies.includes('gakufume') && !c.keep.allies.includes('togemetoro')
            ? [[BOY, 'カナってさ、明るく笑い飛ばすやつには、なんか弱いんだよな。'], [GIRL, 'ミオは逆に、のんびりした子といると、つい強く出ちゃうんだって。']]
            : [[BOY, 'カナってさ、本気で怒ると、ミオは何も言い返せないんだよな。'], [GIRL, 'ミオの静かな音って、カナの勢いにはいつも押されちゃうんだよね。']])
    },
    {
        id: 'hintDream', stop: 3,
        when: () => true,
        cast: () => cast(3, null, 'commuterC', 'commuterD'),
        lines: (c) => (c.state.day < 7
            ? [[BOY, 'リクが起きないなんて、うそだろ……。'], [GIRL, 'リクくん、いつも笑ってたのに。……笑ってる人ほど、何か抱えてるのかもね。']]
            : [[BOY, '夢の中で、白い影に追いかけられる夢を見たんだ。'], [GIRL, 'やめてよ……。でも、寝る前に その人の顔を思い浮かべると、その人の夢を見るって言うよね。']])
    }
];

// その朝の 出来事を 選ぶ (stop ごとに 1 つ)
export function pickMorningEvents(state, keep) {
    const c = { state, keep, loop: keep.loop };
    const chosen = {};
    for (const event of MORNING_EVENTS) {
        if (chosen[event.stop]) continue;
        if (event.once && state.flags[`ev_${event.id}`]) continue;
        if (event.when(c)) chosen[event.stop] = event;
    }
    return { c, chosen };
}

// ムービーの 手順 ({ walk } / { cast, say, event }) にする。出来事は 見たことにする (once)
export function morningMovie(state, keep) {
    const { c, chosen } = pickMorningEvents(state, keep);
    const steps = [];
    for (const step of ROUTE) {
        if (!step.stop) {
            steps.push(step);
            continue;
        }
        const event = chosen[step.stop];
        if (!event) continue;
        if (event.once) state.flags[`ev_${event.id}`] = true;
        steps.push({ event: event.id, cast: event.cast(c).filter((a) => a.who), say: event.lines(c) });
    }
    return steps;
}
