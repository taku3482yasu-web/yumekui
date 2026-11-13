// 会話の 立ち絵 (引き継ぎ書 HANDOFF.md 5-1): 一度に 2 人まで。
//   だれを 左右に 置くかは 場面の 最初に 決めて、場面が 終わるまで 動かさない。ハルは 左。
//   場面で 話す人が 1 人だけなら まん中。話している人は 明るく、聞いている人は 暗く する。
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

// 表情の 変わらない 1 枚絵の 人 (台本 4-1: 星の案内人は ミチルの 全身 michiru_guide)
export const FIXED_PORTRAITS = {
    '星の案内人': 'img/chara/michiru_guide.png'
};

// 絵の 場所 (無い 名前は null)
export function portraitPath(name, expression = 'neutral') {
    if (FIXED_PORTRAITS[name]) return FIXED_PORTRAITS[name];
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

// 絵の 向き: 'right' (右を 向いている)・'left'・'front'。左に 立つ人は 右を、右に 立つ人は 左を 向くように 反転する
//   ふつうの 立ち絵は 右向き、横顔は 左向き (カナの 横顔だけ 右向き)、バクは 左向き
export function facingOf(path) {
    if (!path) return 'front';
    if (path.includes('_profile')) return path.includes('/kana_') ? 'right' : 'left';
    if (path.startsWith('img/chara/')) return 'right';
    if (path === 'img/yumekui/bak.png') return 'left';
    return 'front';
}

// その 側に 立つとき 左右反転するか
export function flipFor(side, path) {
    const facing = facingOf(path);
    return (side === 'left' && facing === 'left') || (side === 'right' && facing === 'right');
}

// 場面の 立ち位置を 決める。lines = [[名前, セリフ, 表情], ...]。絵の ある 話し手だけを 数える
//   1 人だけ → まん中。2 人以上 → ハルが いれば 左、いなければ 最初の人が 左。右は 次の人 (3 人目からは 右を 入れかえる)
export function scenePlan(lines) {
    const names = [];
    for (const [name] of lines) if (name && portraitPath(name) && !names.includes(name)) names.push(name);
    if (names.length === 1) return { center: names[0], left: null };
    const left = names.includes('ハル') ? 'ハル' : names[0] ?? null;
    return { center: null, left };
}

// 会話の 始めは だれも いない (話した人から 出てくる。地の文だけの 場面では 出さない)
export function startStage() {
    return { left: null, right: null, center: null, speaking: null };
}

// 次の セリフで 立ち絵を どうするか。speaking = 明るく する 側 (null なら みんな 明るい)
//   地の文 (名前なし) は みんな 明るく、絵の 無い 人 (生徒 など) が 話すと みんな 暗く する
export function nextStage(stage, name, expression = 'neutral', plan = { center: null, left: 'ハル' }) {
    if (!name) return { ...stage, speaking: null };
    if (!portraitPath(name)) return { ...stage, speaking: 'none' };
    const who = { name, expression: expression ?? 'neutral' };
    if (plan.center === name) return { ...stage, center: who, speaking: 'center' };
    if (plan.left === name) return { ...stage, left: who, speaking: 'left' };
    return { ...stage, right: who, speaking: 'right' };
}
