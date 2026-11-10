// 育成の 数値 (「ユメクイ 技一覧」「仕様書 レベルとユメポイント」の 最初の案)

// バクの ステータス強化 (1 段 ＋5%、10 段まで、n 段目は n YP)
export const YP_STATS = [
    { id: 'hp', label: '体力' },
    { id: 'atk', label: '攻撃' },
    { id: 'def', label: '防御' },
    { id: 'kokoro', label: 'ココロ' }
];

// バクが ユメポイントで 覚える 技。saved / eaten は「救った夢・喰らった夢の数」の 条件
export const BAK_YP_MOVES = [
    { id: 'drowsy', label: 'ねぼけまなこ', cost: 3, info: '相手の攻撃を 3ターン 20%下げる', target: true },
    { id: 'pillow', label: 'まくら投げ', cost: 3, info: '威力60を 2回', target: true },
    { id: 'lullaby', label: '子守唄', cost: 6, info: '相手を眠らせる（ボスには 50%）', target: true },
    { id: 'dreameye', label: '夢見の目', cost: 6, info: '相手の弱点と 次の行動が分かる。ココロ攻撃が 必ず当たる', target: true },
    { id: 'crush', label: 'ゆめくずし', cost: 10, info: '威力160。使う前に 1ターン ためる', target: true },
    { id: 'dispel', label: '悪夢ばらい', cost: 10, info: '味方全員を 最大体力の 30%回復' },
    { id: 'sunblanket', label: 'ひだまり毛布', cost: 10, saved: 3, info: '3ターン、味方全員が 毎ターン 10%回復' },
    { id: 'nestle', label: 'よりそう', cost: 15, saved: 5, info: 'そのバトル中、本音を外しても 相手が強くならない' },
    { id: 'gulp', label: 'まるのみ', cost: 10, eaten: 3, info: '体力が 3割以下の雑魚を 一口で喰らう。経験値 2倍', target: true },
    { id: 'gluttony', label: '悪食', cost: 15, eaten: 5, info: '威力250。そのバトル中、自分の最大体力が 20%減る', target: true }
];

// 個人ユメクイが レベルで 覚える 技 (レベル 1 の 技は units.js の moves.skill)
export const LEVEL_MOVES = {
    gakufume: [
        { lv: 1, label: 'ほそいソロ', info: '相手を眠らせる' },
        { lv: 8, id: 'tearnote', label: 'なみだ音符', info: '威力110、当たると 相手の攻撃−10%', target: true },
        { lv: 16, id: 'ensemble', label: 'アンサンブル', info: '次のターン、味方全員の攻撃＋20%' },
        { lv: 25, id: 'endless', label: '止まらないソロ', info: '威力180、ため1ターン', target: true }
    ],
    togemetoro: [
        { lv: 1, label: 'せかすリズム', info: '次の攻撃が 2回' },
        { lv: 8, id: 'togebeat', label: 'トゲの拍子', info: '威力90、20%で 相手が 1回休み', target: true },
        { lv: 16, id: 'tempoup', label: 'テンポアップ', info: '3ターン 自分の攻撃＋25%' },
        { lv: 25, id: 'fortissimo', label: 'フォルテッシモ', info: '威力200、自分の防御−20%', target: true }
    ]
};

// ねらいを 選ぶ 技の id
export const TARGETED_GROWTH = [
    ...BAK_YP_MOVES.filter((m) => m.target).map((m) => m.id),
    ...Object.values(LEVEL_MOVES).flat().filter((m) => m.target && m.id).map((m) => m.id)
];
