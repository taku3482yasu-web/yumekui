// 会話の 立ち絵 (仕様書「会話画面」11/11 決定): 一度に 2 人まで。
//   左 = 主人公の側 (ハル、または バクや 救った仲間)、右 = 話している 相手 (左右反転して 左向き)。
//   絵の ファイル名は 素材制作仕様書「置き場所とファイル名」: 人は img/chara/<名前>_<表情>.png、
//   ユメクイは img/yumekui/<id>.png、夢の住人は img/enemy/<id>.png。絵の 無い人は 出さない
export const EXPRESSIONS = ['neutral', 'smile', 'troubled', 'angry', 'cry', 'surprised', 'sad', 'frustrated', 'cloudy', 'silent', 'eroded', 'guide', 'resolve', 'profile', 'profile_kizuna'];

// セリフの 話し手の 名前 → 絵の 名前
export const CHARA_FILES = {
    'ハル': 'haru',
    'リク': 'riku',
    'ミオ': 'mio',
    'カナ': 'kana',
    '父': 'haru_father',
    'リクの父': 'riku_father',
    'トメ': 'tome',
    'ケン': 'ken',
    'アキ先生': 'aki',
    'リクの母': 'rikumother',
    'ミチル': 'michiru',
    'ヒカリ': 'hikari'
};

// 描いてある 表情 (11/12 の 立ち絵)。ここに 無い 表情は neutral で 出す。
//   ハルの 泣き顔 (cry) は ゲームに 入れない (11/12 ユーザー指定)
export const FACES = {
    haru: ['neutral', 'smile', 'troubled', 'angry', 'surprised', 'profile', 'profile_kizuna'],
    riku: ['neutral', 'smile', 'troubled', 'angry', 'cry', 'surprised', 'profile', 'profile_kizuna'],
    mio: ['neutral', 'smile', 'troubled', 'angry', 'surprised', 'profile', 'profile_kizuna'],
    kana: ['neutral', 'smile', 'angry', 'surprised', 'frustrated', 'profile', 'profile_kizuna'],
    aki: ['neutral', 'smile', 'angry', 'surprised', 'cloudy'],
    haru_father: ['neutral', 'smile', 'silent'],
    riku_father: ['neutral', 'smile', 'sad'],
    hikari: ['neutral', 'smile', 'angry', 'surprised', 'sad'],
    michiru: ['neutral', 'smile', 'surprised', 'sad', 'eroded', 'guide', 'resolve']
};

export const YUMEKUI_FILES = {
    'バク': 'bak',
    'ガクフメ': 'gakufume'
};
// 夢の 住人 (階層で 話しかける ゆがんだ 夢主)
export const RESIDENT_FILES = {
    '独奏の女王ミオ': 'queen_mio',
    '審査員カナ': 'judge_kana',
    'ハルの人形': 'haru_doll'
};
const ALLY_IDS = { 'ガクフメ': 'gakufume', 'トゲメトロ': 'togemetoro', 'ヒマワリオン': 'himawarion' };

// 主人公の 側か (ハル・バク・仲間に なった ユメクイ)
export function isHeroSide(name, allies = []) {
    if (name === 'ハル' || name === 'バク') return true;
    return Boolean(ALLY_IDS[name]) && allies.includes(ALLY_IDS[name]);
}

// 絵の 場所 (無い 名前は null)
export function portraitPath(name, expression = 'neutral') {
    const file = CHARA_FILES[name];
    if (file) {
        const faces = FACES[file];
        if (!faces) return null;
        return `img/chara/${file}_${faces.includes(expression) ? expression : 'neutral'}.png`;
    }
    if (YUMEKUI_FILES[name]) return `img/yumekui/${YUMEKUI_FILES[name]}.png`;
    if (RESIDENT_FILES[name]) return `img/enemy/${RESIDENT_FILES[name]}.png`;
    return null;
}

// 絵の 種類 (表示の 大きさを 変える): 人 / ユメクイ / 夢の住人
export function portraitKind(path) {
    if (!path) return null;
    if (path.startsWith('img/yumekui/')) return 'yumekui';
    if (path.startsWith('img/enemy/')) return 'resident';
    return 'chara';
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
