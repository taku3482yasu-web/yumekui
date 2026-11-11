// 土日の 昼の バイト (仕様書「土日の昼のバイトと絆イベント」。ごほうびは 2026-11-11 ユーザー指定で 駄菓子)。
//   トメの 駄菓子屋で 店番か 荷運び。どちらも 昼の 時間を 使い、夕方に なって 家に 帰る (じっくり話すと 同じ 1 日 1 回)。
//   お礼の 駄菓子は バトルの「アイテム」で 使う 回復の 品。state に 持つので ループすると 消える
import { ACTIVE_DAY, isWeekend } from './days.js';

export const JOBS = {
    shop: { label: '店番', snacks: 1 },     // お客さんの 話 (ヒント) が 聞ける
    carry: { label: '荷運び', snacks: 2 }   // 体を 使うぶん、お礼が 多い
};

export function canWork(state) {
    return isWeekend(state.day) && state.phase === 'day' && !state.flags?.prologue && !state.talkedToday;
}

export function work(state, id) {
    const job = JOBS[id];
    state.snacks = (state.snacks ?? 0) + job.snacks;
    state.talkedToday = true;
    state.time = 'evening';
    return job.snacks;
}

export function useSnack(state) {
    if (!(state.snacks > 0)) return false;
    state.snacks--;
    return true;
}

// 店番で お客さんから 聞ける 話 (物語の 進み具合で 変わる)。story.js の LINES.shopHint の キー
export function shopHint(state, keep) {
    if (state.status.riku === 'idle' && keep.loop >= 2 && state.day >= 3 && !state.words.includes('引っ越し')) return 'rikuHouse';
    if (state.day < ACTIVE_DAY && state.status.mio === 'idle' && state.status.kana === 'idle') return 'band';
    if (state.status.mio === 'eaten' || state.status.kana === 'eaten' || state.status.riku === 'eaten') return 'empty';
    if (state.status.mio === 'saved' || state.status.kana === 'saved') return 'concert';
    return 'quiet';
}
