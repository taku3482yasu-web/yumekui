import { affinity, damage } from './rules.js';

// バトルの中身。画面を持たず、act / answer が 出来事の配列を返す
// 敵は 複数でもよい (b.foes。段階1「敵複数」)。b.foe は ねらっている 敵 (setTarget で 変える)。
//   b.chance / b.exhausted / b.step / b.foeSleep は、ねらっている 敵の 値 (1 体のときは 前と 同じ)
// 敵の 番では、立っている 敵が 順に 1 回ずつ 行動する。全員 倒すと 勝ち
// partnerRage: その敵の 相方が 倒れる (本音の敵は 体力が尽きる) と、残った敵の 攻撃が rage 倍 (デュエット)
const SKILL_WAIT = 3;
const SHAKE_HIT = 0.85;
const SHAKE_POWER = 34;
const WRONG_ATK = 1.2;
const PARTNER_RAGE = 1.5;

function makeFoe(foe, index) {
    return { ...foe, kokoro: 0, index, step: 0, asleep: false, chance: false, exhausted: false, down: false };
}

export function createBattle(allies, foes, { rng = Math.random } = {}) {
    const party = (Array.isArray(allies) ? allies : [allies]).map((unit) => ({ ...unit, wait: 0 }));
    const list = (Array.isArray(foes) ? foes : [foes]).map(makeFoe);
    return {
        party,
        ally: party[0],
        foes: list,
        foe: list[0],
        rng,
        guarding: false,
        rush: false,
        over: null,
        get chance() { return this.foe.chance; },
        set chance(value) { this.foe.chance = value; },
        get exhausted() { return this.foe.exhausted; },
        set exhausted(value) { this.foe.exhausted = value; },
        get step() { return this.foe.step; },
        set step(value) { this.foe.step = value; },
        get foeSleep() { return this.foe.asleep; },
        set foeSleep(value) { this.foe.asleep = value; }
    };
}

// 立っている 敵
export function aliveFoes(b) {
    return b.foes.filter((foe) => !foe.down);
}

// ねらう 敵を 変える (倒れた 敵は ねらえない)
export function setTarget(b, foe) {
    if (foe && !foe.down) b.foe = foe;
}

// ねらう 敵を 選ぶ 必要があるか (立っている 敵が 2 体以上)
export function needsTarget(b) {
    return aliveFoes(b).length > 1;
}

export function bench(b) {
    return b.party.filter((unit) => unit !== b.ally && unit.hp > 0);
}

export function commands(b) {
    const { moves, wait } = b.ally;
    const list = [{ id: 'attack', label: moves.attack }];
    if (aliveFoes(b).some((foe) => foe.truth)) list.push({ id: 'shake', label: 'ココロ攻撃' });
    if (moves.heal) list.push({ id: 'heal', label: moves.heal, disabled: wait > 0 });
    if (moves.skill) list.push({ id: moves.skill.id, label: moves.skill.label, disabled: wait > 0 });
    for (const skill of moves.extra ?? []) list.push({ ...skill, disabled: wait > 0 });
    list.push({ id: 'guard', label: 'まもる' });
    if (bench(b).length) list.push({ id: 'swap', label: '交代' });
    if (aliveFoes(b).some((foe) => foe.exhausted && foe.dream)) list.unshift({ id: 'devour', label: 'バクに喰らわせる' });
    if (aliveFoes(b).some((foe) => foe.chance)) list.unshift({ id: 'truth', label: '本音を言い当てる' });
    return list;
}

// 敵を ねらう 技 (複数のときは だれを ねらうか 選ぶ)
export const TARGETED = ['attack', 'shake', 'sleep', 'softword', 'bite', 'gorge'];

// 本音を 言い当てる・喰らう 相手 (チャンスの 敵 / 体力が 尽きた 夢主の 敵)
export function chanceFoe(b) {
    return aliveFoes(b).find((foe) => foe.chance) ?? null;
}

