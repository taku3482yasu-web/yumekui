import { affinity, damage } from './rules.js';

// バトルの中身。画面を持たず、act / answer が 出来事の配列を返す
const SKILL_WAIT = 3;
const SHAKE_HIT = 0.85;
const SHAKE_POWER = 34;
const WRONG_ATK = 1.2;

export function createBattle(allies, foe, { rng = Math.random } = {}) {
    const party = (Array.isArray(allies) ? allies : [allies]).map((unit) => ({ ...unit, wait: 0 }));
    return {
        party,
        ally: party[0],
        foe: { ...foe, kokoro: 0 },
        rng,
        step: 0,
        guarding: false,
        foeSleep: false,
        rush: false,
        chance: false,
        exhausted: false,
        over: null
    };
}

export function bench(b) {
    return b.party.filter((unit) => unit !== b.ally && unit.hp > 0);
}

export function commands(b) {
    const { moves, wait } = b.ally;
    const list = [{ id: 'attack', label: moves.attack }];
    if (b.foe.truth) list.push({ id: 'shake', label: 'ココロ攻撃' });
    if (moves.heal) list.push({ id: 'heal', label: moves.heal, disabled: wait > 0 });
    if (moves.skill) list.push({ id: moves.skill.id, label: moves.skill.label, disabled: wait > 0 });
    for (const skill of moves.extra ?? []) list.push({ ...skill, disabled: wait > 0 });
    list.push({ id: 'guard', label: 'まもる' });
    if (bench(b).length) list.push({ id: 'swap', label: '交代' });
    if (b.exhausted && b.foe.dream) list.unshift({ id: 'devour', label: 'バクに喰らわせる' });
    if (b.chance) list.unshift({ id: 'truth', label: '本音を言い当てる' });
    return list;
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
    if (!b.over) foeTurn(b, events);
    return events;
}

export function answer(b, choice) {
    const events = [];
    if (choice === b.foe.truth.answer) {
        b.over = 'truth';
        events.push({ t: 'end', result: 'truth' });
        return events;
    }
    b.chance = false;
    b.foe.kokoro = 50;
    b.foe.atk = Math.round(b.foe.atk * WRONG_ATK);
    events.push({ t: 'say', text: `その言葉は 届かなかった。${b.foe.name}の力が 増した！` });
    foeTurn(b, events);
    return events;
}

function attack(b, events) {
    const times = b.rush ? 2 : 1;
    b.rush = false;
    for (let i = 0; i < times && !b.over; i++) {
        const amount = damage(b.ally, b.foe, 100, b.rng);
        events.push({ t: 'say', text: `${b.ally.name}の ${b.ally.moves.attack}！` });
        events.push({ t: 'hit', target: 'foe', amount, aff: affinity(b.ally.attr, b.foe.attr) });
        hurtFoe(b, amount, events);
    }
}

function shake(b, events, rate = 1) {
    events.push({ t: 'say', text: `${b.ally.name}の ココロ攻撃！` });
    if (b.rng() >= SHAKE_HIT) {
        events.push({ t: 'say', text: 'しかし 気持ちは 揺れなかった。' });
        return;
    }
    const gain = Math.round((SHAKE_POWER + (b.ally.kokoro ?? 0)) * rate * affinity(b.ally.attr, b.foe.attr));
    b.foe.kokoro = Math.min(100, b.foe.kokoro + gain);
    events.push({ t: 'shake', gain, kokoro: b.foe.kokoro });
    if (b.foe.kokoro >= 100) openChance(b, events);
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
    const amount = damage(b.ally, b.foe, power, b.rng);
    const label = kind === 'bite' ? 'かみくだく' : 'むさぼる';
    events.push({ t: 'say', text: `${b.ally.name}の ${label}！` });
    events.push({ t: 'hit', target: 'foe', amount, aff: affinity(b.ally.attr, b.foe.attr) });
    if (kind === 'bite') {
        const recoil = Math.round(b.ally.maxHp * 0.1);
        b.ally.hp = Math.max(1, b.ally.hp - recoil);
        events.push({ t: 'say', text: `${b.ally.name}も 傷ついた。` });
    } else {
        const gain = Math.min(b.ally.maxHp - b.ally.hp, Math.round(amount / 2));
        b.ally.hp += gain;
        events.push({ t: 'heal', target: 'ally', amount: gain });
    }
    hurtFoe(b, amount, events);
}

function heal(b, events) {
    const amount = Math.min(b.ally.maxHp - b.ally.hp, Math.round(b.ally.maxHp * 0.4));
    b.ally.hp += amount;
    b.ally.wait = SKILL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}は 悪夢を食べた。` });
    events.push({ t: 'heal', target: 'ally', amount });
}

function sleep(b, events) {
    b.foeSleep = true;
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

function hurtFoe(b, amount, events) {
    b.foe.hp -= amount;
    if (b.foe.hp > 0) return;
    if (b.foe.truth) {
        // 本音を持つ相手は、言い当てるまで 消えない
        b.foe.hp = 1;
        b.foe.kokoro = 100;
        b.exhausted = true;
        openChance(b, events);
        return;
    }
    b.foe.hp = 0;
    b.over = 'win';
    events.push({ t: 'end', result: 'win' });
}

function openChance(b, events) {
    if (b.chance) return;
    b.chance = true;
    events.push({ t: 'chance' });
}

function foeTurn(b, events) {
    if (b.foeSleep) {
        b.foeSleep = false;
        events.push({ t: 'say', text: `${b.foe.name}は 眠っている。` });
        return;
    }
    const pattern = b.foe.pattern ?? ['tackle'];
    const move = pattern[b.step % pattern.length];
    b.step++;
    if (move === 'charge') {
        events.push({ t: 'say', text: b.foe.chargeText ?? `${b.foe.name}が 大きく うずを巻きはじめた……！` });
        return;
    }
    const big = move === 'swirl';
    const name = big ? (b.foe.bigMove ?? '群れの大渦') : '体当たり';
    events.push({ t: 'say', text: `${b.foe.name}の ${name}！` });
    const raw = damage(b.foe, b.ally, big ? 180 : 100, b.rng);
    const amount = b.guarding ? Math.max(1, Math.round(raw / 3)) : raw;
    b.ally.hp = Math.max(0, b.ally.hp - amount);
    events.push({ t: 'hit', target: 'ally', amount, aff: affinity(b.foe.attr, b.ally.attr) });
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
