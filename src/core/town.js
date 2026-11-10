// 現実の町 (学校・坂道と商店街・ハルの家) の決まり。仕様書「現実のフィールド」「1日の流れ」
//   - 人 (person) は 日と夢主の状態で 出たり消えたりする (present)
//   - 夢主 (mio / kana) とは「じっくり話す」ができる。1 日 1 人で、話すと夕方になって家に帰る
//   - 立ち話は 何回でも
import { ACTIVE_DAY, PAIR, RIKU_DOWN_DAY, isWeekend } from './days.js';

// その人が 今日 町にいるか
export function present(state, who) {
    if (who === 'riku') return state.day < RIKU_DOWN_DAY;                    // 3 日の朝から 目を覚まさない
    if (PAIR.includes(who)) {
        const status = state.status[who];
        if (status === 'saved' || status === 'eaten') return true;          // 目を覚ました (喰らった人は 気持ちが ない)
        return status === 'idle' && state.day < ACTIVE_DAY;                  // 7 日から 倒れている。刈り取られた人も 来ない
    }
    return true;
}

// じっくり話せるか (今日まだ だれとも じっくり話していない・その夢主が 元気)
export function canDeepTalk(state, who) {
    return PAIR.includes(who) && state.status[who] === 'idle' && state.day < ACTIVE_DAY && !state.talkedToday;
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

// 画面左上の 時間帯 (仕様書「画面左上の表示」): 昼 (土日だけ) / 放課後 (平日) / 夕方 / 夜
export function timeLabel(state) {
    if (state.phase === 'night') return '夜';
    if (state.time === 'evening') return '夕方';
    return isWeekend(state.day) ? '昼' : '放課後';
}

// 放課後 (土日は 昼) の はじまり。平日は 教室から、土日は 家の前から
export function startDay(state) {
    state.time = 'day';
    state.talkedToday = false;
    const at = isWeekend(state.day) ? TOWN_START.weekend : TOWN_START.weekday;
    Object.assign(state, { map: at.map, x: at.x, y: at.y, dir: at.dir });
}

export const TOWN_START = {
    weekday: { map: 'school', x: 3, y: 6, dir: 'down' },
    weekend: { map: 'saka', x: 6, y: 17, dir: 'up' }
};

// 夜 (キャンバスの前)
export const NIGHT_START = { map: 'home', x: 12, y: 3, dir: 'right' };
