// 夢の 階層 (仕様書「夢の階層と言葉」): 夢 → 階層 → 部屋。
//   単独の夢は 3 階層＋最深部、合体の夢は 4 階層＋最深部。1 階層に 部屋 3〜5 つ。
//   どの階層も 入口に 毛布 (rest) と 光る扉 (wake)。奥の 階段 (exit) で 次の階層へ。ボスは 最深部
//   第 1 層は maps.js の 今までの 地図 (水底の音楽室・止まらない練習室・二重奏ホール)
const W20 = 'w'.repeat(20);
const W26 = 'w'.repeat(26);

const entrance = (prefix, wake, rest) => [
    { id: `${prefix}Wake`, kind: 'wake', x: wake[0], y: wake[1], sprite: 'wakeDoor' },
    { id: `${prefix}Rest`, kind: 'talk', x: rest[0], y: rest[1], sprite: 'blanket', script: 'rest' }
];
const stairs = (prefix, x, y, to, at) => ({ id: `${prefix}Down`, kind: 'exit', x, y, to, at });
const foe = (id, x, y, kind) => ({ id, kind: 'foe', x, y, foe: kind });
// 夢の住人 (認知で 歪んだ 現実の人)。下の 階層ほど ゆがみが 大きい。gives: 話すと 落とす まちがいの 言葉
const resident = (id, x, y, sprite, line, gives = null) => ({ id, kind: 'talk', x, y, sprite, script: 'resident', line, gives });
// 心のかけら (data/hearts.js。id が そのまま かけらの id)
const heart = (id, x, y) => ({ id, kind: 'heart', x, y, sprite: 'heart' });

// ---- ミオの夢『水底の音楽室』 ---------------------------------------------

const mizuzoko2 = [
    W20,
    'w......wwwwww.....sw',
    'w......wwwwww......w',
    'w..................w',
    'w......wwwwww......w',
    'www.wwwwwwwwwwww.www',
    'www.wwwwwwwwwwww.www',
    'w......wwwwww......w',
    'w..................w',
    'w......wwwwww......w',
    W20
];

const mizuzoko3 = [
    W20,
    'w....w....w....wwwww',
    'w....w....w....wwwww',
    'ww.wwww.wwww.wwwwwww',
    'w..................w',
    'w..................w',
    'wwwwwwwwwwwwwwww.www',
    'wwwwwwwwwwwww......w',
    'wwwwwwwwwwwww.....sw',
    W20
];

const stage20 = [
    W20,
    'wwwww..........wwwww',
    'wwww............wwww',
    'wwww............wwww',
    'wwww............wwww',
    'wwwww..........wwwww',
    'wwwwwwww....wwwwwwww',
    'wwwwwwww....wwwwwwww',
    W20
];

// ---- カナの夢『止まらない練習室』 ------------------------------------------

const renshu2 = [
    W20,
    'w..wwwwwwwwwwwwwwwww',
    'w..wwwwwwwwwwwwwwwww',
    'w..........wwwwwwwww',
    'w..........wwwwwwwww',
    'wwwwwwwww..wwwwwwwww',
    'wwwwwwwww..........w',
    'wwwwwwwww..........w',
    'wwwwwwwwwwwwwwww...w',
    'wwwwwwwwwwwwwwww..sw',
    W20
];

const renshu3 = [
    W20,
    'wwwwwww..s...wwwwwww',
    'wwwwwww......wwwwwww',
    'wwwwwwwww..wwwwwwwww',
    'w....wwww..wwww....w',
    'w..................w',
    'w....wwww..wwww....w',
    'wwwwwwwww..wwwwwwwww',
    'wwwwwww......wwwwwww',
    'wwwwwww......wwwwwww',
    W20
];

// ---- ミオ×カナの夢『二重奏ホール』 (左は 水、右は トゲ) --------------------

const duet2 = [
    W26,
    'w.....wwwwwwwwwwwwww....sw',
    'w.....wwwwwwwwwwwwww.....w',
    'w........................w',
    'w........................w',
    'w.....wwwwww..wwwwww.....w',
    'wwwwwwwwwwww..wwwwwwwwwwww',
    'wwwwwwwwwwww..wwwwwwwwwwww',
    W26
];

