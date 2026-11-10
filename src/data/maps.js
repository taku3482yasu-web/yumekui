import { TOWN_MAPS } from './town.js';

// ハルの夢『顔色の坂道』。w = 空に浮かぶ海 / M = お面の壁 / . = 坂 / s = 階段 / G = 閉じた門 / C = 崩れた所 (夢筆で 描ける)
const odoriba = [
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwCCwwwwwwwww',
    'wwwwwwww....wwwwwwww',
    'wwwww..........wwwww',
    'wwww............wwww',
    'www..............www',
    'www..............www',
    'wwww............wwww',
    'wwwww..........wwwww',
    'wwwwwwww....wwwwwwww',
    'wwwwwwwwwwwwwwwwwwww'
];

const omen = [
    'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'MMMM.....MMMMMM......MMMMMMMMMMM',
    'MMMM.....MMMMMM......MMMMMMMMMMM',
    'MMMMMM.MMMMMMMMMM.MMMMMMMMMMMMMM',
    'M.............................Gs',
    'M.............................Gs',
    'M.............................Gs',
    'MMMMMMMMMMMMMM.MMMMMMMMMMMMMMMMM',
    'MMMMMMMMMMM......MMMMMMMMMMMMMMM',
    'MMMMMMMMMMM......MMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM'
];

const hiroba = [
    'wwwwwwwwwwwwwwwwwwww',
    'wwwww..........wwwww',
    'www..............www',
    'ww................ww',
    'ww................ww',
    'ww................ww',
    'ww................ww',
    'www..............www',
    'wwwww..........wwwww',
    'wwwwwwwww..wwwwwwwww',
    'wwwwwwwwwwwwwwwwwwww'
];

const mizuzoko = [
    'wwwwwwwwwwwwwwwwwwww',
    'wwww............wwww',
    'wwww.wwww..wwww.wwww',
    'wwww.w........w.wwww',
    'wwww.w........w.wwww',
    'wwww.w........w.wwww',
    'wwww.wwww..wwww.wwww',
    'wwww............wwww',
    'wwwwwwww....wwwwwwww',
    'wwwwwwww....wwwwwwww',
    'wwwwwwwwwwwwwwwwwwww'
];

const renshu = [
    'wwwwwwwwwwwwwwwwwwww',
    'ww................ww',
    'ww.wwwwwwwwwwwwww.ww',
    'ww.w............w.ww',
    'ww.w.wwwwwwwwww.w.ww',
    'ww.w.w........w.w.ww',
    'ww.w.w........w.w.ww',
    'ww.w.wwwww.wwww.w.ww',
    'ww.............ww.ww',
    'ww..wwwwwwwwwwwww.ww',
    'wwwwwwwwwwwwwwwwwwww'
];

// ミオ×カナの夢『二重奏ホール』(夢合体)。左は 水 (ミオ)、右は トゲ (カナ)。上が 舞台。
//   L / J = 左右の 扉 (反対側の 音の石を 鳴らすと 開く。R は 現実の 屋根なので 使わない)。部屋の幅: 左の部屋 x1〜4 / 左の広間 x6〜11 / まん中 x12〜13 / 右の広間 x14〜19 / 右の部屋 x21〜24
const duet = [
    'w'.repeat(26),
    'wwwwwwwwww......wwwwwwwwww',
    'wwwwwwwwww......wwwwwwwwww',
    'wwwwwwwwwwww.wwwwwwwwwwwww',
    'w....wwwwwww..wwwwwww....w',
    'w....L........' + '......J....w',
    'w....w......' + '..' + '......w....w',
    'w....w......' + '..' + '......w....w',
    'w....wwwwwww' + '..' + 'wwwwwww....w',
    'wwwwwwwwwwww' + '..' + 'wwwwwwwwwwww',
    'wwwwwwwwwwww' + '..' + 'wwwwwwwwwwww',
    'w'.repeat(26)
];

