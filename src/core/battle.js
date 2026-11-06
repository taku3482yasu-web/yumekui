import { affinity, damage } from './rules.js';

// バトルの中身。画面を持たず、act / answer が 出来事の配列を返す
const HEAL_WAIT = 3;
const SHAKE_HIT = 0.85;
const SHAKE_POWER = 34;
const WRONG_ATK = 1.2;

export function createBattle(ally, foe, { rng = Math.random } = {}) {
    return {
        ally: { ...ally },
        foe: { ...foe, kokoro: 0 },
        rng,
        step: 0,
        healWait: 0,
        guarding: false,
        chance: false,
        over: null
    };
}

export function commands(b) {
    const list = [{ id: 'attack', label: b.ally.moves.attack }];
    if (b.foe.truth) list.push({ id: 'shake', label: 'ココロ攻撃' });
    list.push({ id: 'heal', label: b.ally.moves.heal, disabled: b.healWait > 0 });
    list.push({ id: 'guard', label: 'まもる' });
    if (b.chance) list.unshift({ id: 'truth', label: '本音を言い当てる' });
    return list;
}

export function act(b, id) {
    const events = [];
    b.guarding = false;
    if (b.healWait > 0) b.healWait--;
    if (id === 'attack') attack(b, events);
    if (id === 'shake') shake(b, events);
    if (id === 'heal') heal(b, events);
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
    const amount = damage(b.ally, b.foe, 100, b.rng);
    const aff = affinity(b.ally.attr, b.foe.attr);
    events.push({ t: 'say', text: `${b.ally.name}の ${b.ally.moves.attack}！` });
    events.push({ t: 'hit', target: 'foe', amount, aff });
    hurtFoe(b, amount, events);
}

function shake(b, events) {
    events.push({ t: 'say', text: `${b.ally.name}の ココロ攻撃！` });
    if (b.rng() >= SHAKE_HIT) {
        events.push({ t: 'say', text: 'しかし 気持ちは 揺れなかった。' });
        return;
    }
    const gain = Math.round(SHAKE_POWER * affinity(b.ally.attr, b.foe.attr));
    b.foe.kokoro = Math.min(100, b.foe.kokoro + gain);
    events.push({ t: 'shake', gain, kokoro: b.foe.kokoro });
    if (b.foe.kokoro >= 100) openChance(b, events);
}

function heal(b, events) {
    const amount = Math.min(b.ally.maxHp - b.ally.hp, Math.round(b.ally.maxHp * 0.4));
    b.ally.hp += amount;
    b.healWait = HEAL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}は 悪夢を食べた。` });
    events.push({ t: 'heal', target: 'ally', amount });
}

function hurtFoe(b, amount, events) {
    b.foe.hp -= amount;
    if (b.foe.hp > 0) return;
    if (b.foe.truth) {
        // 本音を持つ相手は、言い当てるまで 消えない
        b.foe.hp = 1;
        b.foe.kokoro = 100;
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
    const pattern = b.foe.pattern ?? ['tackle'];
    const move = pattern[b.step % pattern.length];
    b.step++;
    if (move === 'charge') {
        events.push({ t: 'say', text: `${b.foe.name}が 大きく うずを巻きはじめた……！` });
        return;
    }
    const big = move === 'swirl';
    events.push({ t: 'say', text: big ? `${b.foe.name}の 群れの大渦！` : `${b.foe.name}の 体当たり！` });
    const raw = damage(b.foe, b.ally, big ? 180 : 100, b.rng);
    const amount = b.guarding ? Math.max(1, Math.round(raw / 3)) : raw;
    b.ally.hp = Math.max(0, b.ally.hp - amount);
    events.push({ t: 'hit', target: 'ally', amount, aff: affinity(b.foe.attr, b.ally.attr) });
    if (b.ally.hp === 0) {
        b.over = 'lose';
        events.push({ t: 'end', result: 'lose' });
    }
}
