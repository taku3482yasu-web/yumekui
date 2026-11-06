// ハルの夢『顔色の坂道』。w = 空に浮かぶ海 / M = お面の壁 / . = 坂 / s = 階段 / G = 閉じた門
const odoriba = [
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwsswwwwwwwww',
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

export const MAPS = {
    odoriba: {
        id: 'odoriba', name: '目覚めの踊り場', tiles: odoriba, start: { x: 9, y: 7 },
        objects: [
            { id: 'sign1', kind: 'talk', x: 5, y: 5, sprite: 'sign', script: 'sign1' },
            { id: 'blanket', kind: 'talk', x: 9, y: 4, sprite: 'blanket', script: 'bak', hideIf: 'bak' },
            { id: 'nanashi1', kind: 'foe', x: 9, y: 2, foe: 'nanashi', needs: 'bak', script: 'firstBattle' },
            { id: 'nanashi2', kind: 'foe', x: 10, y: 2, foe: 'nanashi', needs: 'bak', script: 'firstBattle' },
            { id: 'toOmen', kind: 'exit', x: 9, y: 1, to: 'omen', at: { x: 2, y: 5 } },
            { id: 'toOmen2', kind: 'exit', x: 10, y: 1, to: 'omen', at: { x: 2, y: 5 } }
        ]
    },
    omen: {
        id: 'omen', name: 'お面通り', tiles: omen, start: { x: 2, y: 5 },
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
        id: 'hiroba', name: '坂の上の広場', tiles: hiroba, start: { x: 9, y: 8 },
        objects: [
            { id: 'rest', kind: 'talk', x: 6, y: 7, sprite: 'blanket', script: 'rest' },
            { id: 'boss', kind: 'foe', x: 9, y: 3, foe: 'muresuima', sprite: 'muresuima-map', script: 'boss' }
        ]
    }
};
