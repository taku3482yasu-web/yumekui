// 言えなかった 言葉の かけら (仕様書「夢の階層と言葉」)。夢の中の 吹き出しや、夢主を 訪ねて 聞く。
//   part: front = 前 (だれと・何を) / back = 後ろ (どうしたい・どうだった)
//   owner: その言葉を 飲み込んでいた人 (hal / mio / kana)。夢合わせは 同じ人の 言葉どうしで つなぐ
// まちがいの 言葉 (やめたかった・くやしかった) も 拾える。どれを つなぐかで、本音の 文が 変わる
export const WORDS = {
    'ほんとは': { part: 'front', owner: 'hal' },
    '自分で': { part: 'front', owner: 'hal' },
    '決めたかった': { part: 'back', owner: 'hal' },
    '一緒に': { part: 'front', owner: 'mio' },
    '吹きたかった': { part: 'back', owner: 'mio' },
    'やめたかった': { part: 'back', owner: 'mio' },
    '一人で': { part: 'front', owner: 'mio' },           // まちがい (独奏の女王ミオが 落とす)
    '相談して': { part: 'front', owner: 'kana' },
    'ほしかった': { part: 'back', owner: 'kana' },
    'くやしかった': { part: 'back', owner: 'kana' },
    '勝ちたかった': { part: 'back', owner: 'kana' }      // まちがい (審査員カナが 落とす。企画書の 例)
};

export const OWNER_NAMES = { hal: 'ハル', mio: 'ミオ', kana: 'カナ' };
