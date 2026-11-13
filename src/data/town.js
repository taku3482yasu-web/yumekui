// 現実の町の地図 (仕様書「現実のフィールド」)。夢の地図と同じ、文字のタイル + オブジェクト。
// 現実は暖かい色で描く (キャラクター設定資料集「ドット絵の決まり」)。町では敵は出ない。
//   # 壁 / b 黒板 / k 窓 / . 床 / c 廊下 / d 机 / p ピアノ / e イーゼル / s 階段 / o 渡り廊下 / f 手すり / x 校庭 (通れない)
//   T 木 / g 草 / , 道 / _ 歩道 / h 建物の壁 / R 屋根 / n のれん / m 戸口 / = 柵 / w 海 / t テーブル
// オブジェクト: person (人。調べると話す) / door (ぶつかると 入るか聞く) / block (ぶつかると セリフ。通れない)
//   canvas / bed (ハルの部屋) / talk (看板) / exit (踏むと 別の地図へ)

// 中学校の 2 階: 教室・音楽室・美術室と、廊下の先の 渡り廊下
// 部屋の幅: 教室 10・音楽室 11・美術室 10 (x = 1〜10 / 12〜22 / 24〜33)。x = 35〜44 が 渡り廊下
const rooms = (classroom, music, art, outside) => `#${classroom}#${music}#${art}#${outside}`;
const school = [
    '#'.repeat(35) + 'x'.repeat(11),
    rooms('b'.repeat(10), 'b'.repeat(11), 'b'.repeat(10), 'x'.repeat(11)),
    rooms('..........', '....pp.....', '..........', 'x'.repeat(11)),
    rooms('.dd.dd.dd.', '...........', '.e..e..e..', 'x'.repeat(11)),
    rooms('..........', '...........', '..........', 'x'.repeat(11)),
    rooms('.dd.dd.dd.', '.d.d.d.d...', '.dd..dd...', 'x'.repeat(11)),
    rooms('..........', '...........', '..........', 'x'.repeat(11)),
    rooms('##.#######', '####.######', '#####.####', 'f'.repeat(10) + 'x'),
    '#s' + 'c'.repeat(33) + 'o'.repeat(10) + '#',
    '#s' + 'c'.repeat(33) + 'o'.repeat(10) + '#',
    '#' + 'k'.repeat(33) + '#' + 'f'.repeat(10) + 'x',
    '#'.repeat(35) + 'x'.repeat(11)
];

