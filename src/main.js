import { act, answer, commands, createBattle } from './core/battle.js';
import { ACTIONS, keyName } from './core/keys.js';
import { createState, facing, pickWord, step, tileAt, warp, DIRS } from './core/field.js';
import { buildChoices } from './core/truth.js';
import { MAPS } from './data/maps.js';
import { BAK, FOES } from './data/units.js';
import { LINES } from './scenes/story.js';
import { createInput } from './view/input.js';
import { createUi } from './view/ui.js';
import { drawBattle, drawField, drawMorning, drawShadow, drawSky } from './view/draw.js';

const WALK_MS = 150;
const NOTE_MS = 650;
const WIN_HEAL = 15;

const ctx = document.getElementById('game').getContext('2d');
ctx.imageSmoothingEnabled = false;
const input = createInput();
const ui = createUi(input);

let state = createState();
let bakHp = BAK.maxHp;
let mode = 'title';
let battleView = null;
const walk = { dx: 0, dy: 0, left: 0 };

async function talk(lines) {
    for (const [name, line] of lines) await ui.say(name, line);
    ui.hideMsg();
}

// ---- フィールド --------------------------------------------------------

function showHud() {
    ui.hud(MAPS[state.map].name, state);
}

async function scene(work) {
    mode = 'scene';
    await work();
    showHud();
    mode = 'field';
}

const SCRIPTS = {
    sign1: () => talk(LINES.sign1),
    maskGuide: () => talk(LINES.maskGuide),
    rest: async () => {
        bakHp = BAK.maxHp;
        await talk(LINES.rest);
    },
    bak: async () => {
        await talk(LINES.bak);
        state.flags.bak = true;
    }
};

async function touch(object) {
    if (object.kind === 'talk') await SCRIPTS[object.script]();
    if (object.kind === 'foe') await fight(object);
    if (object.kind === 'word') {
        pickWord(state, object);
        showHud();
        await talk(LINES.wordFound(object.word));
        if (state.flags.gateOpen) await talk(LINES.gateOpen);
    }
}

async function enter(exit) {
    await ui.fade(true);
    warp(state, exit);
    bakHp = BAK.maxHp;
    walk.left = 0;
    showHud();
    await ui.fade(false);
    if (exit.to === 'omen') await talk(LINES.enterOmen);
    if (exit.to === 'hiroba') await talk(LINES.enterHiroba);
}

function updateField(delta) {
    if (walk.left > 0) {
        walk.left = Math.max(0, walk.left - delta / WALK_MS);
        return;
    }
    const dir = input.direction();
    if (!dir) return;
    const result = step(state, dir);
    if (result.type === 'moved' || result.type === 'exit') {
        [walk.dx, walk.dy] = DIRS[dir];
        walk.left = 1;
    }
    if (result.type === 'exit') scene(() => enter(result.object));
    if (result.type === 'bump') scene(() => touch(result.object));
    if (result.type === 'stop') {
        const [dx, dy] = DIRS[dir];
        if (tileAt(state, state.x + dx, state.y + dy) === 'G' && !state.flags.gateOpen) {
            scene(() => talk(LINES.gateClosed));
        }
    }
}

input.onPress((key) => {
    if (mode !== 'field' || walk.left > 0) return;
    if (key === 'b') scene(fieldMenu);
    if (key !== 'a') return;
    const object = facing(state);
    if (object && object.kind !== 'exit') scene(() => touch(object));
});

// ---- バトル ------------------------------------------------------------

async function fight(object) {
    if (object.script === 'firstBattle' && !state.flags.firstBattle) await talk(LINES.firstBattle);
    if (object.script === 'boss') await talk(LINES.boss);

    const foe = FOES[object.foe];
    const battle = createBattle({ ...BAK, hp: bakHp }, foe);
    await ui.fade(true);
    mode = 'battle';
    battleView = { foe: foe.sprite, foeHit: 0, allyHit: 0, pops: [] };
    ui.hideHud();
    ui.status(battle);
    await ui.fade(false);

    while (!battle.over) {
        await ui.say('', `${foe.name}が 立ちはだかる。どうする？`, { wait: 0 });
        const id = await ui.menu(commands(battle));
        ui.hideMsg();
        const events = id === 'truth' ? await chooseTruth(battle) : act(battle, id);
        await play(battle, events);
    }

    await ui.fade(true);
    ui.hideStatus();
    battleView = null;
    mode = 'scene';
    showHud();
    await ui.fade(false);
    await finish(battle, object, foe);
}

function chooseTruth(battle) {
    const choices = buildChoices(battle.foe.truth, state.words);
    const items = choices.map((line) => ({ id: line, label: line }));
    return ui.menu(items, { head: LINES.truthHead, wide: true }).then((line) => answer(battle, line));
}

