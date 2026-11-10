// 心のかけら (企画書「心のかけら」・2026-11-10 ユーザー指定)。夢の中や 絆イベントで 手に入る。ループしても なくならない。
//   exp: 持たせた ユメクイの 経験値が 1.5 倍 / move: 本来 覚えない 技を 覚えさせる (技の id は battle.js の GROWTH_MOVES)
export const HEART_EXP_RATE = 1.5;

export const HEARTS = {
    heartMio: { label: 'しずくの心のかけら', kind: 'exp', info: '持たせた ユメクイの 経験値が 1.5 倍' },
    heartKana: { label: 'きざみの心のかけら', kind: 'exp', info: '持たせた ユメクイの 経験値が 1.5 倍' },
    heartDuet: { label: 'ふたごの心のかけら', kind: 'exp', info: '持たせた ユメクイの 経験値が 1.5 倍' },
    heartDispel: { label: 'あたたかい心のかけら', kind: 'move', move: 'dispel', moveLabel: '悪夢ばらい', info: '「悪夢ばらい」(味方全員を 30% 回復) を 覚えさせる' },
    heartDrowsy: { label: 'まどろむ心のかけら', kind: 'move', move: 'drowsy', moveLabel: 'ねぼけまなこ', info: '「ねぼけまなこ」(相手の 攻撃を 3 ターン 下げる) を 覚えさせる' }
};
