// 属性の並びは 企画書の「ユメクイ一覧」。バクは 楽
export const BAK = {
    id: 'bak', name: 'バク', attr: '楽', sprite: 'bak',
    hp: 60, maxHp: 60, atk: 14, def: 8, spd: 10,
    moves: { attack: 'ひっかく', heal: '悪夢を食べる' }
};

export const ALLIES = {
    bak: BAK,
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
    hp: 26, maxHp: 26, atk: 10, def: 4, spd: 6
});

export const FOES = {
    nanashi: { id: 'nanashi', name: 'ナナシ', attr: '喜', sprite: 'nanashi', hp: 20, maxHp: 20, atk: 8, def: 4, spd: 6 },
    'omote-喜': mask('喜', '笑い顔'),
    'omote-怒': mask('怒', '怒り顔'),
    'omote-哀': mask('哀', '泣き顔'),
    'omote-楽': mask('楽', 'ゆるみ顔'),
    onpu: { id: 'onpu', name: 'ナナシ・オンプ', attr: '哀', sprite: 'onpu', hp: 24, maxHp: 24, atk: 9, def: 4, spd: 7 },
    hari: { id: 'hari', name: 'ナナシ・ハリ', attr: '怒', sprite: 'hari', hp: 24, maxHp: 24, atk: 10, def: 4, spd: 7 },
    gakufume: {
        id: 'gakufume', name: 'ガクフメ', attr: '哀', sprite: 'gakufume', dream: 'mio', ally: 'gakufume',
        hp: 110, maxHp: 110, atk: 11, def: 6, spd: 9,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'],
        chargeText: 'ガクフメが 高い音を ためている……！', bigMove: '止まらないソロ',
        truth: {
            words: ['一緒に', '吹きたかった'],
            answer: '一緒に吹きたかった',
            wrong: ['ソロなんて、やりたくなかった', '勝ちたかっただけ', 'カナなんて、もういらない', '一人のほうが、うまく吹ける']
        }
    },
    togemetoro: {
        id: 'togemetoro', name: 'トゲメトロ', attr: '怒', sprite: 'togemetoro', dream: 'kana', ally: 'togemetoro',
        hp: 110, maxHp: 110, atk: 13, def: 6, spd: 10,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'],
        chargeText: 'トゲメトロの テンポが 速くなっていく……！', bigMove: 'せかすリズム',
        truth: {
            words: ['相談して', 'ほしかった'],
            answer: '相談してほしかった',
            wrong: ['ミオがソロなんて、ずるい', '本当は、吹奏楽が嫌いだった', '負けたのが、くやしかっただけ', 'もう、どうでもいい']
        }
    },
    suima: { id: 'suima', name: 'スイマ', attr: '哀', sprite: 'suima', hp: 18, maxHp: 18, atk: 9, def: 3, spd: 8, drop: 1 },
    muresuima: {
        id: 'muresuima', name: 'ムレスイマ', attr: '怒', sprite: 'muresuima',
        hp: 120, maxHp: 120, atk: 13, def: 6, spd: 8,
        pattern: ['tackle', 'tackle', 'charge', 'swirl'],
        truth: {
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