export const MAPS = {
    odoriba: {
        id: 'odoriba', name: '目覚めの踊り場', dream: '顔色の坂道', tiles: odoriba, start: { x: 9, y: 7 },
        objects: [
            { id: 'sign1', kind: 'talk', x: 5, y: 5, sprite: 'sign', script: 'sign1' },
            { id: 'blanket', kind: 'talk', x: 9, y: 4, sprite: 'blanket', script: 'bak', hideIf: 'bak' },
            // 最初の戦いは ナナシ 2 体 (敵複数の バトル)
            { id: 'nanashi1', kind: 'foe', x: 9, y: 2, foe: 'nanashi', foes: ['nanashi', 'nanashi'], needs: 'bak', script: 'firstBattle' },
            { id: 'nanashi2', kind: 'foe', x: 10, y: 2, foe: 'nanashi', foes: ['nanashi', 'nanashi'], needs: 'bak', script: 'firstBattle' },
            // 崩れた階段: 夢筆で 階段を 描くと 上れる (夢筆の 使い方を 覚える場所)
            { id: 'stairSpot1', kind: 'brushSpot', group: 'odoribaStairs', x: 9, y: 1, sprite: 'brushMark', accepts: ['stairs'], paint: [[9, 1, 's'], [10, 1, 's']], hideIf: 'painted_odoribaStairs', done: 'stairsPainted', hint: 'brushHintStairs' },
            { id: 'stairSpot2', kind: 'brushSpot', group: 'odoribaStairs', x: 10, y: 1, sprite: 'brushMark', accepts: ['stairs'], paint: [[9, 1, 's'], [10, 1, 's']], hideIf: 'painted_odoribaStairs', done: 'stairsPainted', hint: 'brushHintStairs' },
            { id: 'toOmen', kind: 'exit', x: 9, y: 1, to: 'omen', at: { x: 2, y: 5 } },
            { id: 'toOmen2', kind: 'exit', x: 10, y: 1, to: 'omen', at: { x: 2, y: 5 } }
        ]
    },
    omen: {
        id: 'omen', name: 'お面通り', dream: '顔色の坂道', tiles: omen, start: { x: 2, y: 5 },
        objects: [
            { id: 'maskGuide', kind: 'talk', x: 4, y: 4, sprite: 'sign', script: 'maskGuide' },
            { id: 'omoteKi', kind: 'foe', x: 10, y: 5, foe: 'omote-喜' },
            { id: 'suima1', kind: 'foe', x: 6, y: 2, foe: 'suima' },
            { id: 'word1', kind: 'word', x: 7, y: 1, word: 'ほんとは', sprite: 'word' },
            { id: 'omoteAi', kind: 'foe', x: 14, y: 8, foe: 'omote-哀' },
            { id: 'word2', kind: 'word', x: 15, y: 9, word: '自分で', sprite: 'word' },
            { id: 'omoteDo', kind: 'foe', x: 17, y: 3, foe: 'omote-怒' },
            { id: 'suima2', kind: 'foe', x: 19, y: 2, foe: 'suima' },
            { id: 'word3', kind: 'word', x: 20, y: 1, word: '決めたかった', sprite: 'word' },
            { id: 'omoteRaku', kind: 'foe', x: 24, y: 5, foe: 'omote-楽' },
            { id: 'toHiroba1', kind: 'exit', x: 31, y: 4, to: 'hiroba', at: { x: 9, y: 8 } },
            { id: 'toHiroba2', kind: 'exit', x: 31, y: 5, to: 'hiroba', at: { x: 9, y: 8 } },
            { id: 'toHiroba3', kind: 'exit', x: 31, y: 6, to: 'hiroba', at: { x: 9, y: 8 } }
        ]
    },
    hiroba: {
        id: 'hiroba', name: '坂の上の広場', dream: '顔色の坂道', tiles: hiroba, start: { x: 9, y: 8 },
        objects: [
            { id: 'rest', kind: 'talk', x: 6, y: 7, sprite: 'blanket', script: 'rest' },
            { id: 'boss', kind: 'foe', x: 9, y: 3, foe: 'muresuima', sprite: 'muresuima-map', script: 'boss' }
        ]
    },
    mizuzoko: {
        id: 'mizuzoko', name: '水底の音楽室', dream: '水底の音楽室', tiles: mizuzoko, start: { x: 9, y: 9 }, theme: 'water',
        objects: [
            { id: 'mioWake', kind: 'wake', x: 10, y: 9, sprite: 'wakeDoor' },
            // 夢筆で ピアノを 描くと、弾いて 体力が 回復する
            { id: 'pianoSpot', kind: 'brushSpot', x: 8, y: 9, sprite: 'brushMark', accepts: ['piano'], hideIf: 'painted_pianoSpot', done: 'pianoPainted', hint: 'brushHintPiano' },
            { id: 'dreamPiano', kind: 'talk', x: 8, y: 9, sprite: 'piano', script: 'pianoRest', needs: 'painted_pianoSpot' },
            { id: 'mioOnpu1', kind: 'foe', x: 9, y: 7, foe: 'onpu' },
            { id: 'mioSuima', kind: 'foe', x: 15, y: 4, foe: 'suima' },
            { id: 'mioOnpu2', kind: 'foe', x: 4, y: 4, foe: 'onpu' },
            { id: 'mioWord', kind: 'word', x: 15, y: 1, word: '吹きたかった', sprite: 'word' },
            { id: 'mioDecoy', kind: 'word', x: 4, y: 1, word: 'やめたかった', sprite: 'word' },   // まちがいの 言葉
            { id: 'mioBoss', kind: 'foe', x: 9, y: 4, foe: 'gakufume', needs: 'active', script: 'pairBoss' }
        ]
    },
    renshu: {
        id: 'renshu', name: '止まらない練習室', dream: '止まらない練習室', tiles: renshu, start: { x: 2, y: 8 }, theme: 'tempo',
        objects: [
            { id: 'kanaWake', kind: 'wake', x: 3, y: 9, sprite: 'wakeDoor' },
            // 夢筆で メトロノームを 描くと、テンポが ゆっくりになり ナナシ・ハリが 動けなくなる
            { id: 'metronomeSpot', kind: 'brushSpot', x: 2, y: 9, sprite: 'brushMark', accepts: ['metronome'], hideIf: 'painted_metronomeSpot', done: 'metronomePainted', hint: 'brushHintMetronome' },
            { id: 'dreamMetronome', kind: 'talk', x: 2, y: 9, sprite: 'metronome', script: 'metronomeLook', needs: 'painted_metronomeSpot' },
            { id: 'kanaHari1', kind: 'foe', x: 6, y: 8, foe: 'hari' },
            { id: 'kanaHari2', kind: 'foe', x: 4, y: 5, foe: 'hari' },
            { id: 'kanaSuima', kind: 'foe', x: 17, y: 5, foe: 'suima' },
            { id: 'kanaWord', kind: 'word', x: 15, y: 3, word: 'ほしかった', sprite: 'word' },
            { id: 'kanaDecoy', kind: 'word', x: 17, y: 1, word: 'くやしかった', sprite: 'word' },   // まちがいの 言葉
            { id: 'kanaBoss', kind: 'foe', x: 9, y: 5, foe: 'togemetoro', needs: 'active', script: 'pairBoss' }
        ]
    },
    duet: {
        id: 'duet', name: '二重奏ホール', dream: '二重奏ホール', tiles: duet, start: { x: 12, y: 10 }, theme: 'duet', split: 13,
        rooms: [
            { name: '水に沈んだ音楽室', x: [0, 11], y: [3, 9] },
            { name: 'トゲの練習室', x: [14, 25], y: [3, 9] },
            { name: '割れた舞台', x: [0, 25], y: [0, 2] },
            { name: 'ホールの通路', x: [12, 13], y: [3, 11] }
        ],
        objects: [
            { id: 'duetWake', kind: 'wake', x: 13, y: 10, sprite: 'wakeDoor' },
            { id: 'duetRest', kind: 'talk', x: 13, y: 8, sprite: 'blanket', script: 'rest' },
            // 左の 音で 右の扉が、右の 音で 左の扉が 開く (台本 3-4)
            { id: 'mioNote', kind: 'talk', x: 7, y: 6, sprite: 'word', script: 'noteMio' },
            { id: 'kanaNote', kind: 'talk', x: 18, y: 6, sprite: 'word', script: 'noteKana' },
            { id: 'duetOnpu', kind: 'foe', x: 10, y: 7, foe: 'onpu' },
            { id: 'duetHari', kind: 'foe', x: 15, y: 7, foe: 'hari' },
            { id: 'duetSuimaL', kind: 'foe', x: 8, y: 5, foe: 'suima' },
            // 扉の 奥: 夢の住人と、言えなかった 言葉
            { id: 'queenMio', kind: 'talk', x: 3, y: 4, sprite: 'mio', script: 'queenMio' },
            { id: 'judgeKana', kind: 'talk', x: 22, y: 4, sprite: 'kana', script: 'judgeKana' },
            { id: 'duetWordMio', kind: 'word', x: 2, y: 7, word: '吹きたかった', sprite: 'word' },
            { id: 'duetWordKana', kind: 'word', x: 23, y: 7, word: 'ほしかった', sprite: 'word' },
            { id: 'duetDecoyMio', kind: 'word', x: 1, y: 8, word: 'やめたかった', sprite: 'word' },
            { id: 'duetDecoyKana', kind: 'word', x: 24, y: 8, word: 'くやしかった', sprite: 'word' },
            // 舞台への 道を ふさぐ 中ボスと、舞台の デュエット (7 日から)
            { id: 'duetMid', kind: 'foe', x: 12, y: 3, foe: 'duetSuima', sprite: 'muresuima-map', script: 'duetMid' },
            { id: 'duetBoss', kind: 'foe', x: 12, y: 1, foe: 'duetDo', foes: ['duetDo', 'duetAi'], sprite: 'duet', needs: 'active', script: 'duetBoss' }
        ]
    },
    ...TOWN_MAPS
};
