import { affinity, damage } from './rules.js';
import { TARGETED_GROWTH } from '../data/growth.js';

// バトルの中身。画面を持たず、act / answer が 出来事の配列を返す
// 敵は 複数でもよい (b.foes。段階1「敵複数」)。b.foe は ねらっている 敵 (setTarget で 変える)。
//   b.chance / b.exhausted / b.step / b.foeSleep は、ねらっている 敵の 値 (1 体のときは 前と 同じ)
// 敵の 番では、立っている 敵が 順に 1 回ずつ 行動する。全員 倒すと 勝ち
// partnerRage: その敵の 相方が 倒れる (本音の敵は 体力が尽きる) と、残った敵の 攻撃が rage 倍 (デュエット)
// after: その敵の 本音は、after の敵に 本音が 届いてから でないと 言い当てられない
// phases: 本音が 届くと 次の 姿に 変わって 立ち上がる (合体ボス デュエット: カナ → ミオの 順)。最後の 本音で 救える
// attrCycle: 行動のたびに 属性が 入れ替わる (二重奏ホールの ムレスイマ: 哀 ↔ 怒)
const SKILL_WAIT = 3;
const SHAKE_HIT = 0.85;
export const SHAKE_POWER = 34;
const WRONG_ATK = 1.2;
const PARTNER_RAGE = 1.5;
const RUN_RATE = 0.75;       // ふつうの 敵から にげられる 確率

// 夢双 (むそう): 相性を 手に入れた 2 体が どちらも パーティにいると 使える 合体の 大技。
//   使った 2 体は そのあと 1 回 休み (息切れ)。属性は 2 体のうち 相手に 有利なほう
export const MUSOU = {
    duet: { label: '夢双「ふたりのアンサンブル」', pair: ['gakufume', 'togemetoro'], power: 220, name: 'デュエット', move: 'ふたりのアンサンブル' }
};

function makeFoe(foe, index) {
    return { ...foe, baseAtk: foe.atk, kokoro: 0, index, step: 0, asleep: false, chance: false, exhausted: false, down: false };
}

