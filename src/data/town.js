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

// 坂道と商店街: 上が 校門、下が ハルの家。右の 分かれ道の先が リクの家
const saka = [
    'TTTTTTThhhhhhhhhhTTTTTTT',
    'TTTTTTThhhhmmhhhhTTTTTTT',
    'TTggggg=,,,,,,,,=gggggTT',
    'TTggggg=,,,,,,,,=gggggTT',
    'TTRRRRR_,,,,,,,,_gggggTT',
    'TThhhhh_,,,,,,,,_gggggTT',
    'TThnmnh_,,,,,,,,_ggTggTT',
    'TT______,,,,,,,,_gggggTT',
    'TTRRRRR_,,,,,,,,,,,,,,,,',
    'TThhhhh_,,,,,,,,,,,,,,,,',
    'TThkhkh_,,,,,,,,=TTTTTTT',
    'TT______,,,,,,,,=wwwwwwT',
    'TTggggg_,,,,,,,,=wwwwwwT',
    'TTgTggg_,,,,,,,,=wwwwwwT',
    'TTRRRRR_,,,,,,,,=wwwwwwT',
    'TThhhhh_,,,,,,,,=wwwwwwT',
    'TThkmkh_,,,,,,,,=wwwwwwT',
    'TT______,,,,,,,,=wwwwwwT',
    'TTTTTTTTTTTTTTTTTTTTTTTT'
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

// ハルの家: 左が 居間、右が ハルの部屋 (机・キャンバス・ベッド)
const home = [
    '################',
    '#kkkkkk#kkkkkkk#',
    '#......#.dd....#',
    '#.tt...#.......#',
    '#.tt...#.......#',
    '#..............#',
    '#......#.......#',
    '#......#.......#',
    '###m############'
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
            person('ken', 'ken', 3, 12),
            { id: 'portSign', kind: 'talk', x: 12, y: 17, sprite: 'sign', script: 'portSign' },
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
    home: {
        id: 'home', name: 'ハルの家', real: true, indoor: true, tiles: home, start: { x: 3, y: 7 },
        rooms: [
            { name: '居間', x: [0, 6], y: [0, 8] },
            { name: 'ハルの部屋', x: [7, 15], y: [0, 8] }
        ],
        objects: [
            { id: 'prologueStay', kind: 'block', x: 3, y: 8, script: 'prologueStay', needs: 'prologue' },   // 父に 部屋へ 行けと 言われた あと
            { id: 'toTown', kind: 'exit', x: 3, y: 8, to: 'saka', at: { x: 4, y: 17 } },
            person('father', 'father', 4, 3),
            { id: 'canvas', kind: 'canvas', x: 13, y: 3, sprite: 'canvas' },
            { id: 'bed', kind: 'bed', x: 13, y: 6, sprite: 'bed' }
        ]
    }
};
