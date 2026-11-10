import { act, answer, bench, commands, createBattle } from './core/battle.js';
import { ACTIONS, keyName } from './core/keys.js';
import { advance, createKeep, dateLabel, devour, dreamsTonight, nextLoop, rescue, ACTIVE_DAY, LAST_DAY, PAIR } from './core/calendar.js';
import { bakSkills, bakUnit, grow } from './core/growth.js';
import { createState, facing, pickWord, placeName, step, tileAt, warp, DIRS } from './core/field.js';
import { deepTalk, startDay, timeLabel, NIGHT_START } from './core/town.js';
import { buildChoices } from './core/truth.js';
import { MAPS } from './data/maps.js';
import { ALLIES, FOES } from './data/units.js';
import { LINES } from './scenes/story.js';
import { createInput } from './view/input.js';
import { createUi } from './view/ui.js';
import { drawBattle, drawField, drawMorning, drawShadow, drawSky } from './view/draw.js';

const WALK_MS = 150;
const NOTE_MS = 650;
const WIN_HEAL = 15;
const PARTY_SIZE = 3;
const COPY_BONUS = 0.1;
const DREAM_MAPS = { mio: 'mizuzoko', kana: 'renshu' };

const ctx = document.getElementById('game').getContext('2d');
ctx.imageSmoothingEnabled = false;
const input = createInput();
const ui = createUi(input);

let state = createState();
let keep = createKeep();
let hp = {};
let wake = null;
let mode = 'title';
let battleView = null;
const walk = { dx: 0, dy: 0, left: 0 };

async function talk(lines) {
    for (const [name, line] of lines) await ui.say(name, line);
    ui.hideMsg();
}

// ---- フィールド --------------------------------------------------------

// 左上: 日付と時間帯 (夢の中では 夢の名前)。右上: 今いる場所
function showHud(place = placeName(state)) {
    const map = MAPS[state.map];
    const time = map.dream ? `『${map.dream}』` : timeLabel(state);
    ui.hud(place, state, dateLabel(state.day), time);
}

async function scene(work) {
    mode = 'scene';
    await work();
    if (!wake) return;
    showHud();
    mode = 'field';
}

// 歩き回るのを 終える (夢から覚める・家に帰る・キャンバスに描く・眠る)。value は 終わり方
function wakeUp(value) {
    const done = wake;
    wake = null;
    done(value);
}

// 控えを含む、今の仲間。夢写しの回数だけ 強くなる
function partyUnits() {
    return keep.allies.slice(0, PARTY_SIZE).map((id) => {
        const base = id === 'bak' ? bakUnit(keep) : ALLIES[id];
        const rate = 1 + (keep.copies[id] ?? 0) * COPY_BONUS;
        const maxHp = Math.round(base.maxHp * rate);
        return { ...base, maxHp, hp: Math.min(hp[id] ?? maxHp, maxHp), atk: Math.round(base.atk * rate), def: Math.round(base.def * rate) };
    }).filter((unit) => unit.hp > 0);
}

const SCRIPTS = {
    sign1: () => talk(LINES.sign1),
    maskGuide: () => talk(LINES.maskGuide),
    rest: async () => {
        hp = {};
        await talk(LINES.rest);
    },
    bak: async () => {
        await talk(LINES.bak);
        state.flags.bak = true;
    },
    // 町
    tomeShop: () => talk(LINES.tomeShop),
    portSign: () => talk(LINES.portSign),
    rikuRoad: () => talk(LINES.rikuRoad(state)),
    rikuDoor: () => talk(LINES.rikuDoor),
    schoolClosed: () => talk(LINES.schoolClosed),
    goHome: homeDoor
};

const NAMES = { mio: 'ミオ', kana: 'カナ' };

// 人に話しかける。元気な夢主 (ミオ・カナ) とは「じっくり話す」か 選べる
async function talkTo(who) {
    if (PAIR.includes(who) && state.status[who] === 'idle') {
        await deepTalkTo(who);
        return;
    }
    await talk(LINES.town(who, state));
}