async function play(battle, events) {
    for (const event of events) {
        if (event.t === 'say') await ui.say('', event.text, { wait: NOTE_MS });
        if (event.t === 'hit') showHit(event);
        if (event.t === 'heal') pop(`+${event.amount}`, 70, 92, '#7fe0a8');
        if (event.t === 'shake') pop(`ゆらぎ +${event.gain}`, 205, 40, '#ffc95e');
        if (event.t === 'chance') await ui.say('', `${battle.foe.name}の気持ちが 大きく揺れている！ 本音を言い当てるチャンスだ！`, { wait: NOTE_MS * 2 });
        ui.status(battle);
    }
    ui.hideMsg();
}

function showHit(event) {
    const now = performance.now();
    const isFoe = event.target === 'foe';
    battleView[isFoe ? 'foeHit' : 'allyHit'] = now + 300;
    const color = event.aff > 1 ? '#ffc95e' : '#ffffff';
    pop(String(event.amount), isFoe ? 205 : 70, isFoe ? 60 : 92, color);
}

function pop(text, x, y, color) {
    battleView.pops.push({ text, x, y, color, until: performance.now() + 700 });
}

async function finish(battle, object, foe) {
    if (battle.over === 'lose') {
        await talk(LINES.lose);
        bakHp = BAK.maxHp;
        const start = MAPS[state.map].start;
        state.x = start.x;
        state.y = start.y;
        return;
    }
    if (battle.over === 'truth') {
        await talk(LINES.bossWin);
        await ending();
        return;
    }
    bakHp = Math.min(BAK.maxHp, battle.ally.hp + WIN_HEAL);
    state.gone[object.id] = true;
    if (object.script === 'firstBattle') {
        state.gone.nanashi1 = true;
        state.gone.nanashi2 = true;
        state.flags.firstBattle = true;
        await talk(LINES.firstWin);
    }
    if (foe.drop) {
        state.shards += foe.drop;
        showHud();
        await ui.say('', '夢のかけらを 取り戻した！', { wait: NOTE_MS });
        ui.hideMsg();
        if (!state.flags.firstSuima) {
            state.flags.firstSuima = true;
            await talk(LINES.firstSuima);
        }
    }
}

async function ending() {
    await ui.fade(true);
    ui.hideHud();
    mode = 'shadow';
    await ui.fade(false);
    await talk(LINES.shadow);
    await ui.fade(true);
    mode = 'morning';
    await ui.fade(false);
    await talk(LINES.morning);
    await ui.fade(true);
    state = createState();
    bakHp = BAK.maxHp;
    await ui.fade(false);
    await start();
}

// ---- 設定 --------------------------------------------------------------

async function fieldMenu() {
    const id = await ui.menu([{ id: 'keys', label: 'ボタン設定' }, { id: 'close', label: 'とじる' }]);
    if (id === 'keys') await settings();
}

async function settings() {
    for (;;) {
        const bindings = input.bindings();
        const items = ACTIONS.map(({ id, label }) => ({ id, label: `${label}：${bindings[id].map(keyName).join(' / ')}` }));
        items.push({ id: 'swap', label: `スマホのボタン：${input.swapped() ? '左右入れかえ' : 'ふつう'}` });
        items.push({ id: 'reset', label: '最初の設定にもどす' });
        items.push({ id: 'back', label: 'もどる' });
        const id = await ui.menu(items, { head: 'ボタン設定', wide: true, tall: true });
        if (id === 'back') return;
        if (id === 'swap') input.toggleSwap();
        else if (id === 'reset') input.reset();
        else await assignKey(id);
    }
}

async function assignKey(action) {
    const { label } = ACTIONS.find((item) => item.id === action);
    ui.show(`「${label}」にするキーを押してください（Esc でやめる）`);
    const key = await input.capture();
    ui.hideMsg();
    if (key) input.assign(action, key);
}

// ---- 全体 --------------------------------------------------------------

async function start() {
    mode = 'title';
    ui.hideHud();
    ui.title(true);
    for (;;) {
        const id = await ui.menu([{ id: 'start', label: 'はじめる' }, { id: 'keys', label: 'ボタン設定' }], { center: true });
        if (id === 'start') break;
        ui.title(false);
        await settings();
        ui.title(true);
    }
    ui.title(false);
    await ui.fade(true);
    mode = 'opening';
    await ui.fade(false);
    await talk(LINES.opening);
    await ui.fade(true);
    mode = 'scene';
    showHud();
    await ui.fade(false);
    mode = 'field';
}

let last = performance.now();

function frame(now) {
    const delta = Math.min(50, now - last);
    last = now;
    if (mode === 'field') updateField(delta);
    if (walk.left > 0 && mode !== 'field') walk.left = Math.max(0, walk.left - delta / WALK_MS);
    if (mode === 'battle' && battleView) drawBattle(ctx, battleView, now);
    else if (mode === 'shadow') drawShadow(ctx, now);
    else if (mode === 'morning') drawMorning(ctx);
    else if (mode === 'title' || mode === 'opening') drawSky(ctx, now);
    else drawField(ctx, state, walk, now);
    requestAnimationFrame(frame);
}

// ブラウザのテストが 状態を読むための窓口
window.yumekui = { get state() { return state; }, get mode() { return mode; } };

requestAnimationFrame(frame);
start();
