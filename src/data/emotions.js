// 夢感情の 数値と 技 (仕様書「夢感情」・技一覧「感情技と夢変わり」の 最初の案)
export const EMOTIONS = ['喜', '怒', '哀', '楽'];

// 技の 中身は battle.js の 汎用の 効果 (power / hits / healAll / foeAtkDown / selfDefDown / partyAtkUp / kokoroUp / dodge / sleep / cure / revive / drain)
export const EMOTION_MOVES = {
    喜: { id: 'emo:喜', label: 'はずむ心', kokoroUp: 3 },
    怒: { id: 'emo:怒', label: 'いかりの火', power: 150, selfDefDown: 0.1 },
    哀: { id: 'emo:哀', label: 'なみだの雨', healAll: 0.2, foeAtkDown: 0.1 },
    楽: { id: 'emo:楽', label: 'ゆらゆら気分', dodge: { rate: 0.4, turns: 2 } }
};

// 夢変わりで 名前の 頭に つく 言葉
export const PREFIX = { 喜: 'ハレ', 怒: 'アラ', 哀: 'シズク', 楽: 'ユラ' };

// 小規模版で 作る 夢変わりの 姿 (ほかの 組み合わせは まだ ないので、その感情は 99 で 止まる)
export const REBORN = {
    bak: {
        喜: { label: 'あさのひかり', cure: true, kokoroUp: 3 },
        怒: { label: 'あくむの牙', power: 200, drain: 0.5 },
        哀: { label: 'ねむりの雨', sleep: true, healAll: 0.15 }
    },
    gakufume: {
        怒: { label: '燃える大合奏', power: 170, foeDefDown: 0.15 },
        喜: { label: 'さくらのソロ', kokoroUp: 1, kokoroRate: 2 }
    },
    togemetoro: {
        哀: { label: 'ラルゴ', slow: 3 },
        楽: { label: 'スウィング', power: 70, hits: 3 }
    }
};

// 夢昇華 (本来と 同じ 感情が 100): 名前・技。全ステータス ＋15%
export const SUBLIME = {
    bak: { name: 'ヨミバク', label: '夢先案内', partyAtkUp: 0.2, partyDefUp: 0.2 },
    gakufume: { name: 'フィナーレ', label: '最終楽章', power: 200, sleep: true },
    togemetoro: { name: 'プレスト', label: 'ダブルテンポ', rushTurns: 3 }
};
export const SUBLIME_RATE = 1.15;

// 夢現 (夢変わり・夢昇華の あと 感情が 200): バトルで 1 度だけ。威力は 攻撃と ココロ値の 高いほう
export const YUMEUTSUTSU = {
    bak: { label: '千夜の夢喰い', power: 300, stealBuffs: true },
    gakufume: { label: '終わらない協奏曲', power: 280, partyAtkUp: 0.3 },
    togemetoro: { label: '無限拍子', power: 60, hits: 6 }
};

// たまり方
export const GAIN = { minion: 2, boss: 10, pairBoss: 8, finisher: 2, saved: 5, eaten: 10 };
