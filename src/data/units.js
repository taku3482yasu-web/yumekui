// 属性の並びは 企画書の「ユメクイ一覧」。バクは 楽
export const BAK = {
    id: 'bak', name: 'バク', attr: '楽', sprite: 'bak',
    hp: 60, maxHp: 60, atk: 14, def: 8, spd: 10,
    moves: { attack: 'ひっかく', heal: '悪夢を食べる' }
};

export const ALLIES = {
    bak: BAK,
    himawarion: {
        id: 'himawarion', name: 'ヒマワリオン', attr: '喜', sprite: 'himawarion',
        hp: 58, maxHp: 58, atk: 15, def: 7, spd: 11,
        moves: { attack: 'たてがみアタック', skill: { id: 'bravado', label: 'から元気' } }
    },
    gakufume: {
        id: 'gakufume', name: 'ガクフメ', attr: '哀', sprite: 'gakufume',
        hp: 52, maxHp: 52, atk: 15, def: 6, spd: 11,
        moves: { attack: 'つつく', skill: { id: 'sleep', label: 'ほそいソロ' } }
    },
    togemetoro: {
        id: 'togemetoro', name: 'トゲメトロ', attr: '怒', sprite: 'togemetoro',
        hp: 56, maxHp: 56, atk: 16, def: 7, spd: 12,
        moves: { attack: 'トゲ突き', skill: { id: 'rush', label: 'せかすリズム' } }
    }
};

const mask = (attr, label) => ({
    id: `omote-${attr}`, name: `ナナシ・オモテ（${label}）`, attr, sprite: `omote-${attr}`,
    hp: 26, maxHp: 26, atk: 10, def: 4, spd: 6, exp: 9
});

// 夢主の 本音 (単独の夢の ボスと、二重奏ホールの デュエットで 同じ)
const TRUTH = {
    mio: {
        owner: 'mio',
        words: ['一緒に', '吹きたかった'],
        answer: '一緒に吹きたかった',
        wrong: ['ソロなんて、やりたくなかった', '勝ちたかっただけ', 'カナなんて、もういらない', '一人のほうが、うまく吹ける']
    },
    riku: {
        owner: 'riku',
        words: ['引っ越し', '言えなかった'],
        answer: '引っ越しが決まってた。……ハルに、言えなかった',
        wrong: ['ハルなんて、どうでもよかった', 'ずっと、ひとりのほうが楽だった', '引っ越しなんて、平気だった', 'もう、話すことなんてない']
    },
    kana: {
        owner: 'kana',
        words: ['相談して', 'ほしかった'],
        answer: '相談してほしかった',
        wrong: ['ミオがソロなんて、ずるい', '本当は、吹奏楽が嫌いだった', '負けたのが、くやしかっただけ', 'もう、どうでもいい']
    }
};