const duet3 = [
    W26,
    'w.s..wwwwwwwwwwwwwwww....w',
    'w....wwwwwwwwwwwwwwww....w',
    'ww..wwwwwwwwwwwwwwwwww..ww',
    'ww..wwwwwwwwwwwwwwwwww..ww',
    'ww......................ww',
    'ww......................ww',
    'wwwwwwwwwww....wwwwwwwwwww',
    'wwwwwwwwwww....wwwwwwwwwww',
    W26
];

const duet4 = [
    W26,
    'wwwwwwwwwww.s..wwwwwwwwwww',
    'wwwwwwwwwww....wwwwwwwwwww',
    'w.......www....www.......w',
    'w........................w',
    'w........................w',
    'w.......wwwwwwwwww.......w',
    W26
];

const stage26 = [
    W26,
    'wwwwwwww..........wwwwwwww',
    'wwwwwww............wwwwwww',
    'wwwwwww............wwwwwww',
    'wwwwwww............wwwwwww',
    'wwwwwwww..........wwwwwwww',
    'wwwwwwwwwww....wwwwwwwwwww',
    'wwwwwwwwwww....wwwwwwwwwww',
    W26
];

// ---- リクの夢『ひまわり畑』 (台本 4-1・4-3)。Y = しおれた ひまわりの 壁 (3 周目に 開く) -------------

const rikuField = [
    W20,
    'wwwwwwww..s.wwwwwwww',
    'wwwwwwwYYYYYYwwwwwww',
    'wwww............wwww',
    'www..............www',
    'ww................ww',
    'ww................ww',
    'www..............www',
    'wwww............wwww',
    'wwwwwwww....wwwwwwww',
    W20
];

const riku2 = [
    W20,
    'w.......wwwwwwwwwwww',
    'w.......wwwwwwwwwwww',
    'w..................w',
    'w..................w',
    'wwwwwwwwwwww.......w',
    'wwwwwwwwwwww......sw',
    W20
];

const riku3 = [
    W20,
    'wwwwwwww..s.wwwwwwww',
    'wwwwwwww....wwwwwwww',
    'w.....ww....ww.....w',
    'w..................w',
    'w.....ww....ww.....w',
    'wwwwwwww....wwwwwwww',
    'wwwwwwww....wwwwwwww',
    W20
];

