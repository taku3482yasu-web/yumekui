import { EMOTIONS, EMOTION_MOVES, GAIN, PREFIX, REBORN, SUBLIME, SUBLIME_RATE, YUMEUTSUTSU } from '../data/emotions.js';

// 夢感情 (仕様書「夢感情」)。すべての ユメクイが 喜・怒・哀・楽 の ポイント (各 0〜100) を 持つ。
//   keep.emotions[id] = { 喜, 怒, 哀, 楽 }、keep.reborn[id] = { kind: 'change' | 'sublime', attr, point }。ループしても 残る
//   いちばん高い 感情が 30 / 60 / 80 / 100 を こえると、傾き・感情技・気まぐれ・夢変わり (夢昇華) が 起きる

export function emotionsOf(keep, id) {
    keep.emotions ??= {};
    keep.emotions[id] ??= { 喜: 0, 怒: 0, 哀: 0, 楽: 0 };
    return keep.emotions[id];
}

export function rebornOf(keep, id) {
    return keep.reborn?.[id] ?? null;
}

// いちばん高い 感情 (同じ点なら 本来の 属性を 優先)。夢変わり・夢昇華の あとは 1 本だけ
export function topEmotion(keep, id, native) {
    const done = rebornOf(keep, id);
    if (done) return { attr: done.attr, value: done.point };
    const e = emotionsOf(keep, id);
    let best = { attr: native, value: e[native] ?? 0 };
    for (const attr of EMOTIONS) if (e[attr] > best.value) best = { attr, value: e[attr] };
    return best;
}

// その 感情で 夢変わり・夢昇華 できるか (小規模版で 姿が 決まっている ものだけ)
export function hasForm(id, attr, native) {
    return attr === native ? Boolean(SUBLIME[id]) : Boolean(REBORN[id]?.[attr]);
}

export function addEmotion(keep, id, native, attr, amount) {
    const done = rebornOf(keep, id);
    if (done) {
        done.point = Math.min(200, done.point + amount);   // あとは 感情が 1 本になり、どの 属性でも そこに 入る
        return;
    }
    const e = emotionsOf(keep, id);
    const cap = hasForm(id, attr, native) ? 100 : 99;
    e[attr] = Math.min(cap, e[attr] + amount);
}

// バトルの あと。倒した 敵の 属性の 感情に 入る (雑魚 ＋2、ボス ＋10、合体ボスは 2 つの 属性に ＋8)。
//   パーティの 3 体に 入り、とどめを 刺した ユメクイは 2 倍。result: 'win' | 'truth' | 'devour'
export function gainEmotions(keep, party, foes, result) {
    const pair = foes.filter((f) => f.truth).length >= 2;
    for (const foe of foes) {
        const amount = !foe.truth ? GAIN.minion : pair ? GAIN.pairBoss : GAIN.boss;
        for (const unit of party) {
            const rate = foe.finisher === unit.id ? GAIN.finisher : 1;
            addEmotion(keep, unit.id, unit.native ?? unit.attr, foe.attr, amount * rate);
        }
    }
    if (result === 'truth') for (const unit of party) addEmotion(keep, unit.id, unit.native ?? unit.attr, '喜', GAIN.saved);
    const bak = party.find((u) => u.id === 'bak');
    if (result === 'devour' && bak) addEmotion(keep, 'bak', bak.native ?? bak.attr, '怒', GAIN.eaten);
}

// 100 に なって 夢変わり・夢昇華を 待っている ユメクイ
export function pendingReborn(keep, units) {
    const list = [];
    for (const unit of units) {
        if (rebornOf(keep, unit.id)) continue;
        const native = unit.native ?? unit.attr;
        const e = emotionsOf(keep, unit.id);
        const attr = EMOTIONS.find((a) => e[a] >= 100 && hasForm(unit.id, a, native));
        if (attr) list.push({ id: unit.id, attr, sublime: attr === native });
    }
    return list;
}

export function reborn(keep, id, attr, native) {
    keep.reborn ??= {};
    keep.reborn[id] = { kind: attr === native ? 'sublime' : 'change', attr, point: 0 };
    const e = emotionsOf(keep, id);
    for (const a of EMOTIONS) e[a] = 0;
}

// 断ると その 感情は 99 で 止まる (あとで また 選べる)
export function declineReborn(keep, id, attr) {
    emotionsOf(keep, id)[attr] = 99;
}

export function formName(unit, keep) {
    const done = rebornOf(keep, unit.id);
    if (!done) return unit.name;
    return done.kind === 'sublime' ? SUBLIME[unit.id].name : PREFIX[done.attr] + unit.name;
}

// 仲間の ユニットに 夢感情を のせる: 姿・属性・傾き・感情技・夢変わりの技・夢現・気まぐれ
export function applyEmotion(unit, keep) {
    const native = unit.attr;
    const done = rebornOf(keep, unit.id);
    const top = topEmotion(keep, unit.id, native);
    let out = { ...unit, native, name: formName(unit, keep), attr: done ? done.attr : native, emotion: top };
    if (done?.kind === 'sublime') {
        out = { ...out, maxHp: Math.round(out.maxHp * SUBLIME_RATE), hp: Math.round(out.maxHp * SUBLIME_RATE), atk: Math.round(out.atk * SUBLIME_RATE), def: Math.round(out.def * SUBLIME_RATE), spd: Math.round(out.spd * SUBLIME_RATE) };
    }
    // 30 以上で 傾き、60 以上で 2 倍
    const tilt = top.value >= 60 ? 2 : top.value >= 30 ? 1 : 0;
    if (tilt) {
        if (top.attr === '喜') out.kokoroRate = 1 + 0.1 * tilt;
        if (top.attr === '怒') out = { ...out, atk: Math.round(out.atk * (1 + 0.1 * tilt)), def: Math.round(out.def * (1 - 0.05 * tilt)) };
        if (top.attr === '哀') out = { ...out, def: Math.round(out.def * (1 + 0.1 * tilt)), healRate: 1 + 0.1 * tilt };
        if (top.attr === '楽') out.dodge = 0.1 * tilt;
    }
    if (top.value >= 80) out.whim = top.attr;
    const extra = [...(out.moves.extra ?? [])];
    if (!done && top.value >= 60) extra.push({ ...EMOTION_MOVES[top.attr], effect: EMOTION_MOVES[top.attr] });
    if (done) {
        const move = done.kind === 'sublime' ? SUBLIME[unit.id] : REBORN[unit.id][done.attr];
        extra.push({ id: `reborn:${unit.id}`, label: move.label, effect: move });
        if (done.point >= 200 && YUMEUTSUTSU[unit.id]) extra.push({ id: `utsutsu:${unit.id}`, label: `夢現「${YUMEUTSUTSU[unit.id].label}」`, effect: { ...YUMEUTSUTSU[unit.id], once: true, best: true } });
    }
    return { ...out, moves: { ...out.moves, extra } };
}
