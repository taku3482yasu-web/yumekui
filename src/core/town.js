// 現実の町 (学校・坂道と商店街・ハルの家) の決まり。仕様書「現実のフィールド」「1日の流れ」
//   - 人 (person) は 日と夢主の状態で 出たり消えたりする (present)
//   - 夢主 (mio / kana) とは「じっくり話す」ができる。1 日 1 人で、話すと夕方になって家に帰る
//   - 立ち話は 何回でも
import { PAIR, RIKU_DOWN_DAY, activeDay, isWeekend } from './days.js';

// その人が 今 町にいるか。夜の町には 人がいない (父は 家にいる)。
//   朝は 通学路の ムービー (scenes/mornings.js) で その日の 人だけを 出すので、地図の 人は 出さない
export function present(state, who) {
    if (state.phase === 'night') return who === 'father';
    if (state.flags.prologue && ['riku', 'mio', 'kana'].includes(who)) return false;   // プロローグ: リクは いっしょに歩く。ミオとカナは 部活
    if (state.phase === 'morning') return false;
    if (who === 'riku') return state.day < RIKU_DOWN_DAY;                    // 3 日の朝から 目を覚まさない
    if (PAIR.includes(who)) {
        const status = state.status[who];
        if (status === 'saved' || status === 'eaten') return true;          // 目を覚ました (喰らった人は 気持ちが ない)
        // 期限 (7 日) か、話を 最後まで 進めた 次の日から 倒れている。進めた その日は まだ 町にいる。刈り取られた人も 来ない
        return status === 'idle' && (state.day < activeDay(state) || (state.day === state.activeDay && state.story?.duet && state.phase !== 'morning'));
    }
    return true;
}

// じっくり話せるか (今日まだ だれとも じっくり話していない・その夢主が 元気)
export function canDeepTalk(state, who) {
    return PAIR.includes(who) && state.status[who] === 'idle' && state.day < activeDay(state) && !state.talkedToday;
}

// じっくり話す。訪ねた回数を数えて、まだ聞いていない言葉が あれば 拾う
//   返り値: { count: 前に話した回数, word: 新しく聞いた言葉 (なければ null) }
export function deepTalk(state, who, word) {
    const count = state.visits[who] ?? 0;
    state.visits[who] = count + 1;
    state.talkedToday = true;
    state.time = 'evening';
    const fresh = word && !state.words.includes(word);
    if (fresh) state.words.push(word);
    return { count, word: fresh ? word : null };
}

// 画面左上の 時間帯 (仕様書「画面左上の表示」): 朝 / 昼 (土日だけ) / 放課後 (平日) / 夕方 / 夜
export function timeLabel(state) {
    if (state.phase === 'night') return '夜';
    if (state.phase === 'morning') return '朝';
    if (state.time === 'evening') return '夕方';
    return isWeekend(state.day) ? '昼' : '放課後';
}

// 放課後 (土日は 昼) の はじまり。平日は 教室から、土日は 自分の部屋から
export function startDay(state) {
    state.time = 'day';
    state.talkedToday = false;
    const at = isWeekend(state.day) ? TOWN_START.weekend : TOWN_START.weekday;
    Object.assign(state, { map: at.map, x: at.x, y: at.y, dir: at.dir });
}

// 朝の はじまり (平日だけ): 家の前。ここから 通学路の ムービーで 校門まで 歩く
export function startMorning(state) {
    state.time = 'day';
    Object.assign(state, MORNING_START);
}

export const MORNING_START = { map: 'saka', x: 4, y: 17, dir: 'right' };

// 1 日の 時間の流れ (時間が過ぎていく演出で 見せる 順番)
export const TIMES = ['朝', '昼', '放課後', '夕方', '夜'];

// from から to までの 時間帯 (両はし を ふくむ)。土日は 放課後が ない
export function timesBetween(from, to, weekend = false) {
    const list = TIMES.filter((t) => !(weekend && t === '放課後'));
    const a = list.indexOf(from);
    const b = list.indexOf(to);
    return a < 0 || b < 0 || b <= a ? [] : list.slice(a, b + 1);
}

export const TOWN_START = {
    weekday: { map: 'school', x: 3, y: 6, dir: 'down' },
    weekend: { map: 'home', x: 12, y: 5, dir: 'down' }   // 土日は 昼に 自分の部屋から。玄関から 外へ
};

// プロローグ (2月1日の放課後): 授業が 終わって 教室で 目が覚める。リクと 学校を出て、坂道を 下って 家に帰る
export const PROLOGUE_START = { map: 'school', x: 3, y: 6, dir: 'down' };
export const RIKU_BRANCH_Y = 9;   // ここまで 下ると 坂の分かれ道で リクと 別れる

// 夜 (キャンバスの前)
export const NIGHT_START = { map: 'home', x: 12, y: 3, dir: 'right' };
