// 会話の 立ち絵 (仕様書「会話画面」11/11 決定): 一度に 2 人まで。
//   左 = 主人公の側 (ハル、または バクや 救った仲間)、右 = 話している 相手 (左右反転して 左向き)。
//   絵の ファイル名は 素材制作仕様書「置き場所とファイル名」: 人は img/chara/<名前>_<表情>.png、
//   ユメクイは img/yumekui/<id>_normal.png。ファイルが 無い人は 出さない
export const EXPRESSIONS = ['neutral', 'smile', 'troubled', 'angry', 'cry', 'surprised'];

// セリフの 話し手の 名前 → 絵の 名前
export const CHARA_FILES = {
    'ハル': 'haru',
    'リク': 'riku',
    'ミオ': 'mio',
    'カナ': 'kana',
    '父': 'father',
    'トメ': 'tome',
    'ケン': 'ken',
    'アキ先生': 'aki',
    'リクの母': 'rikumother',
    'ミチル': 'michiru',
    'ヒカリ': 'hikari'
};
export const YUMEKUI_FILES = {
    'バク': 'bak',
    'ガクフメ': 'gakufume',
    'トゲメトロ': 'togemetoro',
    'ヒマワリオン': 'himawarion'
};
const ALLY_IDS = { 'ガクフメ': 'gakufume', 'トゲメトロ': 'togemetoro', 'ヒマワリオン': 'himawarion' };

// 主人公の 側か (ハル・バク・仲間に なった ユメクイ)
export function isHeroSide(name, allies = []) {
    if (name === 'ハル' || name === 'バク') return true;
    return Boolean(ALLY_IDS[name]) && allies.includes(ALLY_IDS[name]);
}

// 絵の 場所 (無い 名前は null)
export function portraitPath(name, expression = 'neutral') {
    const face = EXPRESSIONS.includes(expression) ? expression : 'neutral';
    if (CHARA_FILES[name]) return `img/chara/${CHARA_FILES[name]}_${face}.png`;
    if (YUMEKUI_FILES[name]) return `img/yumekui/${YUMEKUI_FILES[name]}_normal.png`;
    return null;
}

// 会話の 始めは だれも いない (地の文だけの 場面では 立ち絵を 出さない)
export function startStage() {
    return { left: null, right: null };
}

// 次の セリフで 左右を どうするか。地の文 (名前なし) は そのまま。
//   主人公の 側が 話すと 左が その人に、ほかの人が 話すと 右が その人に なる (左が 空なら ハルが 立つ)。
//   絵の 無い 人 (？？？ など) が 話すと 右は 空ける
export function nextStage(stage, name, expression = 'neutral', allies = []) {
    if (!name) return stage;
    const who = { name, expression: expression ?? 'neutral' };
    if (isHeroSide(name, allies)) return { ...stage, left: who };
    return { left: stage.left ?? { name: 'ハル', expression: 'neutral' }, right: portraitPath(name) ? who : null };
}