export function act(b, id, target = null) {
    const events = [];
    b.guarding = false;
    if (b.ally.wait > 0) b.ally.wait--;
    if (id === 'attack') attack(b, events);
    if (id === 'shake') shake(b, events);
    if (id === 'heal') heal(b, events);
    if (id === 'sleep') sleep(b, events);
    if (id === 'rush') rush(b, events);
    if (id === 'shield') shield(b, events);
    if (id === 'softword') softword(b, events);
    if (id === 'bite') fierce(b, events, 170, 'bite');
    if (id === 'gorge') fierce(b, events, 120, 'gorge');
    if (id === 'devour') {
        b.over = 'devour';
        events.push({ t: 'end', result: 'devour' });
    }
    if (id === 'swap') swapTo(b, target, events);
    if (id === 'guard') {
        b.guarding = true;
        events.push({ t: 'say', text: `${b.ally.name}は 身を守っている。` });
    }
    if (!b.over) foesTurn(b, events);
    return events;
}

// 本音を 言い当てる (チャンスの 敵に)。複数の 本音が いる敵 (デュエット) は、全員 言い当てると 勝ち
export function answer(b, choice) {
    const events = [];
    const foe = chanceFoe(b) ?? b.foe;
    b.foe = foe;
    if (choice === foe.truth.answer) {
        foe.chance = false;
        foe.solved = true;
        foe.down = true;
        events.push({ t: 'solved', index: foe.index, name: foe.name });
        if (b.foes.every((f) => f.down) || b.foes.filter((f) => f.truth).every((f) => f.solved)) {
            b.over = 'truth';
            events.push({ t: 'end', result: 'truth' });
            return events;
        }
        retarget(b);
        foesTurn(b, events);
        return events;
    }
    foe.chance = false;
    foe.kokoro = 50;
    foe.atk = Math.round(foe.atk * WRONG_ATK);
    events.push({ t: 'say', text: `その言葉は 届かなかった。${foe.name}の力が 増した！` });
    foesTurn(b, events);
    return events;
}

function attack(b, events) {
    const times = b.rush ? 2 : 1;
    b.rush = false;
    for (let i = 0; i < times && !b.over && !b.foe.down; i++) {
        const amount = damage(b.ally, b.foe, 100, b.rng);
        events.push({ t: 'say', text: `${b.ally.name}の ${b.ally.moves.attack}！` });
        events.push({ t: 'hit', target: 'foe', index: b.foe.index, amount, aff: affinity(b.ally.attr, b.foe.attr) });
        hurtFoe(b, b.foe, amount, events);
    }
}

function shake(b, events, rate = 1) {
    const foe = b.foe;
    events.push({ t: 'say', text: `${b.ally.name}の ココロ攻撃！` });
    if (!foe.truth) {
        events.push({ t: 'say', text: `${foe.name}には、揺らす気持ちが ないようだ。` });
        return;
    }
    if (b.rng() >= SHAKE_HIT) {
        events.push({ t: 'say', text: 'しかし 気持ちは 揺れなかった。' });
        return;
    }
    const gain = Math.round((SHAKE_POWER + (b.ally.kokoro ?? 0)) * rate * affinity(b.ally.attr, foe.attr));
    foe.kokoro = Math.min(100, foe.kokoro + gain);
    events.push({ t: 'shake', index: foe.index, gain, kokoro: foe.kokoro });
    if (foe.kokoro >= 100) openChance(b, foe, events);
}

function shield(b, events) {
    b.ally.def = Math.round(b.ally.def * 1.5);
    b.ally.wait = SKILL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}は 毛布にくるまった。防御が 上がった！` });
}

function softword(b, events) {
    b.ally.wait = SKILL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}は 言葉をそえた。` });
    shake(b, events, 2);
}

// 凶暴なスキル。かみくだくは 自分も傷つき、むさぼるは 体力を奪う
function fierce(b, events, power, kind) {
    b.ally.wait = SKILL_WAIT;
    const foe = b.foe;
    const amount = damage(b.ally, foe, power, b.rng);
    const label = kind === 'bite' ? 'かみくだく' : 'むさぼる';
    events.push({ t: 'say', text: `${b.ally.name}の ${label}！` });
    events.push({ t: 'hit', target: 'foe', index: foe.index, amount, aff: affinity(b.ally.attr, foe.attr) });
    if (kind === 'bite') {
        const recoil = Math.round(b.ally.maxHp * 0.1);
        b.ally.hp = Math.max(1, b.ally.hp - recoil);
        events.push({ t: 'say', text: `${b.ally.name}も 傷ついた。` });
    } else {
        const gain = Math.min(b.ally.maxHp - b.ally.hp, Math.round(amount / 2));
        b.ally.hp += gain;
        events.push({ t: 'heal', target: 'ally', amount: gain });
    }
    hurtFoe(b, foe, amount, events);
}

