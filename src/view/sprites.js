// ドット絵。文字 1 つが 1 ドット。. は透明
const PALETTE = {
    k: '#20203a', s: '#f2c9a0', e: '#20203a', n: '#2f4a7d', d: '#22365e', w: '#e8ecf5', t: '#141428',
    b: '#7e6bd0', c: '#a795ec', y: '#ffe08a', p: '#f0b6c8', g: '#59509a',
    f: '#eef0ff', h: '#c6c9ea', o: '#6fd0d8', q: '#3f96ac', r: '#ff8f7a', l: '#ffd86b', u: '#6fb0ff', v: '#8fe0a0',
    m: '#fff4dc', a: '#8a6a4a', z: '#5c4630'
};

const ART = {
    'hal-down': [
        '....kkkk....',
        '..kkkkkkkk..',
        '.kkkkkkkkkk.',
        '.kkssssssskk',
        '.kseesseesk.',
        '..ssssssss..',
        '...ssssss...',
        '..wwwwwwww..',
        '.nnnwwwwnnn.',
        '.nnnnwwnnnn.',
        '.snnnnnnnns.',
        '..nnnnnnnn..',
        '..dddddddd..',
        '..ddd..ddd..',
        '..ddd..ddd..',
        '..ttt..ttt..'
    ],
    'hal-up': [
        '....kkkk....',
        '..kkkkkkkk..',
        '.kkkkkkkkkk.',
        '.kkkkkkkkkk.',
        '.kkkkkkkkkk.',
        '..kkkkkkkk..',
        '...ssssss...',
        '..nnnnnnnn..',
        '.nnnnnnnnnn.',
        '.nnnnnnnnnn.',
        '.snnnnnnnns.',
        '..nnnnnnnn..',
        '..dddddddd..',
        '..ddd..ddd..',
        '..ddd..ddd..',
        '..ttt..ttt..'
    ],
    'hal-side': [
        '....kkkk....',
        '..kkkkkkkk..',
        '.kkkkkkkkkk.',
        '.kkkkkssss..',
        '.kkkksseess.',
        '..kkssssss..',
        '...ssssss...',
        '...nnwwww...',
        '..nnnnwww...',
        '..nnnnnnn...',
        '..snnnnnns..',
        '...nnnnnn...',
        '...dddddd...',
        '...ddddd....',
        '...dd.ddd...',
        '...tt.ttt...'
    ],
    // 獏。クリーム色の体と長い鼻に、紫の毛布を羽織っている
    bak: [
        '.........bbbbb........',
        '.......bbcbbbbb..kk...',
        '.....bbbbbbybbbbkmmk..',
        '....bcbbbbbbbbbkmmmmk.',
        '...bbbbbcbbbbbkmmemmk.',
        '...bbybbbbbbbbkmmmmmk.',
        '...bbbbbbbbcbkmmmmppk.',
        '...kmmbbbbbbbkmmmmpppk',
        '..kmmmmbbbbkmmmmkkppk.',
        '..kmmmmmmmmmmmmk..kk..',
        '..kmmmmmmmmmmmmk......',
        '..kmmmmmmmmmmmk.......',
        '...kmmkkkkkmmk........',
        '...kmk....kmk.........',
        '...kkk....kkk.........'
    ],
    blanket: [
        '................',
        '................',
        '................',
        '.....bbbbbb.....',
        '...bbccbbbbbb...',
        '..bbcyybbbbbbb..',
        '.bbbbyybbcbbbbb.',
        '.bbbbbbbbbbbbbb.',
        'bbcbbbbbbbbbcbbb',
        'bbbbbbbbbbbbbbbb',
        'bbbbbbbybbbbbbbb',
        'bcbbbbbbbbbcbbbb',
        'bbbbbbbbbbbbbbbb',
        '.bbbbbbbbbbbbbb.',
        '................',
        '................'
    ],
    nanashi: [
        '.....ffffff.....',
        '...ffffffffff...',
        '..ffffffffffff..',
        '.ffffffffffffff.',
        '.ffhhffffffhhff.',
        '.ffhhffffffhhff.',
        '.ffffffffffffff.',
        '.ffffffffffffff.',
        '.ffffffffffffff.',
        '.ffffffffffffff.',
        '.fffhffffffhfff.',
        '..ffhhffffhhff..',
        '..ffhhhffhhhff..',
        '..f.fhf..fhf.f..',
        '....f......f....',
        '................'
    ],
    suima: [
        '................',
        '................',
        '................',
        '................',
        '......oooo......',
        'q...oooooooo....',
        'qq.oooooowooo...',
        'qqqoooooookoo...',
        'qqqooooooooo....',
        'qq.ooooooooo....',
        'q...oooooo......',
        '................',
        '................',
        '................',
        '................',
        '................'
    ],
    sign: [
        '................',
        '................',
        '..aaaaaaaaaaaa..',
        '..ammmmmmmmmma..',
        '..amzzmzzzmmma..',
        '..ammmmmmmmmma..',
        '..amzzzmzzmmma..',
        '..ammmmmmmmmma..',
        '..aaaaaaaaaaaa..',
        '.......aa.......',
        '.......aa.......',
        '.......aa.......',
        '.......aa.......',
        '......zzzz......',
        '................',
        '................'
    ],
    word: [
        '................',
        '..wwwwwwwwwwww..',
        '.wwwwwwwwwwwwww.',
        '.wwwwwwwwwwwwww.',
        '.wwwkkwwkkwwkkw.',
        '.wwwkkwwkkwwkkw.',
        '.wwwwwwwwwwwwww.',
        '.wwwwwwwwwwwwww.',
        '..wwwwwwwwwwww..',
        '.....www........',
        '.....ww.........',
        '.....w..........',
        '................',
        '................',
        '................',
        '................'
    ]
};

