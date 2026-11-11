// 小規模版の 2 週間の日程 (企画書「小規模版の2週間の日程」)。calendar.js と town.js が使う
export const OPEN_DAY = 2;
export const RIKU_DOWN_DAY = 3;
export const ACTIVE_DAY = 7;          // 期限: 話を進めなくても、この日に ユメクイが 活性化して 夢主が 倒れる (企画書「ストーリーの進め方」11/11)
export const LAST_RESCUE_DAY = 9;     // 期限どおりに 活性化したときの 最後の 救える夜
export const RESCUE_NIGHTS = 3;       // 活性化してから 救える 夜の数
export const STORY_STEPS = 3;         // ミオ×カナの ストーリーの 段数。最後の段を 見た夜に 活性化する
export const LAST_DAY = 14;
export const WAKE_DAY = 12;          // 1 周目: ナイトメアに 負けて 病院で 目を覚ます 日 (あと 3 日。本編は 2 週間 眠る)
export const PAIR = ['mio', 'kana'];

// 活性化する日 (最初の 救える夜)。話を 最後の段まで 進めた日か、期限 (ACTIVE_DAY) の 早いほう
export function activeDay(state) {
    return Math.min(state.activeDay ?? ACTIVE_DAY, ACTIVE_DAY);
}

// 最後の 救える夜
export function lastRescueDay(state) {
    return activeDay(state) + RESCUE_NIGHTS - 1;
}

const WEEK = ['月', '火', '水', '木', '金', '土', '日'];

export function weekday(day) {
    return WEEK[(day - 1) % 7];
}

// 2 月 1 日を 月曜として、土日は 学校が ない
export function isWeekend(day) {
    return ['土', '日'].includes(weekday(day));
}

export function dateLabel(day) {
    return `2月${day}日（${weekday(day)}）`;
}