// noEscape: にげられない 戦い (チュートリアルの 最初の戦い など)。本音を持つ 敵 (ボス) からも にげられない
// kizuna: キズナ攻撃で 呼べる 仲間 (救った 夢主の 名前)。null なら 出さない、[] なら 使えない (ノーマルの ナイトメア戦)
// dreamEat: ユメクイエンドの ラスボス戦。バクの 専用の 技「夢喰い」で ラスボスを 喰らって 終わる
export function createBattle(allies, foes, { rng = Math.random, noEscape = false, musou = [], kizuna = null, dreamEat = false } = {}) {
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
        noEscape,
        musou,
        kizuna: kizuna ? [...kizuna] : null,
        dreamEat,
        over: null,
        get chance() { return this.foe.chance; },
        set chance(value) { this.foe.chance = value; },
        get exhausted() { return this.foe.exhausted; },
        set exhausted(value) { this.foe.exhausted = value; },
        get step() { return this.foe.step; },
        set step(value) { this.foe.step = value; },
        regen: 0,         // ひだまり毛布: 毎ターン 10% 回復する 残りターン
        boost: 0,         // アンサンブル: 味方全員の 攻撃＋20% (次のターン)
        trueEye: false,   // 夢見の目: ココロ攻撃が 必ず 当たる
        nestle: false,    // よりそう: 本音を 外しても 相手が 強くならない
        joy: 0,           // はずむ心: 味方全員の ココロ攻撃 1.5 倍の 残りターン
        kokoroOnce: 1,    // さくらのソロ: 次の ココロ攻撃 1 回だけ 2 倍
        partyUp: null,    // 味方全員の 攻撃・防御 ＋ (残りターン)
        cheer: false,     // 喜の 気まぐれ: そのターン 味方全員の 攻撃＋10%
        used: new Set(),  // バトルで 1 度だけの 技 (夢現)
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

// いちばん上の コマンド (2026-11-10 ユーザー指定): たたかう / まもる / アイテム / にげる。技は「たたかう」の中 (commands)
export const TOP_COMMANDS = [
    { id: 'fight', label: 'たたかう' },
    { id: 'guard', label: 'まもる' },
    { id: 'item', label: 'アイテム' },
    { id: 'run', label: 'にげる' }
];

// にげられる 戦いか
export function canRun(b) {
    return !b.noEscape && !b.foes.some((foe) => foe.truth);
}

// 「たたかう」の 中の 技。本音を 言い当てる・喰らう は いちばん上に 出る
export function commands(b) {
    const { moves, wait } = b.ally;
    if (b.ally.charging) return [{ id: 'release', label: `${b.ally.charging.label}（はなつ）` }];
    const list = [{ id: 'attack', label: moves.attack }];
    if (aliveFoes(b).some((foe) => foe.truth)) list.push({ id: 'shake', label: 'ココロ攻撃' });
    if (moves.heal) list.push({ id: 'heal', label: moves.heal, disabled: wait > 0 });
    if (moves.skill) list.push({ id: moves.skill.id, label: moves.skill.label, disabled: wait > 0 });
    for (const skill of moves.extra ?? []) list.push({ id: skill.id, label: skill.label, disabled: b.used.has(skill.id) || (wait > 0 && !skill.effect?.once) });
    for (const id of b.musou) {
        const ready = musouPair(b, id);
        if (ready) list.push({ id: `musou:${id}`, label: MUSOU[id].label, disabled: ready.some((u) => u.tired > 0) });
    }
    if (b.kizuna) list.unshift({ id: 'kizuna', label: b.kizuna.length ? `キズナ攻撃（あと${b.kizuna.length}）` : 'キズナ攻撃（つながりが ない）', disabled: !b.kizuna.length });
    if (b.dreamEat && b.ally.id === 'bak') list.unshift({ id: 'dreameat', label: '夢喰い' });
    if (bench(b).length) list.push({ id: 'swap', label: '交代' });
    if (aliveFoes(b).some((foe) => foe.exhausted && foe.dream)) list.unshift({ id: 'devour', label: 'バクに喰らわせる' });
    if (aliveFoes(b).some((foe) => foe.chance)) list.unshift({ id: 'truth', label: '本音を言い当てる' });
    return list;
}

// 敵を ねらう 技 (複数のときは だれを ねらうか 選ぶ)
export const TARGETED = ['attack', 'shake', 'sleep', 'softword', 'bite', 'gorge', 'musou:duet', ...TARGETED_GROWTH];

// 夢双の 2 体が どちらも 元気で パーティに いれば その 2 体
function musouPair(b, id) {
    const units = MUSOU[id].pair.map((ally) => b.party.find((u) => u.id === ally && u.hp > 0));
    return units.every(Boolean) ? units : null;
}

// 本音を 言い当てる・喰らう 相手 (チャンスの 敵 / 体力が 尽きた 夢主の 敵)
export function chanceFoe(b) {
    return aliveFoes(b).find((foe) => foe.chance) ?? null;
}

export function act(b, id, target = null) {
    const events = [];
    b.guarding = false;
    if (b.ally.wait > 0) b.ally.wait--;
    if (b.boost > 0) b.boost--;
    if (b.ally.tempo > 0) b.ally.tempo--;
    if (b.ally.charging && !['swap', 'run', 'guard'].includes(id)) id = 'release';
    if (b.joy > 0) b.joy--;
    if (b.partyUp && --b.partyUp.turns <= 0) b.partyUp = null;
    if (b.ally.dodgeBuff && --b.ally.dodgeBuff.turns <= 0) b.ally.dodgeBuff = null;
    b.cheer = false;
    // 夢感情が 80 を こえると、ときどき 気まぐれな 行動 (仕様書「いちばん高い感情で起きること」)
    if (b.ally.whim && !['swap', 'run', 'release', 'snack'].includes(id) && !id.startsWith('musou:')) {
        const whim = whimOf(b, id, events);
        if (whim === 'play') {
            if (!b.over) foesTurn(b, events);
            return events;
        }
        if (whim === 'twice') {
            act2(b, id, target, events);
        } else if (whim) id = whim;
    }
    if (b.ally.tired > 0 && id !== 'swap' && id !== 'run' && id !== 'snack') {
        // 夢双の あとは 息切れで 1 回 休み
        b.ally.tired--;
        events.push({ t: 'say', text: `${b.ally.name}は 息切れしている……。` });
        if (!b.over) foesTurn(b, events);
        return events;
    }
    if (id.startsWith('musou:')) musou(b, id.slice(6), events);
    if (id === 'attack') attack(b, events);
    if (id === 'shake') shake(b, events);
    if (id === 'heal') heal(b, events);
    if (id === 'snack') snack(b, events);   // アイテム: 駄菓子 (ハルが 渡す。数は 呼ぶ側で 減らす)
    if (id === 'sleep') sleep(b, events);
    if (id === 'rush') rush(b, events);
    if (id === 'shield') shield(b, events);
    if (id === 'softword') softword(b, events);
    if (id === 'bite') fierce(b, events, 170, 'bite');
    if (id === 'gorge') fierce(b, events, 120, 'gorge');
    if (GROWTH_MOVES[id]) GROWTH_MOVES[id](b, events);
    if (id === 'kizuna') kizunaAttack(b, events);
    if (id === 'dreameat') {
        // 夢喰い: ラスボスを 喰らって 戦いが 終わる (実質 勝ちの イベント)
        events.push({ t: 'say', text: `${b.ally.name}の 夢喰い！` });
        events.push({ t: 'say', text: `${b.foe.name}の 夜空が、バクの 口の中へ 吸いこまれていく……。` });
        b.foe.down = true;
        b.over = 'eatBoss';
        events.push({ t: 'end', result: 'eatBoss' });
    }
    const generic = (b.ally.moves.extra ?? []).find((m) => m.id === id && m.effect);
    if (generic) runEffect(b, events, generic);
    if (id === 'devour') {
        b.over = 'devour';
        events.push({ t: 'end', result: 'devour' });
    }
    if (id === 'swap') swapTo(b, target, events);
    if (id === 'guard') {
        b.guarding = true;
        events.push({ t: 'say', text: `${b.ally.name}は 身を守っている。` });
    }
    if (id === 'run') run(b, events);
    if (!b.over) foesTurn(b, events);
    if (!b.over) regen(b, events);
    return events;
}

// 本音を 言い当てる (チャンスの 敵に)。複数の 本音が いる敵 (デュエット) は、全員 言い当てると 勝ち
export function answer(b, choice) {
    const events = [];
    const foe = chanceFoe(b) ?? b.foe;
    b.foe = foe;
    if (choice === foe.truth.answer) {
        const next = foe.phases?.[foe.phase ?? 0];
        if (next) {
            nextPhase(b, foe, next, events);
            foesTurn(b, events);
            return events;
        }
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
        for (const next of aliveFoes(b)) {
            if (next.after === foe.id && (next.exhausted || next.kokoro >= 100)) openChance(b, next, events);
        }
        foesTurn(b, events);
        return events;
    }
    foe.chance = false;
    foe.kokoro = 50;
    if (b.nestle) {
        events.push({ t: 'say', text: 'その言葉は 届かなかった。でも バクが そばに よりそっている。', se: 'SE29' });
    } else {
        foe.atk = Math.round(foe.atk * WRONG_ATK);
        events.push({ t: 'say', text: `その言葉は 届かなかった。${foe.name}の力が 増した！`, se: 'SE29' });
    }
    foesTurn(b, events);
    return events;
}

// 本音が 届いて 次の 姿へ (属性・本音・技が 変わり、体力が 少し 戻る)
function nextPhase(b, foe, next, events) {
    foe.phase = (foe.phase ?? 0) + 1;
    const { text, hpRate, ...change } = next;
    Object.assign(foe, change, { chance: false, exhausted: false, kokoro: 0, step: 0 });
    foe.hp = Math.max(1, Math.round(foe.maxHp * (hpRate ?? 0.5)));
    events.push({ t: 'phase', index: foe.index, name: foe.name, attr: foe.attr });
    events.push({ t: 'say', text: text ?? `${foe.name}の 姿が 変わった！` });
}

function attack(b, events) {
    const times = b.rush || b.ally.rushTurns > 0 ? 2 : 1;
    if (b.ally.rushTurns > 0) b.ally.rushTurns--;
    b.rush = false;
    for (let i = 0; i < times && !b.over && !b.foe.down; i++) {
        const amount = damage(striker(b), b.foe, 100, b.rng);
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
    if (!b.trueEye && b.rng() >= SHAKE_HIT) {
        events.push({ t: 'say', text: 'しかし 気持ちは 揺れなかった。', se: 'SE26' });
        return;
    }
    const boost = (b.ally.kokoroRate ?? 1) * (b.joy > 0 ? 1.5 : 1) * b.kokoroOnce;
    b.kokoroOnce = 1;
    const gain = Math.round((SHAKE_POWER + (b.ally.kokoro ?? 0)) * rate * boost * affinity(b.ally.attr, foe.attr));
    foe.kokoro = Math.min(100, foe.kokoro + gain);
    events.push({ t: 'shake', index: foe.index, gain, kokoro: foe.kokoro });
    if (foe.kokoro >= 100) openChance(b, foe, events);
}

// にげる: ふつうの 敵からは RUN_RATE で にげられる。ボス・にげられない 戦いでは 失敗して 敵が 行動する
function run(b, events) {
    events.push({ t: 'say', text: 'ハルたちは にげだした！' });
    if (!canRun(b)) {
        events.push({ t: 'say', text: b.foes.find((f) => f.runText)?.runText ?? 'しかし、にげられない！' });
        return;
    }
    if (b.rng() < RUN_RATE) {
        b.over = 'flee';
        events.push({ t: 'end', result: 'flee' });
        return;
    }
    events.push({ t: 'say', text: 'しかし、回りこまれてしまった！' });
}

function musou(b, id, events) {
    const units = musouPair(b, id);
    if (!units) return;
    const data = MUSOU[id];
    const foe = b.foe;
    const attr = units.map((u) => u.attr).sort((x, y) => affinity(y, foe.attr) - affinity(x, foe.attr))[0];
    const fused = { atk: Math.round(units.reduce((sum, u) => sum + u.atk, 0) / units.length), attr };
    events.push({ t: 'musou', id, units: units.map((u) => u.id) });
    events.push({ t: 'say', text: `${units.map((u) => u.name).join('と ')}が 重なって、${data.name}になった！` });
    events.push({ t: 'say', text: `${data.name}の ${data.move}！（${attr}）` });
    const amount = damage(fused, foe, data.power, b.rng);
    events.push({ t: 'hit', target: 'foe', index: foe.index, amount, aff: affinity(attr, foe.attr) });
    for (const unit of units) unit.tired = 1;
    hurtFoe(b, foe, amount, events);
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
    const amount = damage(striker(b), foe, power, b.rng);
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

// 駄菓子: 前に 出ている 仲間の 体力が 最大の 35% もどる (バイトの お礼)
export const SNACK_RATE = 0.35;
function snack(b, events) {
    const amount = Math.min(b.ally.maxHp - b.ally.hp, Math.round(b.ally.maxHp * SNACK_RATE));
    b.ally.hp += amount;
    events.push({ t: 'say', text: `ハルは ${b.ally.name}に 駄菓子を わけた。` });
    events.push({ t: 'heal', target: 'ally', amount });
}

function heal(b, events) {
    const amount = Math.min(b.ally.maxHp - b.ally.hp, Math.round(b.ally.maxHp * 0.4 * (b.ally.healRate ?? 1)));
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
    foe.finisher ??= b.ally.id;   // とどめを 刺した ユメクイ (夢感情が 2 倍)
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
    const first = foe.after && b.foes.find((f) => f.id === foe.after);
    if (first && !first.solved) {
        events.push({ t: 'say', text: foe.waitText ?? `${foe.name}の 気持ちは、まだ 届かない……。` });
        return;
    }
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
    if (foe.slow > 0) {
        foe.slow--;
        if (foe.slow % 2 === 1) {
            events.push({ t: 'say', text: `${foe.name}は ゆっくりと しか 動けない……。` });
            return;
        }
    }
    if (foe.stun) {
        foe.stun = false;
        events.push({ t: 'say', text: `${foe.name}は ひるんで 動けない！` });
        return;
    }
    const pattern = foe.pattern ?? ['tackle'];
    const move = pattern[foe.step % pattern.length];
    if (foe.attrCycle) {
        foe.attr = foe.attrCycle[foe.step % foe.attrCycle.length];
        events.push({ t: 'attr', index: foe.index, attr: foe.attr });
        events.push({ t: 'say', text: `${foe.name}の 色が 変わった！（${foe.attr}）` });
    }
    foe.step++;
    if (move === 'charge') {
        events.push({ t: 'say', text: foe.chargeText ?? `${foe.name}が 大きく うずを巻きはじめた……！`, se: 'SE32' });
        return;
    }
    const big = move === 'swirl';
    const name = big ? (foe.bigMove ?? '群れの大渦') : '体当たり';
    const dodging = (b.ally.dodge ?? 0) + (b.ally.dodgeBuff?.rate ?? 0) > 0;
    if (!dodging) events.push({ t: 'say', text: `${foe.name}の ${name}！` });
    // ヒマワリオン (desperate): 空元気。体力が 減るほど 強くなる
    const weak = (foe.drowsy > 0 ? 0.8 : 1) * (foe.desperate ? 2 - foe.hp / foe.maxHp : 1);
    if (foe.drowsy > 0) foe.drowsy--;
    const dodge = (b.ally.dodge ?? 0) + (b.ally.dodgeBuff?.rate ?? 0);
    if (dodge > 0 && b.rng() < dodge) {
        events.push({ t: 'say', text: `${foe.name}の ${name}！ ${b.ally.name}は ひらりと かわした！` });
        return;
    }
    if (dodging) events.push({ t: 'say', text: `${foe.name}の ${name}！` });
    const guardUp = b.partyUp ? { ...b.ally, def: b.ally.def * (1 + b.partyUp.def) } : b.ally;
    const raw = damage({ ...foe, atk: foe.atk * weak }, guardUp, big ? 180 : 100, b.rng);
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

// ---- レベルと ユメポイントで 覚える 技 (data/growth.js) ----------------

// 攻撃する 味方の 今の 攻撃力 (テンポアップ・アンサンブルを かける)
function striker(b) {
    let atk = b.ally.atk;
    if (b.ally.tempo > 0) atk *= 1.25;
    if (b.boost > 0) atk *= 1.2;
    if (b.partyUp) atk *= 1 + b.partyUp.atk;
    if (b.cheer) atk *= 1.1;
    return { ...b.ally, atk };
}

function strike(b, events, power) {
    const foe = b.foe;
    const amount = damage(striker(b), foe, power, b.rng);
    events.push({ t: 'hit', target: 'foe', index: foe.index, amount, aff: affinity(b.ally.attr, foe.attr) });
    hurtFoe(b, foe, amount, events);
    return amount;
}

function skillSay(b, events, label, text = '') {
    b.ally.wait = SKILL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}の ${label}！${text ? ' ' + text : ''}` });
}

function healAll(b, events, rate) {
    for (const unit of b.party) {
        if (unit.hp <= 0) continue;
        const amount = Math.min(unit.maxHp - unit.hp, Math.round(unit.maxHp * rate * (b.ally.healRate ?? 1)));
        unit.hp += amount;
        if (unit === b.ally && amount > 0) events.push({ t: 'heal', target: 'ally', amount });
    }
}

// ため技: 1 ターン ためて、次の 行動で はなつ
function charge(b, events, label, power) {
    b.ally.wait = SKILL_WAIT;
    b.ally.charging = { label, power };
    events.push({ t: 'say', text: `${b.ally.name}は 力を ためている……！` });
}

// ひだまり毛布: 毎ターンの 終わりに 味方全員 10% 回復
function regen(b, events) {
    if (b.regen <= 0) return;
    b.regen--;
    healAll(b, events, 0.1);
    events.push({ t: 'say', text: 'ひだまり毛布が みんなを あたためている。' });
}

// ---- 夢感情の 技 (感情技・夢変わり・夢昇華・夢現)。data/emotions.js の 効果を そのまま 動かす ----

function runEffect(b, events, move) {
    const e = move.effect;
    if (e.once) b.used.add(move.id);
    else b.ally.wait = SKILL_WAIT;
    events.push({ t: 'say', text: `${b.ally.name}の ${move.label}！` });
    const foe = b.foe;
    if (e.power) {
        const user = e.best ? { ...striker(b), atk: Math.max(striker(b).atk, SHAKE_POWER / 2 + (b.ally.kokoro ?? 0)) } : striker(b);
        for (let i = 0; i < (e.hits ?? 1) && !b.over && !foe.down; i++) {
            const amount = damage(user, foe, e.power, b.rng);
            events.push({ t: 'hit', target: 'foe', index: foe.index, amount, aff: affinity(b.ally.attr, foe.attr) });
            hurtFoe(b, foe, amount, events);
            if (e.drain) {
                const gain = Math.min(b.ally.maxHp - b.ally.hp, Math.round(amount * e.drain));
                b.ally.hp += gain;
                if (gain) events.push({ t: 'heal', target: 'ally', amount: gain });
            }
        }
    }
    if (e.foeAtkDown && !foe.down) foe.atk = Math.round(foe.atk * (1 - e.foeAtkDown));
    if (e.foeDefDown && !foe.down) foe.def = Math.round(foe.def * (1 - e.foeDefDown));
    if (e.selfDefDown) b.ally.def = Math.round(b.ally.def * (1 - e.selfDefDown));
    if (e.healAll) healAll(b, events, e.healAll);
    if (e.partyAtkUp || e.partyDefUp) {
        b.partyUp = { atk: e.partyAtkUp ?? 0, def: e.partyDefUp ?? 0, turns: 4 };
        events.push({ t: 'say', text: 'みんなの 力が 上がった！' });
    }
    if (e.kokoroUp) {
        if (e.kokoroRate) b.kokoroOnce = e.kokoroRate;
        else b.joy = e.kokoroUp + 1;
        events.push({ t: 'say', text: 'みんなの 気持ちが はずんでいる。ココロ攻撃が 強くなった！' });
    }
    if (e.dodge) b.ally.dodgeBuff = { rate: e.dodge.rate, turns: e.dodge.turns + 1 };
    if (e.sleep && !foe.down) {
        foe.asleep = true;
        events.push({ t: 'say', text: `${foe.name}は 眠りに落ちた。` });
    }
    if (e.slow && !foe.down) {
        foe.slow = e.slow * 2;
        events.push({ t: 'say', text: `${foe.name}の 動きが ゆっくりに なった。` });
    }
    if (e.rushTurns) {
        b.ally.rushTurns = e.rushTurns;
        events.push({ t: 'say', text: `${b.ally.name}の テンポが 倍に なった！` });
    }
    if (e.cure) events.push({ t: 'say', text: '朝の光が さしこんで、みんなの 気持ちが 晴れた。' });
    if (e.stealBuffs && !foe.down && foe.atk > foe.baseAtk) {
        foe.atk = foe.baseAtk;
        events.push({ t: 'say', text: `${foe.name}の 強さを 喰らった！` });
    }
}

// 気まぐれ: 喜 = 応援してから 命令どおり / 怒 = 命令を 聞かず いちばん 強い 攻撃 / 哀 = 体力が 半分を 切ると 勝手に まもる / 楽 = 遊ぶか、2 回 動く
function whimOf(b, id, events) {
    const r = b.rng();
    const ally = b.ally;
    if (ally.whim === '楽') {
        if (r < 0.2) {
            events.push({ t: 'say', text: `${ally.name}は 遊びはじめてしまった……。` });
            return 'play';
        }
        if (r < 0.4) {
            events.push({ t: 'say', text: `${ally.name}は 楽しくなって、2 回 動いた！` });
            return 'twice';
        }
        return null;
    }
    if (r >= 0.2) return null;
    if (ally.whim === '喜') {
        b.cheer = true;
        events.push({ t: 'say', text: `${ally.name}が みんなを 応援した！` });
        return null;
    }
    if (ally.whim === '怒') {
        const strongest = (ally.moves.extra ?? []).filter((m) => m.effect?.power && !m.effect.once && !b.used.has(m.id)).sort((x, y) => y.effect.power - x.effect.power)[0];
        events.push({ t: 'say', text: `${ally.name}は 命令を 聞かずに 飛びだした！` });
        return strongest && ally.wait <= 0 ? strongest.id : 'attack';
    }
    if (ally.whim === '哀' && ally.hp < ally.maxHp / 2 && id !== 'guard') {
        events.push({ t: 'say', text: `${ally.name}は おびえて、身を 守ってしまった。` });
        return 'guard';
    }
    return null;
}

// 楽の 気まぐれ (2 回 動く) の 1 回目
function act2(b, id, target, events) {
    if (id === 'attack') attack(b, events);
    else if (GROWTH_MOVES[id] && id !== 'release') GROWTH_MOVES[id](b, events);
    else if (id === 'shake') shake(b, events);
}

// キズナ攻撃: 救った 仲間の 気持ちを 借りる。守りを 無視して 最大体力の 34%。1 人に つき 1 回
export const KIZUNA_RATE = 0.34;   // 3 人 そろえば ちょうど 倒せる
function kizunaAttack(b, events) {
    const friend = b.kizuna.shift();
    if (!friend) return;
    const foe = b.foe;
    events.push({ t: 'say', text: `${friend}の 声が 聞こえる。「ハル！」` });
    events.push({ t: 'say', text: `${b.ally.name}の キズナ攻撃！` });
    const amount = Math.round(foe.maxHp * KIZUNA_RATE);
    events.push({ t: 'hit', target: 'foe', index: foe.index, amount, aff: 1.5 });
    hurtFoe(b, foe, amount, events);
}

// 属性 → その属性に 強い 属性 (弱点)
const WEAK_TO = { 喜: '楽', 怒: '喜', 哀: '怒', 楽: '哀' };

const GROWTH_MOVES = {
    release(b, events) {
        const { label, power } = b.ally.charging;
        b.ally.charging = null;
        events.push({ t: 'say', text: `${b.ally.name}の ${label}！` });
        strike(b, events, power);
    },
    drowsy(b, events) {
        skillSay(b, events, 'ねぼけまなこ', `${b.foe.name}の 攻撃が 下がった！`);
        b.foe.drowsy = 3;
    },
    pillow(b, events) {
        skillSay(b, events, 'まくら投げ');
        const foe = b.foe;
        for (let i = 0; i < 2 && !b.over && !foe.down; i++) strike(b, events, 60);
    },
    lullaby(b, events) {
        skillSay(b, events, '子守唄');
        if (b.foe.truth && b.rng() >= 0.5) {
            events.push({ t: 'say', text: `${b.foe.name}は 眠らなかった。` });
            return;
        }
        b.foe.asleep = true;
        events.push({ t: 'say', text: `${b.foe.name}は 眠りに落ちた。` });
    },
    dreameye(b, events) {
        skillSay(b, events, '夢見の目');
        b.trueEye = true;
        const foe = b.foe;
        const pattern = foe.pattern ?? ['tackle'];
        const next = pattern[foe.step % pattern.length];
        const nextLabel = { tackle: '体当たり', charge: '力をためる', swirl: foe.bigMove ?? '大技' }[next];
        events.push({ t: 'say', text: `${foe.name}の 弱点は ${WEAK_TO[foe.attr]}。次は「${nextLabel}」が 来る。ココロ攻撃が 必ず 届く！` });
    },
    crush(b, events) {
        charge(b, events, 'ゆめくずし', 160);
    },
    dispel(b, events) {
        skillSay(b, events, '悪夢ばらい', '味方の 体力が 回復した！');
        healAll(b, events, 0.3);
    },
    sunblanket(b, events) {
        skillSay(b, events, 'ひだまり毛布', 'あたたかい 毛布が みんなを つつむ。');
        b.regen = 3;
    },
    nestle(b, events) {
        skillSay(b, events, 'よりそう', 'バクが ハルの そばに 寄りそった。');
        b.nestle = true;
    },
    gulp(b, events) {
        skillSay(b, events, 'まるのみ');
        const foe = b.foe;
        if (foe.truth || foe.hp > foe.maxHp * 0.3) {
            events.push({ t: 'say', text: `${foe.name}は 大きすぎて 飲みこめない。` });
            return;
        }
        foe.expRate = 2;
        events.push({ t: 'say', text: `${b.ally.name}は ${foe.name}を ひとくちで 飲みこんだ！` });
        hurtFoe(b, foe, foe.hp, events);
    },
    gluttony(b, events) {
        skillSay(b, events, '悪食');
        strike(b, events, 250);
        b.ally.maxHp = Math.round(b.ally.maxHp * 0.8);
        b.ally.hp = Math.min(b.ally.hp, b.ally.maxHp);
        events.push({ t: 'say', text: `${b.ally.name}の 体が すこし 欠けた……。` });
    },
    tearnote(b, events) {
        skillSay(b, events, 'なみだ音符');
        const foe = b.foe;
        strike(b, events, 110);
        if (!foe.down) foe.atk = Math.round(foe.atk * 0.9);
    },
    ensemble(b, events) {
        skillSay(b, events, 'アンサンブル', '次のターン、みんなの 攻撃が 上がる！');
        b.boost = 2;
    },
    endless(b, events) {
        charge(b, events, '止まらないソロ', 180);
    },
    togebeat(b, events) {
        skillSay(b, events, 'トゲの拍子');
        const foe = b.foe;
        strike(b, events, 90);
        if (!foe.down && b.rng() < 0.2) foe.stun = true;
    },
    tempoup(b, events) {
        skillSay(b, events, 'テンポアップ', '攻撃が 上がった！');
        b.ally.tempo = 4;   // 使った ターンの 次から 3 ターン
    },
    // ヒマワリオンの 技
    bravado(b, events) {
        skillSay(b, events, 'から元気', 'だいじょうぶ！');
        const power = Math.round(80 + 120 * (1 - b.ally.hp / b.ally.maxHp));   // 体力が 少ないほど 強い
        strike(b, events, power);
    },
    sunmane(b, events) {
        skillSay(b, events, 'たいようのたてがみ', 'みんなの 攻撃が 上がった！');
        b.partyUp = { atk: 0.15, def: 0, turns: 4 };
    },
    shout(b, events) {
        skillSay(b, events, 'だいじょうぶの叫び');
        if (!b.foe.down) b.foe.atk = Math.round(b.foe.atk * 0.8);
        b.ally.def = Math.round(b.ally.def * 0.9);
    },
    sunfield(b, events) {
        skillSay(b, events, 'ひまわり畑', 'あたたかい 日ざしが みんなを つつむ。');
        b.regen = 3;
    },
    fortissimo(b, events) {
        skillSay(b, events, 'フォルテッシモ');
        strike(b, events, 200);
        b.ally.def = Math.round(b.ally.def * 0.8);
    }
};
