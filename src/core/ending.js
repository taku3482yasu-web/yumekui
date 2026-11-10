// 小規模版の 終幕 (台本「終幕」・2026-11-11 ユーザー指定)。3 周目の 14 日の夜で 終わり、ミオ・カナ・リクを どうしたかで 分かれる
//   グッド: 喰らわずに、ミオ・カナ (合体) と リクを 全員 救う → キズナ攻撃で ラスボス (ネムリボシ) に 挑む
//   ユメクイ: ミオ・カナ・リクの ユメクイを 全部 喰らう → リク・ナイトメア、そのあと ラスボスを 夢喰いで 喰らう
//   ノーマル: それ以外 → ナイトメア戦 (キズナ攻撃は 使えず 倒すしかない) → 第 2 形態
export const ENDING_LOOP = 3;
export const DREAMERS = ['mio', 'kana', 'riku'];
export const DREAMER_NAMES = { mio: 'ミオ', kana: 'カナ', riku: 'リク' };
export const DREAMER_YUMEKUI = { mio: 'ガクフメ', kana: 'トゲメトロ', riku: 'ヒマワリオン' };
export const ABSORB_RATE = 0.15;   // 第 2 形態: 救えなかった 人の ユメクイ 1 体ごとに 強くなる

export function isFinalLoop(keep) {
    return keep.loop >= ENDING_LOOP;
}

export function routeOf(state, keep) {
    const eaten = keep.eaten ?? [];
    if (DREAMERS.every((id) => eaten.includes(id))) return 'yumekui';
    if (!eaten.length && DREAMERS.every((id) => state.status[id] === 'saved') && state.flags.duetSaved) return 'good';
    return 'normal';
}

// キズナ攻撃で 呼べる 仲間 (この周に 救った 夢主)
export function kizunaFriends(state) {
    return DREAMERS.filter((id) => state.status[id] === 'saved').map((id) => DREAMER_NAMES[id]);
}

// ノーマルの 第 2 形態が 吸いこむ ユメクイ (救えなかった 人の ぶんだけ)
export function absorbed(state) {
    return DREAMERS.filter((id) => state.status[id] !== 'saved').map((id) => DREAMER_YUMEKUI[id]);
}