// 坂道と商店街: 上が 校門、坂の 下に ハルの家 (青い 屋根の 2 階建て)。右の 分かれ道の先が リクの家
//   2026-11-13 ユーザー指定で 町を 広げた: 右に 海と 丘の 家並み、下に 海辺の 遊歩道・公園・住宅街・南の 大通り。
//   もとの 24×18 の 部分は 座標を 変えずに 残した (朝の 通学路・出口・リクの 分かれ道が そのまま 使える)
//   H = ハルの家の 青い 屋根 / U = 灰色の 屋根 / z = よその家の 戸 / u = ポスト / y = 電柱 / v = 自動販売機 / F = 花だん / P = ベンチ / A = 砂場
const saka = [
    'TTTTTTThhhhhhhhhhTTsTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTThhhhmmhhhhTTsTTTTTTTTTTTTTTTTTTTT',
    'TTggggg=,,,,,,,,=gggggTTgUUUUUgRRRRRRggT',
    'TTggggg=,,,,,,,,=gggggTTghkhkhghkhhkhggT',
    'TTRRRRR_,,,,,,,,_gggggTTgUUUUUgRRRRRRggT',
    'TThhhhh_,,,,,,,,_gggggTTghkzkhghkhzkhggT',
    'TThnmnh_,,,,,,,,_ggTggTTgFgFgggggFgFgFgT',
    'TT______,,,,,,,,_gggggggggggTgggggTggggT',
    'TTRRRRR_,,,,,,,,,,,,,,,,TTTTTTTTTTTTTTTT',
    'TThhhhh_,,,,,,,,,,,,,,,,TTTTTTTTTTTTTTTT',
    'TThkhkh_,,,,,,,,=TTTTTTTTTTTTTTTTTTTTTTT',
    'TT______,,,,,,,,=wwwwwwwwwwwwwwwwwwwwwwT',
    'TTHHHHH_,,,,,,,,=wwwwwwwwwwwwwwwwwwwwwwT',
    'TThkhkh_,,,,,,,,=wwwwwwwwwwwwwwwwwwwwwwT',
    'TTHHHHH_,,,,,,,,=wwwwwwwwwwwwwwwwwwwwwwT',
    'TThhhhh_,,,,,,,,=wwwwwwwwwwwwwwwwwwwwwwT',
    'TThkmkh_,,,,,,,,=wwwwwwwwwwwwwwwwwwwwwwT',
    'TTu_____,,,,,,,,=wwwwwwwwwwwwwwwwwwwwwwT',
    'TTgFgFg_,,,,,,,,_======================T',
    'TTUUUUU_,,,,,,,,_______________________T',
    'TThkhkh_,,,,,,,,_FgFgg__gFF_,,_RRRRRRggT',
    'TTUUUUU_,,,,,,,,_ggAAAggPPg_,,_hkhhkhggT',
    'TThkzkh_,,,,,,,,_ggAAAggggg_,,_RRRRRRggT',
    'TTgFgug_,,,,,,,,_ggggyggggg_,,_hkhzkhvvT',
    'TTggggg_,,,,,,,,_gTggggggTg_,,_gugFgFggT',
    'TTRRRRR_,,,,,,,,_gggggggggg_,,_ygggggggT',
    'TThkhkh_,,,,,,,,_RRRRRUUUUU_,,_gUUUUUUgT',
    'TTRRRRR_,,,,,,,,_hkhkhhkhkh_,,_ghkhkhkgT',
    'TThkzkh_,,,,,,,,_RRRRRUUUUU_,,_gUUUUUUgT',
    'TTguFgg_,,,,,,,,_hkzkhhkzkh_,,_ghkzhkhgT',
    'TTgTggg_,,,,,,,,_gFguggugFg_,,_ggFgguFgT',
    'TTgggyg_,,,,,,,,_gggggggggg_,,_ggggggggT',
    'TT____________________________________TT',
    'TT,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,TT',
    'TT,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
];

// リクの家の前 (3 周目に入れる。小規模版の 段階3 で 使う)
const rikuhouse = [
    'TTTTTTTTTTTTTT',
    'TTRRRRRRRRRRTT',
    'TThhhhhhhhhhTT',
    'TThkhhhmhhkhTT',
    'TT__________TT',
    ',,__________TT',
    ',,__________TT',
    'TTggggggggggTT',
    'TTTTTTTTTTTTTT'
];

// 丘の上の 天文台 (2 周目から。台本 4-2): 坂道の 右上の 石段を のぼった先。白い ドームと、外に 出した 望遠鏡
//   O ドーム / D ドームの すき間 / h ドームの 台の 壁 / Q 望遠鏡 (どれも 通れない)。下の 石段から 坂道へ もどる
const observatory = [
    'TTTTTTTTTTTTTTTT',
    'TTTTTOODOOTTTTTT',
    'TTTTOOODOOOTTTTT',
    'TTgghhhhhhhgggTT',
    'TTgg________ggTT',
    'TTgg__Q_____ggTT',
    'TTgg________ggTT',
    'TTggggg__gggggTT',
    'TTTTTTTssTTTTTTT'
];

// ハルの家 (2026-11-13 ユーザー指定で 2 階建てに)
//   1 階 (home1): 左が 台所 (K = 流し台)、まん中が 居間 (父)、右に 2 階への 階段。下の 玄関から 町へ
//   2 階 (home): 左が 廊下と 1 階への 階段 (父の 部屋の 戸)、右が ハルの部屋 (机・キャンバス・ベッド)
const home1 = [
    '################',
    '#kkk#kkkkkkk#kk#',
    '#KK.#.......#ss#',
    '#...#..tt...#..#',
    '#...#..tt...#..#',
    '#..............#',
    '#...#.......#..#',
    '#...#.......#..#',
    '##########m#####'
];

const home = [
    '################',
    '#kk#mkk#kkkkkkk#',
    '#......#.dd....#',
    '#......#.......#',
    '#......#.......#',
    '#..............#',
    '#ss....#.......#',
    '#ss....#.......#',
    '################'
];

