// 属性の並びは 企画書の「ユメクイ一覧」。バクは 楽
export const BAK = {
    id: 'bak', name: 'バク', attr: '楽', sprite: 'bak',
    hp: 60, maxHp: 60, atk: 14, def: 8, spd: 10,
    moves: { attack: 'ひっかく', heal: '悪夢を食べる' }
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