// じっくり話す: 言えなかった言葉を聞いて、夕方になり 家に帰る (1 日 1 人)
async function deepTalkTo(who) {
    if (state.talkedToday) {
        await talk(LINES.talkedToday(NAMES[who]));
        return;
    }
    await talk(LINES.deepGreet[who]);
    const id = await ui.menu([{ id: 'yes', label: LINES.deepYes }, { id: 'no', label: LINES.deepNo }], { head: LINES.deepHead(NAMES[who]) });
    if (id !== 'yes') return;
    const { count, word } = deepTalk(state, who, LINES.visitWord[who]);
    const lines = LINES.visit[who];
    await talk(lines[Math.min(count, lines.length - 1)]);
    showHud();
    if (word) await talk(LINES.wordHeard(word));
    await talk(LINES.evening);
    wakeUp();
}

// 家の玄関: 入ると その日は おしまい (夜になる)。夜の町からは 帰って寝る
async function homeDoor() {
    if (state.phase === 'night') {
        const id = await ui.menu([{ id: 'yes', label: LINES.nightHomeYes }, { id: 'no', label: LINES.nightHomeNo }], { head: LINES.nightHomeHead });
        if (id === 'yes') wakeUp('sleep');
        return;
    }
    const items = [{ id: 'yes', label: LINES.goHomeYes }];
    if (state.day >= ACTIVE_DAY + 3 && state.day < LAST_DAY) items.push({ id: 'skip', label: LINES.goHomeSkip });
    items.push({ id: 'no', label: LINES.goHomeNo });
    const id = await ui.menu(items, { head: LINES.goHomeHead });
    if (id === 'skip') state.day = LAST_DAY;
    if (id !== 'no') wakeUp();
}

async function touch(object) {
    if (object.kind === 'talk' || object.kind === 'door' || object.kind === 'block') await SCRIPTS[object.script]();
    if (object.kind === 'person') await talkTo(object.who);
    if (object.kind === 'canvas') await useCanvas();
    if (object.kind === 'bed') await useBed();
    if (object.kind === 'foe') await fight(object);
    if (object.kind === 'word') {
        const opened = pickWord(state, object);
        showHud();
        await talk(LINES.wordFound(object.word));
        if (opened) await talk(LINES.gateOpen);
        if (keep.tutorial) await talk(LINES.dreamWord);
    }
    if (object.kind === 'wake') {
        const items = [{ id: 'yes', label: LINES.wakeYes }, { id: 'no', label: LINES.wakeNo }];
        const id = await ui.menu(items, { head: LINES.wakeHead });
        if (id === 'yes') wakeUp();
    }
}