export const LAYER_MAPS = {
    rikuField: {
        id: 'rikuField', name: 'ひまわり畑', dream: 'ひまわり畑', tiles: rikuField, start: { x: 9, y: 9 }, theme: 'sun', layer: 1,
        rooms: [
            { name: 'しおれた壁', x: [0, 19], y: [0, 2] },
            { name: 'まぶしい畑', x: [0, 19], y: [3, 8] },
            { name: '畑の入口', x: [0, 19], y: [9, 10] }
        ],
        objects: [
            ...entrance('rk1', [10, 9], [8, 9]),
            resident('rk1Doll', 5, 5, 'hal-down', 'doll'),
            foe('rk1Nanashi', 14, 6, 'nanashi'),
            foe('rk1Suima', 4, 7, 'suima'),
            // しおれた 壁: 調べると バクが 話す (1 周目の 最初は ナイトメアが 来る)
            { id: 'rikuWall1', kind: 'talk', x: 9, y: 2, script: 'rikuWall', hideIf: 'rikuWall' },
            { id: 'rikuWall2', kind: 'talk', x: 10, y: 2, script: 'rikuWall', hideIf: 'rikuWall' },
            stairs('rk1', 10, 1, 'riku2', { x: 2, y: 2 })
        ]
    },
    riku2: {
        id: 'riku2', name: 'うつむく畑', dream: 'ひまわり畑', tiles: riku2, start: { x: 2, y: 2 }, theme: 'sun', layer: 2,
        rooms: [
            { name: '入口の畑', x: [0, 7], y: [0, 2] },
            { name: '長いあぜ道', x: [0, 19], y: [3, 4] },
            { name: '奥の畑', x: [12, 19], y: [5, 7] }
        ],
        objects: [
            ...entrance('rk2', [1, 1], [2, 1]),
            foe('rk2Nanashi', 5, 3, 'nanashi'),
            foe('rk2Omote', 12, 4, 'omote-喜'),
            foe('rk2Suima', 15, 5, 'suima'),
            stairs('rk2', 18, 6, 'riku3', { x: 9, y: 7 })
        ]
    },
    riku3: {
        id: 'riku3', name: '日に焼けた道', dream: 'ひまわり畑', tiles: riku3, start: { x: 9, y: 7 }, theme: 'sun', layer: 3,
        rooms: [
            { name: '写真の部屋', x: [0, 7], y: [0, 8] },
            { name: '迷いの畑', x: [12, 19], y: [0, 8] },
            { name: '日に焼けた道', x: [8, 11], y: [0, 8] }
        ],
        objects: [
            ...entrance('rk3', [10, 7], [8, 7]),
            // 日に焼けた 写真 (小学生の ハルと リク)。裏に 吹き出し
            { id: 'rikuPhoto', kind: 'word', x: 1, y: 3, word: '言えなかった', sprite: 'word' },
            foe('rk3Omote', 3, 5, 'omote-喜'),
            foe('rk3Nanashi', 17, 3, 'nanashi'),
            foe('rk3Suima', 10, 4, 'suima'),
            stairs('rk3', 10, 1, 'riku4', { x: 9, y: 7 })
        ]
    },
    riku4: {
        id: 'riku4', name: '畑の真ん中', dream: 'ひまわり畑', tiles: stage20, start: { x: 9, y: 7 }, theme: 'sun', layer: 4, deepest: true,
        rooms: [
            { name: '畑の真ん中', x: [0, 19], y: [0, 5] },
            { name: 'ひまわりの道', x: [0, 19], y: [6, 8] }
        ],
        objects: [
            ...entrance('rk4', [10, 7], [8, 7]),
            { id: 'rikuBoss', kind: 'foe', x: 9, y: 2, foe: 'himawarion', script: 'rikuBoss' }
        ]
    },
    mizuzoko2: {
        id: 'mizuzoko2', name: '泡の廊下', dream: '水底の音楽室', tiles: mizuzoko2, start: { x: 2, y: 8 }, theme: 'water', layer: 2,
        rooms: [
            { name: '楽器倉庫', x: [0, 6], y: [0, 10] },
            { name: '泡の廊下', x: [7, 12], y: [0, 10] },
            { name: '譜面の図書室', x: [13, 19], y: [0, 10] }
        ],
        objects: [
            ...entrance('', [1, 9], [3, 9]),
            foe('mz2Onpu1', 4, 2, 'onpu'),
            foe('mz2Suima', 9, 3, 'suima'),
            foe('mz2Onpu2', 15, 2, 'onpu'),
            resident('mz2Queen', 3, 7, 'mio', 'queen1'),
            heart('heartDispel', 17, 9),
            stairs('mz2', 18, 1, 'mizuzoko3', { x: 2, y: 5 })
        ]
    },
    mizuzoko3: {
        id: 'mizuzoko3', name: '涙の練習棟', dream: '水底の音楽室', tiles: mizuzoko3, start: { x: 2, y: 5 }, theme: 'water', layer: 3,
        rooms: [
            { name: '練習室A', x: [1, 4], y: [1, 3] },
            { name: '練習室B', x: [6, 9], y: [1, 3] },
            { name: '練習室C', x: [11, 14], y: [1, 3] },
            { name: '長い廊下', x: [0, 19], y: [4, 6] },
            { name: '楽譜庫の奥', x: [13, 19], y: [7, 9] }
        ],
        objects: [
            ...entrance('', [1, 5], [1, 4]),
            foe('mz3Onpu1', 3, 1, 'onpu'),
            foe('mz3Suima1', 8, 2, 'suima'),
            foe('mz3Onpu2', 13, 1, 'onpu'),
            foe('mz3Suima2', 10, 4, 'suima'),
            resident('mz3Queen', 7, 1, 'mio', 'queen2', '一人で'),
            heart('heartMio', 12, 2),
            stairs('mz3', 18, 8, 'mizuzoko4', { x: 9, y: 7 })
        ]
    },
    mizuzoko4: {
        id: 'mizuzoko4', name: '水底の舞台', dream: '水底の音楽室', tiles: stage20, start: { x: 9, y: 7 }, theme: 'water', layer: 4, deepest: true,
        rooms: [
            { name: '水底の舞台', x: [0, 19], y: [0, 5] },
            { name: '花道', x: [0, 19], y: [6, 8] }
        ],
        objects: [
            ...entrance('', [10, 7], [8, 7]),
            { id: 'mioBoss', kind: 'foe', x: 9, y: 2, foe: 'gakufume', needs: 'active', script: 'pairBoss' }
        ]
    },
    renshu2: {
        id: 'renshu2', name: 'せまる廊下', dream: '止まらない練習室', tiles: renshu2, start: { x: 1, y: 2 }, theme: 'tempo', layer: 2,
        rooms: [
            { name: '譜面台の小部屋', x: [0, 2], y: [0, 2] },
            { name: '狭まる廊下', x: [0, 11], y: [3, 5] },
            { name: '拍子木の廊下', x: [12, 19], y: [6, 7] },
            { name: '出口の小部屋', x: [16, 19], y: [8, 10] }
        ],
        objects: [
            ...entrance('', [1, 1], [2, 1]),
            foe('rs2Hari1', 5, 3, 'hari'),
            foe('rs2Suima', 10, 6, 'suima'),
            foe('rs2Hari2', 14, 7, 'hari'),
            resident('rs2Judge', 3, 4, 'kana', 'judge1'),
            heart('heartDrowsy', 1, 4),
            stairs('rs2', 18, 9, 'renshu3', { x: 9, y: 9 })
        ]
    },
    renshu3: {
        id: 'renshu3', name: 'メトロノームの塔', dream: '止まらない練習室', tiles: renshu3, start: { x: 9, y: 9 }, theme: 'tempo', layer: 3,
        rooms: [
            { name: '文字盤の上', x: [7, 12], y: [1, 2] },
            { name: '塔の芯', x: [9, 10], y: [3, 7] },
            { name: '左の歯車室', x: [0, 8], y: [4, 6] },
            { name: '右の歯車室', x: [11, 19], y: [4, 6] },
            { name: '振り子の間', x: [7, 12], y: [8, 9] }
        ],
        objects: [
            ...entrance('', [10, 9], [8, 9]),
            foe('rs3Hari1', 1, 4, 'hari'),
            foe('rs3Hari2', 18, 6, 'hari'),
            foe('rs3Suima1', 10, 5, 'suima'),
            foe('rs3Suima2', 12, 1, 'suima'),
            resident('rs3Judge', 17, 4, 'kana', 'judge2', '勝ちたかった'),
            heart('heartKana', 3, 6),
            stairs('rs3', 9, 1, 'renshu4', { x: 9, y: 7 })
        ]
    },
    renshu4: {
        id: 'renshu4', name: '本番の部屋', dream: '止まらない練習室', tiles: stage20, start: { x: 9, y: 7 }, theme: 'tempo', layer: 4, deepest: true,
        rooms: [
            { name: '本番の部屋', x: [0, 19], y: [0, 5] },
            { name: '控えの通路', x: [0, 19], y: [6, 8] }
        ],
        objects: [
            ...entrance('', [10, 7], [8, 7]),
            { id: 'kanaBoss', kind: 'foe', x: 9, y: 2, foe: 'togemetoro', needs: 'active', script: 'pairBoss' }
        ]
    },
    duet2: {
        id: 'duet2', name: '楽屋裏', dream: '二重奏ホール', tiles: duet2, start: { x: 12, y: 7 }, theme: 'duet', split: 13, layer: 2,
        rooms: [
            { name: 'ミオの楽屋', x: [0, 5], y: [0, 2] },
            { name: 'カナの楽屋', x: [20, 25], y: [0, 2] },
            { name: '楽屋の廊下', x: [0, 25], y: [3, 5] },
            { name: '裏口', x: [12, 13], y: [6, 8] }
        ],
        objects: [
            ...entrance('', [13, 7], [13, 6]),
            foe('du2Onpu1', 3, 1, 'onpu'),
            foe('du2Hari1', 22, 2, 'hari'),
            foe('du2Suima', 8, 3, 'suima'),
            foe('du2Onpu2', 17, 4, 'onpu'),
            stairs('du2', 24, 1, 'duet3', { x: 12, y: 8 })
        ]
    },
    duet3: {
        id: 'duet3', name: '合わない譜面の回廊', dream: '二重奏ホール', tiles: duet3, start: { x: 12, y: 8 }, theme: 'duet', split: 13, layer: 3,
        rooms: [
            { name: '左の譜面室', x: [0, 4], y: [0, 4] },
            { name: '右の譜面室', x: [21, 25], y: [0, 4] },
            { name: '譜面の回廊', x: [0, 25], y: [5, 6] },
            { name: '回廊の入口', x: [11, 14], y: [7, 9] }
        ],
        objects: [
            ...entrance('', [11, 8], [14, 8]),
            foe('du3Hari', 22, 1, 'hari'),
            foe('du3Suima', 8, 5, 'suima'),
            foe('du3Onpu1', 17, 6, 'onpu'),
            foe('du3Onpu2', 3, 4, 'onpu'),
            resident('du3Queen', 1, 2, 'mio', 'queen2', '一人で'),
            resident('du3Judge', 24, 2, 'kana', 'judge2', '勝ちたかった'),
            stairs('du3', 2, 1, 'duet4', { x: 2, y: 5 })
        ]
    },
    duet4: {
        id: 'duet4', name: '舞台袖', dream: '二重奏ホール', tiles: duet4, start: { x: 2, y: 5 }, theme: 'duet', split: 13, layer: 4,
        rooms: [
            { name: '下手の袖', x: [0, 8], y: [0, 7] },
            { name: '上手の袖', x: [17, 25], y: [0, 7] },
            { name: '袖の通路', x: [9, 16], y: [3, 7] },
            { name: '舞台への階段', x: [11, 14], y: [0, 2] }
        ],
        objects: [
            ...entrance('', [1, 5], [1, 4]),
            foe('du4Hari1', 5, 3, 'hari'),
            foe('du4Onpu', 20, 6, 'onpu'),
            foe('du4Suima', 12, 4, 'suima'),
            foe('du4Hari2', 22, 3, 'hari'),
            heart('heartDuet', 23, 6),
            stairs('du4', 12, 1, 'duet5', { x: 12, y: 7 })
        ]
    },
    duet5: {
        id: 'duet5', name: '割れた舞台', dream: '二重奏ホール', tiles: stage26, start: { x: 12, y: 7 }, theme: 'duet', split: 13, layer: 5, deepest: true,
        rooms: [
            { name: '割れた舞台', x: [0, 25], y: [0, 5] },
            { name: '客席への通路', x: [0, 25], y: [6, 8] }
        ],
        objects: [
            ...entrance('', [13, 7], [11, 7]),
            // 舞台の 2 羽の 鳥。戦う前に 溶け合って デュエットに なる (7 日から)
            { id: 'duetBoss', kind: 'foe', x: 12, y: 2, foe: 'duet', sprite: 'duet', needs: 'active', script: 'duetBoss' }
        ]
    }
};

// 夢ごとの 階層の 並び (先頭が 第 1 層。最後が 最深部)
export const DREAM_LAYERS = {
    mio: ['mizuzoko', 'mizuzoko2', 'mizuzoko3', 'mizuzoko4'],
    kana: ['renshu', 'renshu2', 'renshu3', 'renshu4'],
    duet: ['duet', 'duet2', 'duet3', 'duet4', 'duet5'],
    riku: ['rikuField', 'riku2', 'riku3', 'riku4']
};
