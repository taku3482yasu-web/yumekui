// ドット絵。文字 1 つが 1 ドット。. は透明
const PALETTE = {
    k: '#20203a', s: '#f2c9a0', e: '#20203a', n: '#2f4a7d', d: '#22365e', w: '#e8ecf5', t: '#141428',
    b: '#7e6bd0', c: '#a795ec', y: '#ffe08a', p: '#f0b6c8', g: '#59509a',
    f: '#eef0ff', h: '#c6c9ea', o: '#6fd0d8', q: '#3f96ac', r: '#ff8f7a', l: '#ffd86b', u: '#6fb0ff', v: '#8fe0a0',
    m: '#fff4dc', a: '#8a6a4a', z: '#5c4630', j: '#c84a48', i: '#2a64a8',
    x: '#8a2436', X: '#6a2238', A: '#a08a86', B: '#c08a3a', Z: '#3a2a3a'
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
    // 獏。雲のように丸い体と、くるんと丸まった鼻。星空の裏地の紫の毛布をマントのように結んでいる。鼻先に夢のシャボン玉
    bak: [
        '............kkk.....kk........',
        '...........kmmk.....khk.......',
        '........kkkmhmkkkkk..khk......',
        '.......kcckmhmmkmmmkkhhk......',
        '.....kkccckmhmmmmmmmmmhk......',
        '.....kccccbmmmmmmmmmmmhk......',
        '....kcccccbkmmmmmmmmmmmk....o.',
        'kk.kbbcccccbbhhmmmmmmmmk...owo',
        'ktybccccbbcgbhmmmemmmmkk....o.',
        'kkktkktkycccccmmpmmmmmmk......',
        'kkkkyktkkkkccbcmmmmmmmmkkkk...',
        '.kgkkkkkkkmhhcggmmmhhmmkmmmk..',
        '..kkggkkhmmmmhbgkkkkhmmmkmmk..',
        '....khhhmmmmmmmmmbkkkhmmmmmk..',
        '.....khhhmmmmmmmmcmghkkkkkk...',
        '.....khhhhhmmmmmmhhhk.........',
        '.....khmhkhkmmmmhhhk..........',
        '......kkkkk.kkkkkkkk..........'
    ],
    // ガクフメ。五線譜の破れた羽を大きく広げた鳥。空っぽの目から音符の涙が落ちる
    gakufume: [
        '............kkk........................',
        '...........khhk........................',
        '..........khhkk.....kkk.....kkk........',
        '........kkfffk.....kkkfkkk..kghkk......',
        '......kkgfffkk.....kkfgklllkkkfffk.....',
        '......khffffgk.....kffhklk..kkfffgk....',
        '.....khhffffggk....kifk....kcggfffckk..',
        '.....khcfffghhhk...kfik....kgggffffhck.',
        '....khhhfffghhhhkkkfiffkkkkchgggffhhgn.',
        '...kkhhhfffnhhhhhhfffiffgcchfhgggfgggk.',
        '..kgckghhftghnhffhhfifffhffhffhgnkhkgk.',
        '..kgkhhhhhgghhffhghhffffhffhffhgkkkkkk.',
        '..kkhhhhhhcgkhffhghhfffhnffhhhhhkkkkk..',
        '..kkgkkkhhtkhhhnhghhhhhknhfhnhhcnk.....',
        '..gggkkhhgtkgnhkknchhhcknhhnncnnkk.....',
        '..kgkkkhhhtkkkkkngchggkknnnkkkkkkk.....',
        '.kggkkkchgtkkkk.kgcckk.kkfnkkkk.kk.....',
        '.kktkkkkngk....kggkkkkk.kkkk...........',
        '...kkkkkknk....kkkkkkkk................',
        '......kkkkk...kkkkkkkkkk...............',
        '......kkknk..kkkkkkkkkkk...............',
        '.......kkk..kkkkkkkcknkkk..............',
        '.........kkkktkkttkcknkkk..............',
        '.........kkkkkkkkkkkkkkkkk.............'
    ],
    // トゲメトロ。背中に山のような三角のメトロノーム。体中のトゲは メトロノームの針。仮面の目は つり上がっている
    togemetoro: [
        '...................kk...............',
        '..................kkak..............',
        '.................kkkazk.............',
        '.................kzkzzk.............',
        '.............AA..kzzzzzk............',
        '.............AA.kzzzzazk..AA........',
        '...............Akzzzzazzk.AA........',
        '...............kAzzzzazzkA..........',
        '...............kAzzzzzzzA...........',
        '...............kzAzzzzzzAk..........',
        '..............kzzzAkzzaAzk..........',
        '..............kaaaaAaaAzzkk.........',
        '.........A...kaaaaaaAAzzzAk...A.....',
        '..........A.kkaAaaaaaaazAkzk.A......',
        '..........AkkaaAkkaaaaakAzzkkA......',
        '......A....AkxxAxkxakXkkkkkkAk...A..',
        '.......AA.kxxxxxxxxxxxkxkkkXkkkAA...',
        '.........AkxxxxxxxxkxxxxkxkxkkAk....',
        '........kkxxxxxxxxxxxxxxxxkxXXkk....',
        '....AA..kxxxmmmmmxxxxxxxxxxxXkkk....',
        '.....kAAxxXXmmmmmmxxXXxxxxxxxxkkkkAA',
        '.....kxxxXXXkjmjkmxkXXXXXXxxxxxkAA..',
        '.....kxxxXXkmmmmmmXXXXXXXXXxkxxkkk..',
        '....kkxxxXkkmmmmmkkkkkkkkXXxxxxAXXk.',
        '....kxxxxXk.kmmmmkkkkkkkkkXxkxxXkXXk',
        '...kxxxxXXkkkmmmkkkkkkkkkkxxxxxXkXXk',
        '..kxxxxxxk.kkkkkkkkkkkkkkxxxxxxXkXXk',
        '.kxxxxxxxk.kkkkkkk.kkkkkkxxxxxxkkkkk',
        'kxxXxkkkXk..kkkkkk....kxxxXXxxxkkkkk',
        'kXxkkkkkkxkkkkkkk....kxkxXkkXxxk.kkk',
        'kkk..................kk.kkkkkxXk.kkk',
        '............................kkk.....',
        '....................................'
    ],
    onpu: [
        '.........uuuu...',
        '.........uuuuu..',
        '.........u...uu.',
        '.........u......',
        '.........u......',
        '......fffu......',
        '....ffffffu.....',
        '...ffffffff.....',
        '...ffuffuff.....',
        '...ffffffff.....',
        '...ffffffff.....',
        '...f.ff.f.f.....'
    ],
    hari: [
        '...r...r...r....',
        '....r..r..r.....',
        '.....ffffff.....',
        '...ffffffffff...',
        'rr.ffrffffrff.rr',
        '...ffffffffff...',
        '.rrffffffffffrr.',
        '...ffffffffff...',
        '...ffffffffff...',
        '...f.ff..ff.f...'
    ],
    wakeDoor: [
        '....llllllll....',
        '...lmmmmmmmml...',
        '..lmmmmmmmmmml..',
        '..lmmyyyyyymml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..lmyyyyyyyyml..',
        '..llllllllllll..',
        '................'
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
    // フィールドで ハルに ついて歩く 小さな バク (手のひらサイズ)
    'bak-mini': [
        '......kk..k....',
        '....kkmkkkhk...',
        '...kcmmmmmmk...',
        '..kccbmmmmmk...',
        'kkkcccbmmemk...',
        'kkkkkmcmmmpmkk.',
        '.kgkmmmmgkhmmk.',
        '..khhmmmmhkkk..',
        '...kkkkkkk.....'
    ],
    // デュエットの 鳥 (右向き)。哀しみの鳥は 青。怒りの鳥は 赤く 塗り替えて 左向きにする。足もとに 1 本の 楽譜
    'bird-ai': [
        '................',
        '.........uuu....',
        '........uuuuu...',
        '........uukuuy..',
        '........uuuuuyy.',
        '..ii...uuuuuu...',
        '.iiiiuuuuuuuu...',
        'iiiiiiuuuuuuu...',
        '.iiiiiiuuuuu....',
        '...iiiiiuuu.....',
        '.....uuuu.......',
        '......y.y.......',
        'hhhhhhhhhhhhhhhh',
        '................'
    ],
    // 夢筆で 描ける場所: ぼんやり光る 筆あと
    brushMark: [
        '................',
        '................',
        '.......c........',
        '......ccc.......',
        '.....cfyfc......',
        '....cfyyyfc.....',
        '...cfyyfyyfc....',
        '....cfyyyfc.....',
        '.....cfyfc......',
        '......ccc.......',
        '.......c........',
        '..c..........c..',
        '................',
        '.....c....c.....',
        '................',
        '................'
    ],
    // 夢筆で 描いた ピアノ (夢の色)
    piano: [
        '................',
        '................',
        '..kkkkkkkkkkkk..',
        '..kbbbbbbbbbbk..',
        '..kbbbbbbbbbbk..',
        '.kkkkkkkkkkkkkk.',
        '.kffkffkffkffk..',
        '.kffkffkffkffk..',
        '.kffffffffffffk.',
        '.kkkkkkkkkkkkkk.',
        '..kb........bk..',
        '..kb........bk..',
        '..kb........bk..',
        '..kk........kk..',
        '................',
        '................'
    ],
    // メトロノーム (現実の 音楽室にも、描いた夢の中にも)
    metronome: [
        '................',
        '.......kk.......',
        '.......kk.......',
        '......kaak......',
        '......kalk......',
        '.....kaakak.....',
        '.....kaakaak....',
        '....kaaakaak....',
        '....kaaalaak....',
        '...kaaaakaaak...',
        '...kaaaakaaak...',
        '..kaaaaaaaaaak..',
        '..kzzzzzzzzzzk..',
        '..kkkkkkkkkkkk..',
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
    // ヒマワリオン。ひまわりのたてがみは 半分が 茶色く しおれている。ひびの入った 作り笑いの 仮面と、涙を こらえる 目
    himawarion: [
        '..................................',
        '............kkkBkk................',
        '..........kklllBllkzkk............',
        '.........klBBllllllazBkkk.........',
        '........kllllllllllaazaaa.........',
        '.......kBBllllllBBzazazak.........',
        '.......kllllaaBBBBzZkazzakk.......',
        '......kmkllazkmmmmmmkzzzaak.......',
        '......kllllakmmmmkmmmkazaak.......',
        '......kBlllBkmZZmmZZmkzaaakk......',
        '......kBlllBkmkwmmwkmkzzaazk......',
        '......kllllBkmmmzzmmmkzzaaak......',
        '......kllllBkmkkkkkkmkzzaaazk.....',
        '......kBBlllkmkmkkmkmkzaaaak......',
        '......kBllllkmkkzzkkmkzzaak.......',
        '......kllllBkmmkkkkmmkzzazk.......',
        '.......kBBBllkmmmmmmkaaaaak.......',
        '.......kBBllllkkkkkkzkaaak........',
        '........kzlllllBBBBzaaaaaak.......',
        '........klllBllklllzaazzazk.......',
        '........kzzBBllBlllzaazzzk........',
        '........kazzzlBBlllazazzzak.......',
        '........kaazZzzBzlzakzzzaak.......',
        '.......kaaazzkzzzzzzzzzzaaak......',
        '.......kaaaazkkkzZZzkkzaaaak......',
        '.......kaaazkkkkkkkkkkkaaaak..kk..',
        '......kaaaak.kkk...kkk.kaaaakkk...',
        '......kaaaak..kk...kk..kaaak......',
        '......kaaaak.kkk...kkkkzaaaak.....',
        '..kkkkaaaaakkkkk...kkk.kaaaak.....',
        '..k.kaaaaazkkkk.kkkkkkkzaaaaakkkk.',
        '.kkkkaaaaakkkk......kkkkaaaaaak.k.',
        '....kkzkkkkkk...........kkkkkk....',
        '...kkkk.....kkk............kkk....'
    ],
    nightmare: [
        '..........hhhh..',
        '....kkk..h....h.',
        '...ktttk.h......',
        '..kttwttkh......',
        '..ktwwwtkh......',
        '..kttwttkh......',
        '...ktttkkh......',
        '..kttttttkh.....',
        '.kttttttttkh....',
        '.kttttttttk.h...',
        'kttttttttttk....',
        'kttttttttttk....',
        'kttttttttttk....',
        '.kttttttttk.....',
        '..kt.tt.tk......',
        '..k..kk..k......'
    ],
    // ネムリボシ (ラスボス。望遠鏡と 夜空のような 体)
    nemuriboshi: [
        '......hhhh......',
        '.....hffffh.....',
        '.....hfiifh.....',
        '......hffh......',
        '....ttttttttt...',
        '..tttnntttnnttt.',
        '.ttnyttttttnytt.',
        '.tttttwttwttttt.',
        '.ttnttttttttntt.',
        '.tttttnyntttttt.',
        '..ttyttttttytt..',
        '...tttttttttt...',
        '....ttnttntt....',
        '.....tttttt.....',
        '......tttt......',
        '................'
    ],
    // 心のかけら (淡く 光る 水色の かけら)
    heart: [
        '................',
        '................',
        '.......ff.......',
        '......fooh......',
        '.....foooqh.....',
        '....fooooqqh....',
        '...foooooqqqh...',
        '...fooooqqqqh...',
        '....fooqqqqh....',
        '.....foqqqh.....',
        '......fqqh......',
        '.......hh.......',
        '................',
        '................',
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


// ---- 現実の人 (キャラクター設定資料集「町の人たち」) ------------------------
// 体の型 (H 髪 / S 肌 / E 目 / G 眼鏡 / U シャツ / T 上着 / B 下 / F くつ) に、人ごとの色と 目印を のせる。
// 縦 16 ドット・正面向き。年寄りと子どもは 背を低くする
const BODY = {
    short: [
        '....HHHH....',
        '..HHHHHHHH..',
        '.HHHHHHHHHH.',
        '.HHSSSSSSHH.',
        '.HSEESSEESH.',
        '..SSSSSSSS..',
        '...SSSSSS...',
        '..UUUUUUUU..',
        '.TTTUUUUTTT.',
        '.TTTTUUTTTT.',
        '.STTTTTTTTS.',
        '..TTTTTTTT..',
        '..BBBBBBBB..',
        '..BBB..BBB..',
        '..BBB..BBB..',
        '..FFF..FFF..'
    ],
    long: [
        '....HHHH....',
        '..HHHHHHHH..',
        '.HHHHHHHHHH.',
        'HHHSSSSSSHHH',
        'HHSEESSEESHH',
        'HHSSSSSSSSHH',
        'HH.SSSSSS.HH',
        'HHUUUUUUUUHH',
        'HTTTUUUUTTTH',
        '.TTTTUUTTTT.',
        '.STTTTTTTTS.',
        '..TTTTTTTT..',
        '..BBBBBBBB..',
        '.BBBBBBBBBB.',
        '...SS..SS...',
        '...FF..FF...'
    ],
    skirt: [
        '....HHHH....',
        '..HHHHHHHH..',
        '.HHHHHHHHHH.',
        '.HHSSSSSSHH.',
        '.HSEESSEESH.',
        '..SSSSSSSS..',
        '...SSSSSS...',
        '..UUUUUUUU..',
        '.TTTUUUUTTT.',
        '.TTTTUUTTTT.',
        '.STTTTTTTTS.',
        '..TTTTTTTT..',
        '..BBBBBBBB..',
        '.BBBBBBBBBB.',
        '...SS..SS...',
        '...FF..FF...'
    ],
    old: [
        '............',
        '............',
        '....HHHH....',
        '..HHHHHHHH..',
        '.HHSSSSSSHH.',
        '.HGEGSSGEGH.',
        '..SSSSSSSS..',
        '...SSSSSS...',
        '..UUUUUUUU..',
        '.TTTTTTTTTT.',
        '.STTTTTTTTS.',
        '..TTTTTTTT..',
        '..TTTTTTTT..',
        '..BBBBBBBB..',
        '...BB..BB...',
        '...FF..FF...'
    ],
    child: [
        '............',
        '............',
        '............',
        '....HHHH....',
        '..HHHHHHHH..',
        '.HHSSSSSSHH.',
        '.HSEESSEESH.',
        '..SSSSSSSS..',
        '..TTTTTTTT..',
        '.TTTTTTTTTT.',
        '.STTTTTTTTS.',
        '..BBBBBBBB..',
        '..BBB..BBB..',
        '...SS..SS...',
        '...SS..SS...',
        '...FF..FF...'
    ]
};

// 人ごとの 色。marks: [x, y, 色] の 目印 (リクの黄色いパーカー、ミオの楽譜、カナのリストバンド など)
const PEOPLE = {
    riku: { body: 'short', H: '#8a5a32', T: '#ffd86b', U: '#ffd86b', B: '#2f4a7d', F: '#141428', marks: [[3, 8, '#2f4a7d'], [8, 8, '#2f4a7d']] },
    mio: { body: 'long', H: '#20203a', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428', marks: [[2, 11, '#e8ecf5'], [3, 11, '#e8ecf5'], [2, 10, '#e8ecf5']] },
    kana: { body: 'skirt', H: '#3a2a20', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428', marks: [[10, 10, '#ff8f7a'], [1, 10, '#ff8f7a']] },
    momo: { body: 'skirt', H: '#5c4630', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428', marks: [[8, 1, '#f0b6c8'], [9, 1, '#f0b6c8'], [3, 7, '#f0b6c8'], [4, 7, '#f0b6c8'], [7, 7, '#f0b6c8'], [8, 7, '#f0b6c8']] },
    kaito: { body: 'short', H: '#20203a', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428', marks: [[2, 6, '#e8524a'], [3, 6, '#e8524a'], [8, 6, '#e8524a'], [9, 6, '#e8524a'], [2, 7, '#e8524a'], [9, 7, '#e8524a']] },
    student: { body: 'short', H: '#3a2a20', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428' },
    sora: { body: 'skirt', H: '#5c4630', T: '#e8ecf5', U: '#e8ecf5', B: '#22365e', F: '#141428', marks: [[3, 9, '#6fb0ff'], [7, 10, '#ff8f7a'], [5, 11, '#ffd86b']] },
    aki: { body: 'short', H: '#3a2a20', T: '#2f7d5a', U: '#2f7d5a', B: '#2f7d5a', F: '#e8ecf5', marks: [[1, 0, '#3a2a20'], [10, 1, '#3a2a20'], [9, 10, '#e8524a']] },
    tome: { body: 'old', H: '#c6c9ea', T: '#e8ecf5', U: '#e8ecf5', B: '#59509a', F: '#5c4630' },
    ken: { body: 'child', H: '#20203a', T: '#6fb0ff', U: '#6fb0ff', B: '#8a6a4a', F: '#e8ecf5', marks: [[3, 11, '#5c4630'], [8, 11, '#5c4630']] },
    father: { body: 'short', H: '#20203a', T: '#e8ecf5', U: '#e8ecf5', B: '#3a3a50', F: '#141428', marks: [[5, 8, '#59509a'], [6, 8, '#59509a'], [5, 9, '#59509a'], [6, 9, '#59509a'], [5, 10, '#59509a']] },
    commuterA: { body: 'skirt', H: '#3a2a20', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428', marks: [[2, 7, '#8fe0a0'], [9, 7, '#8fe0a0']] },
    commuterB: { body: 'short', H: '#5c4630', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428', marks: [[1, 11, '#8a6a4a'], [1, 12, '#8a6a4a']] },
    commuterC: { body: 'short', H: '#20203a', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428', marks: [[4, 4, '#c6c9ea'], [7, 4, '#c6c9ea']] },
    commuterD: { body: 'long', H: '#8a5a32', T: '#2f4a7d', U: '#e8ecf5', B: '#22365e', F: '#141428' },
    rikuFather: { body: 'short', H: '#5c4630', T: '#4a5a6a', U: '#e8ecf5', B: '#3a3a50', F: '#141428' }
};

function personArt(id) {
    const look = PEOPLE[id];
    const colors = { S: PALETTE.s, E: PALETTE.e, G: '#c6c9ea', ...look };
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    BODY[look.body].forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        ctx.fillStyle = colors[ch];
        ctx.fillRect(x, y, 1, 1);
    }));
    for (const [x, y, color] of look.marks ?? []) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
}

export const PERSON_IDS = Object.keys(PEOPLE);

// ハルの部屋の キャンバス (イーゼルに 白い布) と ベッド
const ROOM_ART = {
    canvas: [
        '................',
        '.......aa.......',
        '..kkkkkkkkkkkk..',
        '..kmmmmmmmmmmk..',
        '..kmmmmmmmmmmk..',
        '..kmmmmmmmmmmk..',
        '..kmmmmmmmmmmk..',
        '..kmmmmmmmmmmk..',
        '..kmmmmmmmmmmk..',
        '..kkkkkkkkkkkk..',
        '....a......a....',
        '...a...aa...a...',
        '...a...aa...a...',
        '..a....aa....a..',
        '..a....aa....a..',
        '................'
    ],
    bed: [
        '................',
        'kkkkkkkkkkkkkkkk',
        'kmmmmmkuuuuuuuuk',
        'kmmmmmkuuuuuuuuk',
        'kmmmmmkuuuuuuuuk',
        'kkkkkkkuuuuuuuuk',
        'kuuuuuuuuuuuuuuk',
        'kuuuuuuuuuuuuuuk',
        'kuuuuuuuuuuuuuuk',
        'kuuuuuuuuuuuuuuk',
        'kkkkkkkkkkkkkkkk',
        'kaaaaaaaaaaaaaak',
        'ka............ak',
        '................',
        '................',
        '................'
    ]
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

// 喰らうほど 毛布は黒ずみ、目が赤くなる
// 怒りの鳥: 青を 赤に 塗り替えて、左右を 反転 (哀しみの鳥と 背中合わせになる)
function angryBirdRows() {
    return ART['bird-ai'].map((row) => [...row].reverse().join('').replaceAll('u', 'r').replaceAll('i', 'j'));
}

// デュエット (地図の上の 姿): 背中合わせの 2 羽
function duetRows() {
    const left = angryBirdRows();
    return ART['bird-ai'].map((row, y) => left[y] + row);
}

function wildRows(rows = ART.bak) {
    return rows.map((row) => row.replaceAll('b', 'k').replaceAll('c', 'g').replaceAll('y', 'r').replaceAll('e', 'r'));
}

export function sprite(name) {
    if (cache.has(name)) return cache.get(name);
    let canvas;
    if (name.startsWith('omote-')) canvas = maskArt(name.slice(6));
    else if (name === 'muresuima') canvas = schoolArt(64);
    else if (name === 'muresuima-map') canvas = schoolArt(32);
    else if (name === 'bak-wild') canvas = paint(wildRows());
    else if (name === 'bak-mini-wild') canvas = paint(wildRows(ART['bak-mini']));
    else if (name === 'bird-do') canvas = paint(angryBirdRows());
    else if (name === 'duet') canvas = paint(duetRows());
    else if (PEOPLE[name]) canvas = personArt(name);
    else if (ROOM_ART[name]) canvas = paint(ROOM_ART[name]);
    else canvas = paint(ART[name]);
    cache.set(name, canvas);
    return canvas;
}