async function enter(exit) {
    await ui.fade(true);
    const goingOut = state.phase === 'night' && state.map === 'home' && exit.to !== 'home';
    warp(state, exit);
    hp = {};
    walk.left = 0;
    showHud();
    await ui.fade(false);
    if (exit.to === 'omen') await talk(LINES.enterOmen);
    if (exit.to === 'hiroba') await talk(LINES.enterHiroba);
    if (goingOut && !state.nightOut) {
        state.nightOut = true;
        await talk(LINES.nightOut);
    }
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
        if (MAPS[state.map].rooms) showHud();   // 部屋を 移ったら 右上の 場所が 変わる
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
    if (object.script === 'pairBoss') await talk(LINES.pairBoss);

    const foe = FOES[object.foe];
    const battle = createBattle(partyUnits(), foe);
    await ui.fade(true);
    mode = 'battle';
    battleView = { foe: foe.sprite, ally: battle.ally.sprite, foeHit: 0, allyHit: 0, pops: [] };
    ui.hideHud();
    ui.status(battle);
    await ui.fade(false);

    while (!battle.over) {
        await ui.say('', `${foe.name}が 立ちはだかる。どうする？`, { wait: 0 });
        const id = await ui.menu(commands(battle));
        ui.hideMsg();
        ui.hideMsg();
        let events;
        if (id === 'truth') events = await chooseTruth(battle);
        else if (id === 'swap') events = await chooseSwap(battle);
        else events = act(battle, id);
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
    const solvedBefore = keep.solved.includes(battle.foe.id);
    const choices = buildChoices(battle.foe.truth, state.words, { solvedBefore });
    const items = choices.map((line) => ({ id: line, label: line }));
    return ui.menu(items, { head: LINES.truthHead, wide: true }).then((line) => answer(battle, line));
}

async function chooseSwap(battle) {
    const list = bench(battle);
    const items = list.map((unit) => ({ id: unit.id, label: `${unit.name}（${unit.attr}）${unit.hp}/${unit.maxHp}` }));
    const id = await ui.menu(items, { head: 'だれと交代する？' });
    return act(battle, 'swap', list.find((unit) => unit.id === id));
}

async function play(battle, events) {
    for (const event of events) {
        if (event.t === 'swap') battleView.ally = event.sprite;
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
    for (const unit of battle.party) hp[unit.id] = unit.hp;
    if (battle.over === 'lose') {
        hp = {};
        if (keep.tutorial) {
            await talk(LINES.nightFail);
            wakeUp();
            return;
        }
        await talk(LINES.lose);
        const start = MAPS[state.map].start;
        state.x = start.x;
        state.y = start.y;
        return;
    }
    if (battle.over === 'truth') {
        keep.solved.push(foe.id);
        const before = bakSkills(keep.growth);
        if (foe.id === 'muresuima') {
            grow(keep, 'saved');
            await talk(LINES.bossWin);
            await talk(LINES.grewSaved);
            await announceSkills(before);
            await ending();
        } else {
            await saved(foe, before);
        }
        wakeUp();
        return;
    }
    if (battle.over === 'devour') {
        const before = bakSkills(keep.growth);
        const result = devour(state, keep, foe.dream);
        await talk(LINES.devour[foe.dream]);
        await talk(LINES.grewEaten);
        await announceSkills(before);
        await tellReaped(result.other);
        wakeUp();
        return;
    }
    for (const unit of battle.party) hp[unit.id] = Math.min(unit.maxHp, unit.hp + WIN_HEAL);
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
    keep.tutorial = true;
}

async function announceSkills(before) {
    const known = before.map((skill) => skill.id);
    for (const skill of bakSkills(keep.growth)) {
        if (!known.includes(skill.id)) await talk(LINES.learned(skill.label));
    }
}

async function saved(foe, before) {
    const result = rescue(state, keep, foe.dream, foe.ally);
    await talk(LINES.rescued[foe.dream]);
    const name = ALLIES[foe.ally].name;
    await talk(result.copied ? LINES.copied(name) : LINES.joined(name));
    await talk(LINES.grewSaved);
    await announceSkills(before);
    await tellReaped(result.other);
}

async function tellReaped(id) {
    if (state.status[id] === 'reaped') await talk(LINES.reaped[id]);
}

// ---- 昼と夜 ------------------------------------------------------------

// 今の場所から 歩き回る。wakeUp() (夢から覚める・家に帰る) で 終わる
function explore() {
    return new Promise((resolve) => {
        walk.left = 0;
        wake = resolve;
        showHud();
        mode = 'field';
    });
}

function dream(map) {
    hp = {};
    Object.assign(state, { map, x: MAPS[map].start.x, y: MAPS[map].start.y, dir: 'up' });
    return explore();
}

// 放課後 (土日は 昼): 学校と町を 歩いて 話す。夢主と じっくり話すか、家の玄関に入ると 夜になる
async function dayPhase() {
    startDay(state);
    const done = explore();
    mode = 'scene';   // 日の始めの 出来事を 見せるまで 歩けない
    await ui.fade(false);
    await scene(async () => {
        if (LINES.day[state.day] && !state.flags[`day${state.day}`]) {
            state.flags[`day${state.day}`] = true;
            await talk(LINES.day[state.day]);
        }
        if (state.day === 10 && PAIR.some((id) => state.status[id] === 'broken')) await talk(LINES.broken);
    });
    await done;
}

// 夜: ハルの部屋を歩く。キャンバスに描いた夢にだけ入れる。描かずに ベッドで寝るか、
//   玄関から 夜の町へ出て 帰って寝ると、夢に入らずに 朝になる (仕様書「1日の流れ」)
async function nightPhase() {
    Object.assign(state, NIGHT_START);
    state.nightOut = false;
    const done = explore();
    mode = 'scene';
    await ui.fade(false);
    await scene(async () => {});
    const ending = await done;
    if (ending?.dream) await enterDream(ending.dream);
}

// キャンバス: だれの夢を描くか選ぶ (描く画面は 段階2 で作る)
async function useCanvas() {
    if (state.nightOut) {
        await talk(LINES.canvasOut);
        return;
    }
    const dreams = dreamsTonight(state);
    if (dreams.length && !keep.canvasTold) {
        keep.canvasTold = true;
        await talk(LINES.firstCanvas);
    }
    if (!dreams.length) await talk(LINES.noDreamYet);
    const items = dreams.map((id) => ({ id, label: LINES.dreamNames[id] }));
    items.push({ id: 'rest', label: LINES.dreamNames.rest });
    items.push({ id: 'cancel', label: LINES.canvasCancel });
    const id = await ui.menu(items, { head: LINES.canvasHead, wide: true });
    if (id === 'cancel') return;
    if (id === 'rest') {
        await talk(LINES.slept);
        wakeUp('sleep');
        return;
    }
    await talk(LINES.drew(NAMES[id]));
    wakeUp({ dream: id });
}

async function useBed() {
    const id = await ui.menu([{ id: 'yes', label: LINES.bedYes }, { id: 'no', label: LINES.bedNo }], { head: LINES.bedHead });
    if (id !== 'yes') return;
    await talk(LINES.slept);
    wakeUp('sleep');
}

async function enterDream(id) {
    const map = DREAM_MAPS[id];
    await ui.fade(true);
    const entered = dream(map);
    mode = 'scene';   // 夢に入る セリフが 終わるまで 歩けない (フェードの あいだに 敵に ぶつからない)
    await ui.fade(false);
    await scene(async () => {
        await talk(LINES.enterDream[map]);
        if (!state.flags.active) await talk(LINES.noBoss);
    });
    await entered;
}

async function campaign() {
    const first = dream('odoriba');
    await ui.fade(false);
    await first;
    for (;;) {
        await ui.fade(true);
        const next = advance(state);
        if (next === 'loop') {
            mode = 'opening';
            ui.hideHud();
            await ui.fade(false);
            await talk(LINES.loop);
            if (keep.loop === 1) await talk(LINES.nextPlan);
            state = nextLoop(keep);
            await ui.fade(true);
        }
        if (state.phase === 'day') await dayPhase();
        else await nightPhase();
    }
}

// ---- 設定 --------------------------------------------------------------

async function fieldMenu() {
    const items = [{ id: 'bak', label: 'バクの成長' }, { id: 'keys', label: 'ボタン設定' }, { id: 'close', label: 'とじる' }];
    if (keep.tutorial && MAPS[state.map].dream) items.unshift({ id: 'wake', label: '夢から覚める' });
    const id = await ui.menu(items);
    if (id === 'keys') await settings();
    if (id === 'wake') wakeUp();
    if (id === 'bak') await talk(LINES.growthInfo(keep.growth, bakSkills(keep.growth).map((skill) => skill.label)));
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
    await campaign();
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
window.yumekui = { get state() { return state; }, get mode() { return mode; }, get keep() { return keep; } };

requestAnimationFrame(frame);
start();