function heal(b, events) {
    const amount = Math.min(b.ally.maxHp - b.ally.hp, Math.round(b.ally.maxHp * 0.4));
    b.ally.hp += amount;
    b.ally.wait = SKILL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}は 悪夢を食べた。` });
    events.push({ t: 'heal', target: 'ally', amount });
}

function sleep(b, events) {
    b.foe.asleep = true;
    b.ally.wait = SKILL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}の ${b.ally.moves.skill.label}！ ${b.foe.name}は 眠りに落ちた。` });
}

function rush(b, events) {
    b.rush = true;
    b.ally.wait = SKILL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}の ${b.ally.moves.skill.label}！ 次の攻撃は 2回になる。` });
}

function swapTo(b, unit, events) {
    b.ally = unit;
    b.rush = false;
    events.push({ t: 'swap', sprite: unit.sprite });
    events.push({ t: 'say', text: `${unit.name}が 前に出た！` });
}

function hurtFoe(b, foe, amount, events) {
    foe.hp -= amount;
    if (foe.hp > 0) return;
    if (foe.truth) {
        // 本音を持つ相手は、言い当てるまで 消えない
        const first = !foe.exhausted;
        foe.hp = 1;
        foe.kokoro = 100;
        foe.exhausted = true;
        openChance(b, foe, events);
        if (first) partnerRage(b, foe, events);
        return;
    }
    foe.hp = 0;
    foe.down = true;
    events.push({ t: 'down', index: foe.index, name: foe.name });
    partnerRage(b, foe, events);
    if (aliveFoes(b).length === 0) {
        b.over = 'win';
        events.push({ t: 'end', result: 'win' });
        return;
    }
    retarget(b);
}

// 相方が 倒れる (体力が 尽きる) と、残った 敵が 怒る
function partnerRage(b, fallen, events) {
    for (const foe of aliveFoes(b)) {
        if (foe === fallen || !foe.partnerRage || foe.raged) continue;
        foe.raged = true;
        foe.atk = Math.round(foe.atk * PARTNER_RAGE);
        events.push({ t: 'rage', index: foe.index });
        events.push({ t: 'say', text: foe.rageText ?? `${foe.name}が 怒った！ 攻撃が 上がった！` });
    }
}

// ねらっている 敵が 倒れたら、立っている 敵へ ねらいを 移す
function retarget(b) {
    if (b.foe.down) b.foe = aliveFoes(b)[0] ?? b.foe;
}

function openChance(b, foe, events) {
    if (foe.chance) return;
    foe.chance = true;
    events.push({ t: 'chance', index: foe.index, name: foe.name });
}

function foesTurn(b, events) {
    for (const foe of aliveFoes(b)) {
        if (b.over) return;
        foeTurn(b, foe, events);
    }
}

function foeTurn(b, foe, events) {
    if (foe.asleep) {
        foe.asleep = false;
        events.push({ t: 'say', text: `${foe.name}は 眠っている。` });
        return;
    }
    const pattern = foe.pattern ?? ['tackle'];
    const move = pattern[foe.step % pattern.length];
    foe.step++;
    if (move === 'charge') {
        events.push({ t: 'say', text: foe.chargeText ?? `${foe.name}が 大きく うずを巻きはじめた……！` });
        return;
    }
    const big = move === 'swirl';
    const name = big ? (foe.bigMove ?? '群れの大渦') : '体当たり';
    events.push({ t: 'say', text: `${foe.name}の ${name}！` });
    const raw = damage(foe, b.ally, big ? 180 : 100, b.rng);
    const amount = b.guarding ? Math.max(1, Math.round(raw / 3)) : raw;
    b.ally.hp = Math.max(0, b.ally.hp - amount);
    events.push({ t: 'hit', target: 'ally', from: foe.index, amount, aff: affinity(foe.attr, b.ally.attr) });
    if (b.ally.hp > 0) return;
    const next = bench(b)[0];
    if (next) {
        events.push({ t: 'say', text: `${b.ally.name}は 倒れた。` });
        swapTo(b, next, events);
        return;
    }
    b.over = 'lose';
    events.push({ t: 'end', result: 'lose' });
}