// お面の顔。ナナシの顔の位置に重ねる
const FACES = {
    喜: { color: 'l', rows: ['..........', '.kk....kk.', 'k..k..k..k', '..........', '..k....k..', '...kkkk...'] },
    怒: { color: 'r', rows: ['k........k', '.kk....kk.', '...k..k...', '.kk....kk.', '...kkkk...', '..k....k..'] },
    哀: { color: 'u', rows: ['..k....k..', '.k......k.', '.kk....kk.', '.u......u.', '...kkkk...', '..k....k..'] },
    楽: { color: 'v', rows: ['..........', 'kkkk..kkkk', '..........', '...k..k...', '....kk....', '..........'] }
};

const cache = new Map();

function paint(rows, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(...rows.map((row) => row.length));
    canvas.height = rows.length;
    const ctx = canvas.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect(x, y, 1, 1);
    }));
    draw?.(ctx);
    return canvas;
}

function maskArt(attr) {
    const face = FACES[attr];
    return paint(ART.nanashi, (ctx) => {
        ctx.fillStyle = PALETTE[face.color];
        ctx.fillRect(3, 3, 10, 8);
        ctx.fillRect(4, 2, 8, 10);
        face.rows.forEach((row, y) => [...row].forEach((ch, x) => {
            if (ch === '.') return;
            ctx.fillStyle = PALETTE[ch];
            ctx.fillRect(3 + x, 4 + y, 1, 1);
        }));
    });
}

// 小さな魚が集まって 1 匹の大魚に見える形
function schoolArt(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const fish = paint(ART.suima);
    const center = size / 2;
    const count = Math.round(size * 0.9);
    for (let i = 0; i < count; i++) {
        const angle = i * 2.399963;
        const radius = Math.sqrt(i / count) * (size / 2 - 8);
        const x = center + Math.cos(angle) * radius * 1.15 - 8;
        const y = center + Math.sin(angle) * radius * 0.75 - 8;
        ctx.globalAlpha = 0.65 + (i % 3) * 0.15;
        ctx.drawImage(fish, Math.round(x), Math.round(y));
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.r;
    ctx.fillRect(center + size * 0.22, center - size * 0.1, size * 0.07, size * 0.07);
    return canvas;
}

export function sprite(name) {
    if (cache.has(name)) return cache.get(name);
    let canvas;
    if (name.startsWith('omote-')) canvas = maskArt(name.slice(6));
    else if (name === 'muresuima') canvas = schoolArt(64);
    else if (name === 'muresuima-map') canvas = schoolArt(32);
    else canvas = paint(ART[name]);
    cache.set(name, canvas);
    return canvas;
}