const person = (id, who, x, y) => ({ id, kind: 'person', who, x, y, sprite: who });

export const TOWN_MAPS = {
    school: {
        id: 'school', name: '夢見坂中学校', real: true, tiles: school, start: { x: 2, y: 8 },
        rooms: [
            { name: '2年1組の教室', x: [1, 10], y: [1, 6] },
            { name: '音楽室', x: [12, 22], y: [1, 6] },
            { name: '美術室', x: [24, 33], y: [1, 6] },
            { name: '渡り廊下', x: [35, 45], y: [7, 10] },
            { name: '廊下', x: [0, 34], y: [7, 10] }
        ],
        objects: [
            { id: 'toSaka1', kind: 'exit', x: 1, y: 8, to: 'saka', at: { x: 11, y: 2 } },
            { id: 'toSaka2', kind: 'exit', x: 1, y: 9, to: 'saka', at: { x: 12, y: 2 } },
            person('riku', 'riku', 4, 4),
            person('momo', 'momo', 8, 2),
            person('kaito', 'kaito', 7, 6),
            person('aki', 'aki', 10, 8),
            person('student', 'student', 20, 9),
            person('mio', 'mio', 18, 4),
            { id: 'metronome', kind: 'look', x: 20, y: 3, sprite: 'metronome', image: 'metronome' },
            person('sora', 'sora', 27, 4),
            person('kana', 'kana', 42, 8)
        ]
    },
    saka: {
        id: 'saka', name: '坂道と商店街', real: true, tiles: saka, start: { x: 11, y: 2 },
        rooms: [
            { name: 'ハルの家の前', x: [0, 7], y: [11, 18] },
            { name: '丘の家並み', x: [17, 39], y: [0, 7] },
            { name: '海辺の遊歩道', x: [16, 39], y: [18, 19] },
            { name: '公園', x: [17, 26], y: [20, 25] },
            { name: '南の大通り', x: [0, 39], y: [32, 36] },
            { name: '住宅街', x: [0, 39], y: [19, 31] },
            { name: '校門', x: [0, 23], y: [0, 3] },
            { name: '商店街', x: [0, 23], y: [4, 9] },
            { name: '坂道', x: [0, 23], y: [10, 18] }
        ],
        objects: [
            // プロローグ (2月1日の放課後): 学校には 戻らず、家に帰る
            { id: 'prologueGate1', kind: 'block', x: 11, y: 1, script: 'prologueSchool', needs: 'prologue' },
            { id: 'prologueGate2', kind: 'block', x: 12, y: 1, script: 'prologueSchool', needs: 'prologue' },
            { id: 'schoolClosed1', kind: 'block', x: 11, y: 1, script: 'schoolClosed', night: true },
            { id: 'schoolClosed2', kind: 'block', x: 12, y: 1, script: 'schoolClosed', night: true },
            { id: 'toSchool1', kind: 'exit', x: 11, y: 1, to: 'school', at: { x: 2, y: 8 } },
            { id: 'toSchool2', kind: 'exit', x: 12, y: 1, to: 'school', at: { x: 2, y: 9 } },
            { id: 'tomeShop', kind: 'door', x: 4, y: 6, script: 'tomeShop' },
            person('tome', 'tome', 2, 7),
            person('ken', 'ken', 20, 22),   // 公園の 砂場
            { id: 'halPlate', kind: 'talk', x: 3, y: 17, sprite: 'sign', script: 'halPlate' },   // ハルの家の 表札
            // 広げた 町の 人たち (11/13)
            person('neighbor', 'neighbor', 23, 23),
            person('oldman', 'oldman', 25, 22),
            person('postman', 'postman', 9, 27),
            person('jogger', 'jogger', 33, 19),
            person('girlKid', 'girlKid', 19, 21),
            { id: 'portSign', kind: 'talk', x: 12, y: 17, sprite: 'sign', script: 'portSign' },
            // 右上の 石段: 丘の上の 天文台へ (2 周目から。台本 4-2)。1 周目は のぼらない
            { id: 'observatoryClosed', kind: 'block', x: 19, y: 0, script: 'observatoryClosed', hideIf: 'observatory' },
            { id: 'toObservatory', kind: 'exit', x: 19, y: 0, to: 'observatory', at: { x: 7, y: 7 }, needs: 'observatory' },
            { id: 'homeDoor', kind: 'door', x: 4, y: 16, script: 'goHome' },
            { id: 'rikuRoad1', kind: 'block', x: 23, y: 8, script: 'rikuRoad', hideIf: 'rikuOpen' },
            { id: 'rikuRoad2', kind: 'block', x: 23, y: 9, script: 'rikuRoad', hideIf: 'rikuOpen' },
            { id: 'toRiku1', kind: 'exit', x: 23, y: 8, to: 'rikuhouse', at: { x: 1, y: 5 }, needs: 'rikuOpen' },
            { id: 'toRiku2', kind: 'exit', x: 23, y: 9, to: 'rikuhouse', at: { x: 1, y: 6 }, needs: 'rikuOpen' }
        ]
    },
    rikuhouse: {
        id: 'rikuhouse', name: 'リクの家の前', real: true, tiles: rikuhouse, start: { x: 1, y: 5 },
        objects: [
            { id: 'fromRiku1', kind: 'exit', x: 0, y: 5, to: 'saka', at: { x: 22, y: 8 } },
            { id: 'fromRiku2', kind: 'exit', x: 0, y: 6, to: 'saka', at: { x: 22, y: 9 } },
            { id: 'rikuDoor', kind: 'door', x: 7, y: 3, script: 'rikuDoor' },
            { ...person('rikuFather', 'rikuFather', 9, 4), needs: 'rikuFather' }
        ]
    },
    observatory: {
        id: 'observatory', name: '丘の上の天文台', real: true, tiles: observatory, start: { x: 7, y: 7 },
        objects: [
            { id: 'fromObservatory1', kind: 'exit', x: 7, y: 8, to: 'saka', at: { x: 19, y: 1 } },
            { id: 'fromObservatory2', kind: 'exit', x: 8, y: 8, to: 'saka', at: { x: 19, y: 1 } },
            { id: 'telescope', kind: 'block', x: 6, y: 5, script: 'telescope' },
            person('michiru', 'michiru', 7, 5)
        ]
    },
    home1: {
        id: 'home1', name: 'ハルの家', real: true, indoor: true, tiles: home1, start: { x: 10, y: 7 },
        rooms: [
            { name: '台所', x: [0, 3], y: [0, 8] },
            { name: '居間', x: [4, 12], y: [0, 8] },
            { name: '階段', x: [13, 15], y: [0, 8] }
        ],
        objects: [
            { id: 'prologueStay', kind: 'block', x: 10, y: 8, script: 'prologueStay', needs: 'prologue' },   // 父に 部屋へ 行けと 言われた あと
            { id: 'toTown', kind: 'exit', x: 10, y: 8, to: 'saka', at: { x: 4, y: 17 } },
            { id: 'upstairs1', kind: 'exit', x: 13, y: 2, to: 'home', at: { x: 1, y: 5 } },
            { id: 'upstairs2', kind: 'exit', x: 14, y: 2, to: 'home', at: { x: 2, y: 5 } },
            person('father', 'father', 9, 3)
        ]
    },
    home: {
        id: 'home', name: 'ハルの家 2階', real: true, indoor: true, tiles: home, start: { x: 12, y: 5 },
        rooms: [
            { name: '2階の廊下', x: [0, 6], y: [0, 8] },
            { name: 'ハルの部屋', x: [7, 15], y: [0, 8] }
        ],
        objects: [
            { id: 'downstairs1', kind: 'exit', x: 1, y: 6, to: 'home1', at: { x: 13, y: 3 } },
            { id: 'downstairs2', kind: 'exit', x: 2, y: 6, to: 'home1', at: { x: 14, y: 3 } },
            { id: 'fatherRoom', kind: 'block', x: 4, y: 1, script: 'fatherRoom' },
            { id: 'canvas', kind: 'canvas', x: 13, y: 3, sprite: 'canvas' },
            { id: 'bed', kind: 'bed', x: 13, y: 6, sprite: 'bed' }
        ]
    }
};