// exp: 倒したときの 経験値 (仕様書「経験値とレベル」。合体ボス デュエットは 2 羽で 250)
export const FOES = {
    nanashi: { id: 'nanashi', name: 'ナナシ', attr: '喜', sprite: 'nanashi', hp: 20, maxHp: 20, atk: 8, def: 4, spd: 6, exp: 6 },
    'omote-喜': mask('喜', '笑い顔'),
    'omote-怒': mask('怒', '怒り顔'),
    'omote-哀': mask('哀', '泣き顔'),
    'omote-楽': mask('楽', 'ゆるみ顔'),
    onpu: { id: 'onpu', name: 'ナナシ・オンプ', attr: '哀', sprite: 'onpu', hp: 24, maxHp: 24, atk: 9, def: 4, spd: 7, exp: 9 },
    hari: { id: 'hari', name: 'ナナシ・ハリ', attr: '怒', sprite: 'hari', hp: 24, maxHp: 24, atk: 10, def: 4, spd: 7, exp: 9 },
    gakufume: {
        id: 'gakufume', name: 'ガクフメ', attr: '哀', sprite: 'gakufume', dream: 'mio', ally: 'gakufume',
        hp: 110, maxHp: 110, atk: 11, def: 6, spd: 9, exp: 120,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'],
        chargeText: 'ガクフメが 高い音を ためている……！', bigMove: '止まらないソロ',
        roarText: 'ガクフメが 破れた 楽譜の 翼を 広げ、高く 鳴いた！',
        truth: TRUTH.mio
    },
    togemetoro: {
        id: 'togemetoro', name: 'トゲメトロ', attr: '怒', sprite: 'togemetoro', dream: 'kana', ally: 'togemetoro',
        hp: 110, maxHp: 110, atk: 13, def: 6, spd: 10, exp: 120,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'],
        chargeText: 'トゲメトロの テンポが 速くなっていく……！', bigMove: 'せかすリズム',
        roarText: 'カチッ、カチッ、カチッ……！ トゲメトロの 針が 一斉に 逆立った！',
        truth: TRUTH.kana
    },
    // 二重奏ホール (ミオ×カナの 夢合体)。中ボスの ムレスイマは 行動のたびに 哀 ↔ 怒
    duetSuima: {
        id: 'duetSuima', name: 'ムレスイマ', attr: '哀', sprite: 'muresuima', attrCycle: ['哀', '怒'],
        hp: 90, maxHp: 90, atk: 12, def: 5, spd: 8, drop: 1, exp: 80,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'], chargeText: 'ムレスイマが、ふたつの音で うずを巻きはじめた……！'
    },
    // 合体ボス「デュエット」: 戦う前に 2 羽の 鳥が 溶け合って 1 体に なる (合体ユメクイは 2 体の 特徴を 持つ 新しい 1 体。
    //   胸の 二重奏の 楽譜が 2 人に 共通する 夢)。本音は カナ → ミオの 順に 言い当てる。
    //   カナの 本音が 届くと、怒の 姿から 哀の 姿に 変わって 立ち上がる (phases)。救うと ガクフメと トゲメトロが 仲間になる
    duet: {
        id: 'duet', name: 'デュエット', attr: '怒', sprite: 'duet-boss', solvedAs: 'togemetoro', pairAttrs: ['怒', '哀'],
        truthHead: 'カナの本音は？', roarText: 'デュエットが ふたつの声で 叫んだ！',
        hp: 150, maxHp: 150, atk: 13, def: 6, spd: 10, exp: 250,
        pattern: ['tackle', 'charge', 'swirl', 'tackle'], chargeText: 'デュエットの テンポが 速くなっていく……！', bigMove: 'せかすリズム',
        truth: { ...TRUTH.kana },
        phases: [{
            attr: '哀', solvedAs: 'gakufume', truthHead: 'ミオの本音は？', hpRate: 0.6,
            text: 'トゲが 寝ていく。……けれど 楽譜の 片側が、まだ 泣いている。デュエットが 哀しみの 音で 立ち上がった！',
            pattern: ['tackle', 'tackle', 'charge', 'swirl'], chargeText: 'デュエットが 高い音を ためている……！', bigMove: '止まらないソロ',
            truth: { ...TRUTH.mio }
        }]
    },
    // リクの夢の ボス (台本 4-3)。完全な 空元気で、体力が 減るほど 強くなる (desperate)
    himawarion: {
        id: 'himawarion', name: 'ヒマワリオン', attr: '喜', sprite: 'himawarion', dream: 'riku', ally: 'himawarion', desperate: true, truthHead: 'リクの本音は？',
        hp: 120, maxHp: 120, atk: 12, def: 6, spd: 10, exp: 120,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'],
        chargeText: 'ヒマワリオンが「だいじょうぶ！」と 叫びながら 力を ためている……！', bigMove: 'から元気',
        roarText: 'ヒマワリオンが 胸を張って 吠えた！「だいじょうぶ！ だいじょうぶ！」',
        truth: TRUTH.riku
    },
    // ナイトメア (台本 2-5)。1 周目だけ。こちらの 攻撃は「1」しか 入らず (防御が とても 高い)、本音の 選択肢も 出ない。数ターンで 必ず 負ける
    nightmare: {
        id: 'nightmare', name: 'ナイトメア', attr: '哀', sprite: 'nightmare',
        hp: 9999, maxHp: 9999, atk: 70, def: 99999, spd: 20, exp: 0,
        pattern: ['tackle', 'charge', 'swirl'], chargeText: 'ナイトメアが 大鎌を ふりかぶった……！', bigMove: '大鎌',
        runText: '足が 動かない……！'
    },
    // ---- 小規模版の 終幕 (2026-11-11 ユーザー指定) ----
    // ノーマル: ナイトメア戦 (キズナ攻撃は 使えず、倒すしかない)。倒すと 救えなかった人の ユメクイを 吸って 第 2 形態に なる
    nightmareFinal: {
        id: 'nightmareFinal', name: 'ナイトメア', attr: '哀', sprite: 'nightmare',
        hp: 200, maxHp: 200, atk: 13, def: 8, spd: 14, exp: 0,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'], chargeText: 'ナイトメアが 大鎌を ふりかぶった……！', bigMove: '大鎌',
        runText: '足が 動かない……！'
    },
    nightmare2: {
        id: 'nightmare2', name: 'ナイトメア（第2形態）', attr: '哀', sprite: 'nightmare',
        hp: 240, maxHp: 240, atk: 14, def: 8, spd: 14, exp: 0,
        pattern: ['tackle', 'charge', 'swirl', 'tackle'], chargeText: '無数の 顔が、いっせいに 口を開けた……！', bigMove: '顔たちの 叫び',
        runText: '足が 動かない……！'
    },
    // ユメクイ: ナイトメアの 代わりに リク・ナイトメア
    rikuNightmare: {
        id: 'rikuNightmare', name: 'リク・ナイトメア', attr: '喜', sprite: 'nightmare',
        hp: 220, maxHp: 220, atk: 14, def: 8, spd: 13, exp: 0,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'], chargeText: 'しおれた ひまわりの 大鎌が、ゆっくりと 上がる……！', bigMove: 'だいじょうぶの 刃',
        runText: '足が 動かない……！'
    },
    // ラスボス ネムリボシ (繰り返したい 姉)。ふつうの 攻撃は ほとんど 効かず、キズナ攻撃で 挑む (グッド)。ユメクイでは 夢喰いで 喰らう
    nemuriboshi: {
        id: 'nemuriboshi', name: 'ネムリボシ', attr: '楽', sprite: 'nemuriboshi', lastBoss: true,
        hp: 400, maxHp: 400, atk: 15, def: 60, spd: 12, exp: 0,
        pattern: ['tackle', 'charge', 'swirl', 'tackle'], chargeText: '望遠鏡の 目が、1 か月ぶんの 夜を 集めている……！', bigMove: 'まきもどし',
        runText: '足が 動かない……！'
    },
    suima: { id: 'suima', name: 'スイマ', attr: '哀', sprite: 'suima', hp: 18, maxHp: 18, atk: 9, def: 3, spd: 8, drop: 1, exp: 5 },
    muresuima: {
        id: 'muresuima', name: 'ムレスイマ', attr: '怒', sprite: 'muresuima',
        hp: 120, maxHp: 120, atk: 13, def: 6, spd: 8, exp: 80,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'],
        truth: {
            owner: 'hal',
            words: ['ほんとは', '自分で', '決めたかった'],
            answer: 'ほんとは、自分で決めたかった',
            wrong: [
                'みんなが笑っているなら、それでいい',
                'べつに、どれでもよかった',
                '言わなくても、きっと分かってもらえる',
                '決めてもらえるほうが、楽だった'
            ]
        }
    }
};
