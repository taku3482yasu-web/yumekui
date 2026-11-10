// 小規模版の 2 週間の日程 (企画書「小規模版の2週間の日程」)。calendar.js と town.js が使う
export const OPEN_DAY = 2;
export const RIKU_DOWN_DAY = 3;
export const ACTIVE_DAY = 7;
export const LAST_RESCUE_DAY = 9;
export const LAST_DAY = 14;
export const PAIR = ['mio', 'kana'];

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
