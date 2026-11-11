import { act, aliveFoes, answer, bench, chanceFoe, commands, createBattle, needsTarget, setTarget, TARGETED, TOP_COMMANDS } from './core/battle.js';
import { ACTIONS, keyName } from './core/keys.js';
import { advance, createKeep, dateLabel, devour, dreamsTonight, isEarly, nextLoop, sleepAfterNightmare, rescue, rescuePair, ACTIVE_DAY, LAST_DAY, PAIR } from './core/calendar.js';
import { bakSkills, bakUnit, grow } from './core/growth.js';
import { battleExp, gainExp, growUnit, layerFoe, reachLayer, ypLeft } from './core/level.js';
import { openGrow } from './view/grow.js';
import { absorbed, isFinalLoop, kizunaFriends, routeOf, ABSORB_RATE } from './core/ending.js';
import { applyEmotion, declineReborn, gainEmotions, pendingReborn, reborn } from './core/emotion.js';
import { growCanvas, isNightmare, knowsDream, sightOf, stageOf, startLayers, truthHelp, DORMANT_ALLY_RATE, DORMANT_FOE_RATE, NIGHTMARE_RATE, STAGES } from './core/canvas.js';
import { dreamShardOf, giveHeart, heartsOf, isDormant, pickHeart, setDormant, teachHeart, useDreamShard } from './core/shards.js';
import { HEARTS } from './data/hearts.js';
import { chaseStep, createState, facing, isBlocked, objectAt, pickWord, placeName, step, tileAt, warp, DIRS } from './core/field.js';
import { deepTalk, startDay, startMorning, timeLabel, timesBetween, NIGHT_START, PROLOGUE_START, RIKU_BRANCH_Y, TOWN_START } from './core/town.js';
import { isWeekend, LAST_RESCUE_DAY, WAKE_DAY } from './core/days.js';
import { frontChoices, makeSentence, nextChoices, sentenceChoices } from './core/sentence.js';
import { OWNER_NAMES, WORDS } from './data/words.js';
import { DREAM_LAYERS, MAPS } from './data/maps.js';
import { ALLIES, FOES } from './data/units.js';
import { LINES } from './scenes/story.js';
import { createInput } from './view/input.js';
import { createUi } from './view/ui.js';
import { drawBattle, drawField, drawMorning, drawShadow, drawSky, foeX } from './view/draw.js';
import { drawCalendar, drawLapse } from './view/time.js';
import { drawEncounter, encounterTheme } from './view/encounter.js';
import { createPainting, drawPainting, finishPainting, updatePainting } from './view/painting.js';
import { drawIntro } from './view/intro.js';
import { morningMovie } from './scenes/mornings.js';
import { canUseBrush, hasImageFor, learnImage, paint } from './core/brush.js';
import { IMAGES, TILE_IMAGES } from './data/brush.js';
import { createSound } from './view/sound.js';
import { bgmFor, layersFor, stepVolume, transitionFor, voicedAt, voiceOf, wobbleFor, ENDING_BGM } from './core/music.js';
import { stepsOf } from './core/movie.js';
import { createMoviePlayer, createStage, drawFilm, playFilm } from './view/movie.js';
import { MOVIES } from './scenes/movies.js';
import { nextStage, portraitPath, startStage } from './core/portraits.js';
import { canWork, shopHint, useSnack, work, JOBS } from './core/job.js';

const WALK_MS = 150;
const NOTE_MS = 650;
const WIN_HEAL = 15;
const PARTY_SIZE = 3;
const COPY_BONUS = 0.1;
// 今いる 地図が どの夢の 何階層目か (階層の ない 地図は null)
function layerOf(mapId = state.map) {
    for (const [dream, list] of Object.entries(DREAM_LAYERS)) {
        const index = list.indexOf(mapId);
        if (index >= 0) return { dream, layer: index + 1, deepest: index === list.length - 1 };
    }
    return null;
}

const ctx = document.getElementById('game').getContext('2d');
ctx.imageSmoothingEnabled = false;
const input = createInput();
const sound = createSound();
// 文字の 声・カーソル・決定の 音
const ui = createUi(input, {
    type: (name, line, index) => { if (voicedAt(line, index)) sound.voice(voiceOf(name)); },
    cursor: () => sound.se('SE01'),
    decide: (id) => sound.se(['back', 'cancel', 'no', 'close'].includes(id) ? 'SE03' : 'SE02')
});

let state = createState();
let keep = createKeep();
let hp = {};
let wake = null;
let mode = 'title';
let battleView = null;
let lapse = null;          // 時間が過ぎていく演出
let calendarView = null;   // カレンダーが はがれる演出
let skipTear = false;      // チュートリアルの 結末で もう カレンダーを 見せた
let encounter = null;      // 戦闘に入るときの 演出
let actors = [];           // ムービーに 出ている 人 (朝の 通学路)
const follow = { x: 0, y: 0, fromX: 0, fromY: 0 };   // ハルに ついてくる 仲間の 位置 (夢の中の バク・プロローグの リク)
let painting = null;       // プロローグで キャンバスに 描く 画面
let intro = null;          // はじまりの 夢 (砂浜 → 大きな目「おきろ」)
let musicOverride;         // 物語の 場面で 決めた 曲 (エンディング・ループ など。null は 無音・undefined は 場面で 決める)
const stage = createStage();   // 演出スクリプト (ムービー) の 舞台
const seenMovies = new Set();

// バクを ハルの いる マスに 置き直す (夢に入ったとき・地図を 移ったとき)
function resetFollow() {
    Object.assign(follow, { x: state.x, y: state.y, fromX: state.x, fromY: state.y });
}

// 夢の中で、バクと 出会ったあとだけ ついてくる (現実では 姿を見せない)。プロローグでは リクが いっしょに 坂を下る
function followerView() {
    if (state.flags.rikuWalk && (state.map === 'saka' || state.map === 'school')) return { ...follow, sprite: 'riku' };
    if (MAPS[state.map].real || !state.flags.bak || mode === 'battle') return null;
    return { ...follow, sprite: keep.growth.eaten > 0 ? 'bak-mini-wild' : 'bak-mini' };
}
const walk = { dx: 0, dy: 0, left: 0 };

// 会話: 立ち絵を 左 (主人公の側) と 右 (相手) に 出す。セリフの 3 つ目は 表情 (smile など、なければ neutral)
async function talk(lines) {
    let stage = startStage();
    for (const [name, line, expression] of lines) {
        stage = nextStage(stage, name, expression, keep.allies);
        ui.portraits(stage, portraitPath);
        await ui.say(name, line);
    }
    ui.portraits(null);
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
    done?.(value);
}

// 今の 仲間の ユニット (レベル・ユメポイント・夢写しを のせる)
function grownUnits() {
    return keep.allies.map((id) => {
        const base = growUnit(id === 'bak' ? bakUnit(keep) : ALLIES[id], keep, state);
        const rate = 1 + (keep.copies[id] ?? 0) * COPY_BONUS;
        const maxHp = Math.round(base.maxHp * rate);
        return dormant(applyEmotion({ ...base, maxHp, hp: maxHp, atk: Math.round(base.atk * rate), def: Math.round(base.def * rate) }, keep));
    });
}

// 活性化の 前に 仲間にした ユメクイは、夢のかけらで 活性化するまで 弱い
function dormant(unit) {
    if (!isDormant(state, unit.id)) return unit;
    const maxHp = Math.round(unit.maxHp * DORMANT_ALLY_RATE);
    return { ...unit, dormant: true, maxHp, hp: Math.min(unit.hp, maxHp), atk: Math.round(unit.atk * DORMANT_ALLY_RATE), def: Math.round(unit.def * DORMANT_ALLY_RATE) };
}

// 控えを含む、今の仲間。夢写しの回数だけ 強くなる
function partyUnits() {
    return keep.allies.slice(0, PARTY_SIZE).map((id) => {
        const base = growUnit(id === 'bak' ? bakUnit(keep) : ALLIES[id], keep, state);
        const rate = 1 + (keep.copies[id] ?? 0) * COPY_BONUS;
        const maxHp = Math.round(base.maxHp * rate);
        const unit = dormant(applyEmotion({ ...base, maxHp, atk: Math.round(base.atk * rate), def: Math.round(base.def * rate) }, keep));
        return { ...unit, hp: Math.min(hp[id] ?? unit.maxHp, unit.maxHp) };
    }).filter((unit) => unit.hp > 0);
}

const SCRIPTS = {
    sign1: () => talk(LINES.sign1),
    maskGuide: () => talk(LINES.maskGuide),
    rest: async () => {
        hp = {};
        sound.se('SE09');
        await talk(LINES.rest);
        if (ypLeft(keep) <= 0) return;
        const id = await ui.menu([{ id: 'yes', label: LINES.ypRestYes }, { id: 'no', label: LINES.ypRestNo }], { head: LINES.ypRestHead });
        if (id === 'yes') await growScreen(true);
    },
    bak: async () => {
        await talk(LINES.bak);
        state.flags.bak = true;
        resetFollow();
    },
    // 夢筆で 描いたあと
    stairsPainted: () => talk(LINES.stairsPainted),
    bridgePainted: () => talk(LINES.bridgePainted),
    pianoPainted: () => talk(LINES.pianoPainted),
    pianoRest: async () => {
        hp = {};
        await talk(LINES.pianoRest);
    },
    metronomePainted: async () => {
        for (const object of MAPS[state.map].objects) {
            if (object.foe === 'hari') state.gone[object.id] = true;   // テンポが 落ちて ナナシ・ハリが 動けなくなる
        }
        await talk(LINES.metronomePainted);
    },
    metronomeLook: () => talk(LINES.metronomeLook),
    // 二重奏ホール: 左の音で 右の扉が、右の音で 左の扉が 開く
    noteMio: async () => {
        const first = !state.flags.gateR;
        state.flags.gateR = true;
        await talk(first ? LINES.noteMio : LINES.noteAgain);
    },
    noteKana: async () => {
        const first = !state.flags.gateL;
        state.flags.gateL = true;
        await talk(first ? LINES.noteKana : LINES.noteAgain);
    },
    queenMio: () => talk(LINES.queenMio),
    // 階層の 夢の住人。まちがいの 言葉を 落とすことが ある
    resident: async (object) => {
        await talk(LINES.residents[object.line]);
        if (object.gives && !state.words.includes(object.gives)) {
            state.words.push(object.gives);
            showHud();
            await talk(LINES.wordFound(object.gives));
        }
    },
    judgeKana: () => talk(LINES.judgeKana),
    // 町
    tomeShop: async () => {
        await talk(LINES.tomeShop);
        await partTimeJob();
    },
    portSign: () => talk(LINES.portSign),
    rikuRoad: () => talk(LINES.rikuRoad(state)),
    rikuDoor: async () => {
        // 3 周目: ミオと カナを 救ったことが あれば、リクの母から『引っ越し』を 聞ける (台本 4-2)
        await talk(LINES.rikuDoor);
        if (keep.loop >= 3 && savedPair() && !state.words.includes('引っ越し')) {
            await talk(LINES.rikuMom);
            state.words.push('引っ越し');
            showHud();
        }
    },
    rikuWall: async () => {
        await talk(LINES.rikuWallClosed);
        if (keep.loop === 1 && !keep.rikuChased) await startChase();   // 1 周目の 最初だけ ナイトメアが 来る (台本 4-1)
    },
    schoolClosed: () => talk(LINES.schoolClosed),
    prologueSchool: () => talk(LINES.prologueSchool),
    prologueStay: () => talk(LINES.prologueStay),
    goHome: homeDoor
};

const NAMES = { mio: 'ミオ', kana: 'カナ', riku: 'リク', duet: 'ミオとカナ' };

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

// 土日の 昼の バイト: トメの 駄菓子屋で 店番か 荷運び。お礼は 駄菓子 (バトルの アイテム)。終わると 夕方に なって 家に 帰る
async function partTimeJob() {
    if (state.phase === 'night') return talk(LINES.shopNight);
    if (!isWeekend(state.day)) return talk(LINES.shopWeekday);
    if (!canWork(state)) return talk(LINES.shopDone);
    await talk(LINES.jobAsk);
    const items = Object.entries(JOBS).map(([id, job]) => ({ id, label: job.label }));
    items.push({ id: 'no', label: LINES.jobNo });
    const id = await ui.menu(items, { head: LINES.jobHead });
    if (id === 'no') return;
    const hint = shopHint(state, keep);
    const count = work(state, id);
    await talk(id === 'shop' ? LINES.jobShop : LINES.jobCarry);
    if (id === 'shop') await talk(LINES.shopHint[hint]);   // 店番: お客さんの 話
    showHud();
    await talk(LINES.jobPaid(count));
    await talk(LINES.jobEvening);
    wakeUp();
}

// 家の玄関: 入ると その日は おしまい (夜になる)。夜の町からは 帰って寝る。プロローグでは 家に入る
async function homeDoor() {
    if (state.flags.prologue) {
        await enterHomePrologue();
        return;
    }
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

// ミオと カナを (どの周でも) 救ったことが ある
function savedPair() {
    return ['gakufume', 'togemetoro'].every((id) => keep.solved.includes(id));
}

// ---- ナイトメアから 逃げる (台本 4-1) --------------------------------------
//   光る扉まで 逃げ切れば 助かる。捕まると「にがさない」のあと ベッドで 飛び起き、その夜は 失敗
const CHASE_MS = 240;   // ナイトメアが 1 マス 進む 間隔 (ハルは 150)
let chaseAt = 0;

async function startChase() {
    keep.rikuChased = true;
    await talk(LINES.nightmareCome);
    state.chaser = { x: 9, y: 1 };
    chaseAt = performance.now() + 600;
}

function updateChase(now) {
    if (now < chaseAt) return;
    chaseAt = now + CHASE_MS;
    const next = chaseStep(MAPS[state.map].tiles, state.chaser, state);
    if (next) Object.assign(state.chaser, next);
    if (state.chaser.x === state.x && state.chaser.y === state.y) scene(caught);
}

async function caught() {
    state.chaser = null;
    await film('NIGASANAI');
    mode = 'scare';   // 次の 暗転まで 赤い字を 残す
    await ui.fade(true);
    mode = 'scene';
    await ui.fade(false);
    await talk(LINES.caughtWake);
    state.nightFailed = true;
    wakeUp('fail');
}

async function touch(object) {
    if (object.kind === 'wake' && state.chaser) {
        state.chaser = null;   // 光る扉まで 逃げ切った
        await talk(LINES.chaseEscaped);
        wakeUp();
        return;
    }
    if (object.id === 'rikuPhoto') await talk(LINES.rikuPhoto);
    if (object.kind === 'talk' || object.kind === 'door' || object.kind === 'block') await SCRIPTS[object.script](object);
    if (object.kind === 'person') {
        if (state.flags.prologue && object.who === 'father') await talk(LINES.fatherAfter);
        else await talkTo(object.who);
    }
    if (object.kind === 'brushSpot') await useBrushAt(object);
    if (object.kind === 'heart') await findHeart(object);
    if (object.kind === 'look') await lookAt(object.image);
    if (object.kind === 'canvas') await useCanvas();
    if (object.kind === 'bed') await useBed();
    if (object.kind === 'foe') await fight(object);
    if (object.kind === 'word') {
        const opened = pickWord(state, object);
        sound.se('SE05');
        showHud();
        await talk(LINES.wordFound(object.word));
        if (opened) {
            sound.se('SE06');
            await talk(LINES.gateOpen);
            // チュートリアル: 3 つの 言葉を バクが つないで、夢合わせを 教える
            makeSentence(state, ['ほんとは', '自分で'], '決めたかった');
            await talk(LINES.tutorialWeave);
        }
        if (keep.tutorial) await talk(LINES.dreamWord);
    }
    if (object.kind === 'wake') {
        const items = [{ id: 'yes', label: LINES.wakeYes }, { id: 'no', label: LINES.wakeNo }];
        const id = await ui.menu(items, { head: LINES.wakeHead });
        if (id === 'yes') {
            sound.se('SE08');
            wakeUp();
        }
    }
}

// ---- 夢筆 ----------------------------------------------------------------

// 描ける場所で 夢筆を使う。現実で 見た物 (イメージ) から選ぶ。夢に 合わない物は 描けない
async function useBrushAt(spot) {
    if (!keep.brush) {
        await talk(LINES.brushNone);
        return;
    }
    if (!hasImageFor(keep, spot)) await talk(LINES[spot.hint]);
    const items = keep.images.map((id) => ({ id, label: IMAGES[id].label }));
    items.push({ id: 'cancel', label: LINES.brushCancel });
    const id = await ui.menu(items, { head: LINES.brushHead });
    if (id === 'cancel') return;
    const label = IMAGES[id].label;
    const result = paint(state, keep, spot, id);
    if (result === 'unfit') await talk(LINES.brushUnfit(label, MAPS[state.map].dream));
    else if (result === 'useless') await talk(LINES.brushUseless(label));
    else {
        await talk(LINES.brushDone(label));
        await SCRIPTS[spot.done]();
    }
}

// 現実で 物を 見る。初めて 見た物は、夢筆で 描けるようになる
async function lookAt(imageId) {
    const label = IMAGES[imageId].label;
    await talk(learnImage(keep, imageId) ? LINES.learnImage(label) : LINES.lookAgain(label));
}

function facingTile() {
    const [dx, dy] = DIRS[state.dir];
    return tileAt(state, state.x + dx, state.y + dy);
}

// 現実の地図で 正面の タイルを 見る (ピアノ・階段・イーゼル・手すり・坂道から 見える 海)
function tileImage() {
    const [dx, dy] = DIRS[state.dir];
    const tile = tileAt(state, state.x + dx, state.y + dy);
    if (state.map === 'saka' && tile === '=' && state.y >= 11) return 'sea';
    return TILE_IMAGES[tile] ?? null;
}

async function enter(exit) {
    await ui.fade(true);
    const goingOut = state.phase === 'night' && state.map === 'home' && exit.to !== 'home';
    warp(state, exit);
    resetFollow();
    const here = layerOf();
    if (!here) hp = {};   // 夢の 階層を 下りるときは 体力は そのまま (毛布で 回復する)
    if (here) reachLayer(state, here.dream, here.layer);
    walk.left = 0;
    showHud();
    await ui.fade(false);
    if (here && here.layer > 1) await talk(LINES.layerEnter(layerLabel(here.dream, here.layer)));
    if (here?.deepest && here.dream !== 'riku' && !state.flags.active && !state.flags.early) await talk(LINES.noBossDeep);
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
    const from = { x: state.x, y: state.y };
    const result = step(state, dir);
    if (result.type === 'moved') Object.assign(follow, { fromX: follow.x, fromY: follow.y, x: from.x, y: from.y });
    if (result.type === 'moved' && state.flags.prologue) prologueStep();
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
    else if (state.map === 'home' && facingTile() === 'd') scene(lookDesk);
    else if (MAPS[state.map].real && tileImage()) scene(() => lookAt(tileImage()));
});

// ---- バトル ------------------------------------------------------------

async function fight(object) {
    if (object.script === 'firstBattle' && !state.flags.firstBattle) await talk(LINES.firstBattle);
    if (object.script === 'boss') await talk(LINES.boss);
    if (object.script === 'pairBoss') await talk(LINES.pairBoss);
    if (object.script === 'duetMid') await talk(LINES.duetMid);
    if (object.script === 'duetBoss') await talk(LINES.duetBoss);
    if (object.script === 'rikuBoss') await talk(LINES.rikuBoss);

    // 敵は 1 体 (foe) か 複数 (foes)。本音を持つ 敵 (なければ 1 体目) が この戦いの 主
    const layer = layerOf()?.layer ?? 1;   // 下の 階層ほど 敵が 強い
    const nightmare = state.sight?.nightmare ? NIGHTMARE_RATE : 1;   // 悪夢化した 合体の夢は 敵が 強い
    const sleepy = (f) => state.flags.early && f.truth ? { ...f, maxHp: Math.round(f.maxHp * DORMANT_FOE_RATE), hp: Math.round(f.maxHp * DORMANT_FOE_RATE), atk: Math.round(f.atk * DORMANT_FOE_RATE) } : f;   // 活性化前の ユメクイは 弱い
    const foeList = (object.foes ?? [object.foe]).map((id) => sleepy(layerFoe(FOES[id], layer))).map((f) => nightmare === 1 ? f : { ...f, maxHp: Math.round(f.maxHp * nightmare), hp: Math.round(f.maxHp * nightmare), atk: Math.round(f.atk * nightmare) });
    const foe = foeList.find((f) => f.truth) ?? foeList[0];
    const scaled = object.scale ? foeList.map((f) => ({ ...f, maxHp: Math.round(f.maxHp * object.scale), hp: Math.round(f.maxHp * object.scale), atk: Math.round(f.atk * object.scale) })) : foeList;
    const battle = createBattle(partyUnits(), scaled, { noEscape: ['firstBattle', 'nightmare', 'final'].includes(object.script), musou: keep.musou, kizuna: object.kizuna ?? null, dreamEat: Boolean(object.dreamEat) });
    sound.se('SE20');
    await playEncounter(encounterTheme(MAPS[state.map], state.x), foeList.some((f) => f.truth));
    await ui.fade(true);
    mode = 'battle';
    battleView = { foes: foeList.map((f) => f.sprite), foeIds: foeList.map((f) => f.id), down: [], ally: battle.ally.sprite, foeHit: [], allyHit: 0, pops: [] };
    ui.hideHud();
    ui.status(battle);
    await ui.fade(false);

    while (!battle.over) {
        const names = aliveFoes(battle).map((f) => f.name).join('と');
        await ui.say('', `${names}が 立ちはだかる。どうする？`, { wait: 0 });
        // たたかう / まもる / アイテム / にげる。技は「たたかう」の中から 選ぶ
        const top = await ui.menu(TOP_COMMANDS);
        ui.hideMsg();
        let events = null;
        if (top === 'fight') events = await chooseMove(battle);
        if (top === 'guard') events = act(battle, 'guard');
        if (top === 'item') events = await chooseItem(battle);
        if (top === 'run') events = act(battle, 'run');
        if (events) await play(battle, events);
    }

    await ui.fade(true);
    ui.hideStatus();
    battleView = null;
    mode = 'scene';
    showHud();
    await ui.fade(false);
    await finish(battle, object, foe);
    musicOverride = undefined;   // 救った・喰らった あとの 静けさを 終える
    return battle.over;
}

// 「アイテム」: バイトで もらった 駄菓子で 前の 仲間の 体力を もどす (もどると いちばん上の コマンドへ)
async function chooseItem(battle) {
    if (!(state.snacks > 0)) {
        await ui.say('', LINES.noItem, { wait: NOTE_MS });
        return null;
    }
    const id = await ui.menu([{ id: 'snack', label: LINES.snackUse }, { id: 'back', label: 'もどる' }], { head: LINES.snackHead(state.snacks) });
    if (id !== 'snack' || !useSnack(state)) return null;
    return act(battle, 'snack');
}

// 「たたかう」: 技を 選ぶ (もどると いちばん上の コマンドへ)
async function chooseMove(battle) {
    const items = [...commands(battle), { id: 'back', label: 'もどる' }];
    const id = await ui.menu(items, { head: `${battle.ally.name}の わざ` });
    if (id === 'back') return null;
    if (id === 'truth') return chooseTruth(battle);
    if (id === 'swap') return chooseSwap(battle);
    if (TARGETED.includes(id) && needsTarget(battle) && !(await chooseTarget(battle))) return null;
    return act(battle, id);
}

// 敵が 複数のとき、ねらう 敵を 選ぶ (もどると 選び直し)
async function chooseTarget(battle) {
    const items = aliveFoes(battle).map((f) => ({ id: String(f.index), label: `${f.name}（${f.attr}）` }));
    items.push({ id: 'back', label: 'もどる' });
    const id = await ui.menu(items, { head: 'どれを ねらう？' });
    if (id === 'back') return false;
    setTarget(battle, battle.foes[Number(id)]);
    ui.status(battle);
    return true;
}

function chooseTruth(battle) {
    battle.foe = chanceFoe(battle) ?? battle.foe;
    const solvedBefore = keep.solved.includes(battle.foe.solvedAs ?? battle.foe.id);
    // 本音の 3 択には、夢合わせで 作った その夢主の 文を 持ち込む (正しい文を 作っていないと 正解は 出ない)
    const here = layerOf();
    const help = here ? truthHelp(stageOf(keep, here.dream)) : {};   // キャンバスの 段階 4・5
    const choices = sentenceChoices(battle.foe.truth, state.sentences, { solvedBefore, ...help });
    const items = choices.map((line) => ({ id: line, label: line }));
    return ui.menu(items, { head: battle.foe.truthHead ?? LINES.truthHead, wide: true }).then((line) => answer(battle, line));
}

async function chooseSwap(battle) {
    const list = bench(battle);
    const items = list.map((unit) => ({ id: unit.id, label: `${unit.name}（${unit.attr}）${unit.hp}/${unit.maxHp}` }));
    const id = await ui.menu(items, { head: 'だれと交代する？' });
    return act(battle, 'swap', list.find((unit) => unit.id === id));
}

async function play(battle, events) {
    for (const event of events) {
        battleSound(event);
        if (event.t === 'swap') battleView.ally = event.sprite;
        if (event.t === 'say') await ui.say('', event.text, { wait: NOTE_MS });
        if (event.t === 'hit') showHit(event);
        if (event.t === 'heal') pop(`+${event.amount}`, 70, 92, '#7fe0a8');
        if (event.t === 'shake') pop(`ゆらぎ +${event.gain}`, foeX(battleView, event.index ?? 0), 40, '#ffc95e');
        if (event.t === 'chance') await ui.say('', `${event.name}の気持ちが 大きく揺れている！ 本音を言い当てるチャンスだ！（「たたかう」から 選べる）`, { wait: NOTE_MS * 2 });
        if (event.t === 'down') {
            battleView.down[event.index] = true;
            if (battle.foes.length > 1 && !battle.over) await ui.say('', `${event.name}を たおした！`, { wait: NOTE_MS });
        }
        if (event.t === 'solved') {
            battleView.down[event.index] = true;
            if (!battle.over) await ui.say('', `${event.name}に 本音が とどいた！`, { wait: NOTE_MS * 2 });
        }
        ui.status(battle);
    }
    ui.hideMsg();
}

// バトルの 出来事に 合わせた 効果音 (サウンドリスト「バトル」)
function battleSound(event) {
    if (event.se) sound.se(event.se);
    if (event.t === 'hit') sound.se(event.target === 'foe' && event.aff > 1 ? 'SE22' : 'SE21');
    if (event.t === 'heal') sound.se('SE24');
    if (event.t === 'shake') sound.se('SE25');
    if (event.t === 'chance') sound.se('SE27');
    if (event.t === 'solved') sound.se('SE28');
    if (event.t === 'swap') sound.se('SE30');
    if (event.t === 'musou') sound.se('SE35');
    if (event.t === 'end' && event.result === 'lose') sound.se('SE31');
}

function showHit(event) {
    const now = performance.now();
    const isFoe = event.target === 'foe';
    if (isFoe) battleView.foeHit[event.index ?? 0] = now + 300;
    else battleView.allyHit = now + 300;
    const color = event.aff > 1 ? '#ffc95e' : '#ffffff';
    pop(String(event.amount), isFoe ? foeX(battleView, event.index ?? 0) : 70, isFoe ? 60 : 92, color);
}

function pop(text, x, y, color) {
    battleView.pops.push({ text, x, y, color, until: performance.now() + 700 });
}

async function finish(battle, object, foe) {
    for (const unit of battle.party) hp[unit.id] = unit.hp;
    if (object.script === 'final') return;   // 終幕の 戦いは finale() が 進める
    if (battle.over === 'flee') {
        // 敵は その場に 残る。ハルは 1 歩 下がる (下がれる ときだけ)
        const [dx, dy] = DIRS[state.dir];
        const back = { x: state.x - dx, y: state.y - dy };
        if (!isBlocked(state, back.x, back.y) && !objectAt(state, back.x, back.y)) Object.assign(state, back);
        resetFollow();
        await talk(LINES.fled);
        return;
    }
    if (battle.over === 'lose' && object.script === 'nightmare') {
        await nightmareLoss();
        return;
    }
    // 勝った・負けた: 戦闘の 曲を 止めて 短い曲 (M25 / M26)。町や 夢の 曲は 鳴り終わってから
    const jingle = battle.over === 'win' ? 'M25' : battle.over === 'lose' ? 'M26' : null;
    let jingleDone = null;
    if (jingle) {
        musicOverride = null;
        sound.playBgm(null, { transition: 'hard' });
        jingleDone = Promise.race([sound.jingle(jingle), new Promise((resolve) => setTimeout(resolve, 9000))]);
    }
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
        await jingleDone;
        return;
    }
    await awardExp(battle);
    if (battle.over === 'truth') {
        musicOverride = null;   // 曲を 止めて、救ったときの 短い曲 (M18)
        sound.jingle('M18', object.script === 'duetBoss' ? null : foe.dream);
    }
    if (battle.over === 'truth' && object.script === 'duetBoss') {
        // 夢合体: 2 人とも 目を覚まし、ガクフメと トゲメトロが 仲間に。夢双「ふたりのアンサンブル」の 相性
        const before = bakSkills(keep.growth);
        const joined = rescuePair(state, keep);
        await talk(LINES.duetSaved);
        await talk(LINES.overcome.duet);
        for (const ally of joined) await talk(keep.copies[ally] ? LINES.copied(ALLIES[ally].name) : LINES.joined(ALLIES[ally].name));
        await talk(LINES.musouGot);
        await talk(LINES.grewSaved);
        await announceSkills(before);
        if (state.flags.early) for (const ally of joined) await awakenAlly(ally);
        wakeUp();
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
            musicOverride = undefined;   // 影と 朝の 曲は 場面で 決める
            await ending();
        } else {
            await saved(foe, before);
            if (await nightmareAfter(foe)) return;
        }
        wakeUp();
        return;
    }
    if (battle.over === 'devour') {
        musicOverride = null;   // 喰らう: 曲を その場で 止めて、短い音 (M19)
        sound.playBgm(null, { transition: 'hard' });
        sound.jingle('M19');
        const before = bakSkills(keep.growth);
        const result = devour(state, keep, foe.dream);
        await talk(LINES.devour[foe.dream]);
        await talk(LINES.grewEaten);
        await announceSkills(before);
        await tellReaped(result.other);
        if (await nightmareAfter(foe)) return;
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
        keep.brush = true;   // バクが 筆に 姿を変える (最初の夢で 手に入る)
        await talk(LINES.getBrush);
    }
    const drops = battle.foes.reduce((sum, f) => sum + (f.drop ?? 0), 0);   // 倒した スイマの 数だけ
    if (drops) {
        state.shards += drops;
        showHud();
        sound.se('SE07');
        await ui.say('', '夢のかけらを 取り戻した！', { wait: NOTE_MS });
        ui.hideMsg();
        if (!state.flags.firstSuima) {
            state.flags.firstSuima = true;
            await talk(LINES.firstSuima);
        }
    }
    await jingleDone;
}

// 経験値: 倒した 敵 (本音を 届けた・喰らった 敵も) の 合計を、パーティは そのまま、控えは 半分
async function awardExp(battle) {
    gainEmotions(keep, battle.party, battle.foes, battle.over);   // 夢感情 (倒した 敵の 属性に)
    const amount = battleExp(battle.foes.map((f) => ({ exp: (f.exp ?? 0) * (f.expRate ?? 1) })), layerOf()?.layer ?? 1);
    if (!amount) return;
    const hadYp = (keep.ypTotal ?? 0) > 0;
    const events = gainExp(state, keep, { party: keep.allies.slice(0, PARTY_SIZE), reserve: keep.allies.slice(PARTY_SIZE) }, amount);
    await ui.say('', LINES.expGot(amount), { wait: NOTE_MS });
    for (const event of events) {
        const name = ALLIES[event.id].name;
        await ui.say('', LINES.levelUp(name, event.lv), { wait: NOTE_MS });
        if (event.yp) await ui.say('', LINES.ypGot(event.yp), { wait: NOTE_MS });
        for (const label of event.moves) await ui.say('', LINES.moveLearned(name, label), { wait: NOTE_MS });
    }
    ui.hideMsg();
    if (!hadYp && (keep.ypTotal ?? 0) > 0) await talk(LINES.ypFirst);
}

// 育成画面。ユメポイントは 夢の毛布と 夜の ハルの部屋で 使える (仕様書「ユメポイント」)
function canSpendYp() {
    return state.map === 'home' && state.phase === 'night' && state.x >= 7;
}

async function growScreen(canSpend = canSpendYp()) {
    const head = MAPS[state.map].dream ? MAPS[state.map].dream : `${dateLabel(state.day)} ・ ${keep.loop}周目`;
    await openGrow({ input, units: grownUnits(), keep, state, head, canSpend, refresh: grownUnits });
}

// ---- 1 周目の 終わり方 (台本 2-5・2-5b) ---------------------------------
//   1 周目だけ: ミオか カナの ユメクイを 倒した夜、光る扉の前で ナイトメア戦 (必ず 負ける)。
//   どちらも 倒さないまま 救える 最後の夜 (9 日) が 来たら、ナイトメアの ほうから 来る。
//   負けると 12 日まで 眠り、病院で 目を覚ます。残りの日は 準備の 期間 (夢には 入れない)
async function nightmareAfter(foe) {
    if (keep.loop !== 1 || !PAIR.includes(foe.dream) || state.flags.nightmareDone) return false;
    const other = PAIR.find((id) => id !== foe.dream);
    await talk(LINES.nightmareAfter(NAMES[other]));
    await fight({ script: 'nightmare', foe: 'nightmare' });
    return true;
}

async function nightmareLoss() {
    hp = {};
    ui.hideHud();
    await film('NIGASANAI');   // 真っ黒な 画面に 赤い「に が さ な い」
    mode = 'scare';            // 次の 暗転まで 赤い字を 残す
    const from = state.day;
    sleepAfterNightmare(state, WAKE_DAY);
    state.nightFailed = true;
    await ui.fade(true);
    await playCalendar(from, WAKE_DAY);   // カレンダーが 1 枚ずつ めくれていく
    await talk(LINES.girlVoice);
    skipTear = true;
    wakeUp();
}

async function hospitalScene() {
    mode = 'black';
    await ui.fade(false);
    await talk(LINES.hospital);
    await talk(LINES.prepTalk);
    await ui.fade(true);
}

// ---- 終幕 (3 周目の 14 日の夜) ---------------------------------------------
const RETRY_WEAKEN = 0.85;   // 終幕の 戦いで 負けるたび、相手が 15% 弱る (詰まらないように)
async function finalBattle(foe, options = {}) {
    let scale = options.scale ?? 1;
    for (;;) {
        hp = {};
        const result = await fight({ script: 'final', foe, ...options, scale });
        if (result === 'win' || result === 'eatBoss') return;
        scale *= RETRY_WEAKEN;
        mode = 'black';
        await talk(LINES.finalRetry);   // 負けても 立ち上がって もう一度
    }
}

async function finale() {
    const route = routeOf(state, keep);
    mode = 'black';
    await talk(LINES.finaleCommon);
    if (route === 'good') {
        await talk(LINES.goodBefore);
        await finalBattle('nemuriboshi', { kizuna: kizunaFriends(state) });   // キズナ攻撃で ラスボスに 挑む
        mode = 'black';
        musicOverride = ENDING_BGM.good;
        await talk(LINES.goodAfter);
    } else if (route === 'yumekui') {
        await talk(LINES.yumekuiBefore);
        await finalBattle('rikuNightmare');   // ナイトメアの 代わりに リク・ナイトメア
        mode = 'black';
        await talk(LINES.yumekuiBoss);
        await finalBattle('nemuriboshi', { dreamEat: true });   // 夢喰いで ラスボスを 喰らう (実質 勝ちの イベント)
        mode = 'black';
        musicOverride = ENDING_BGM.yumekui;
        await talk(LINES.yumekuiAfter);
    } else {
        await talk(LINES.normalBefore);
        await finalBattle('nightmareFinal', { kizuna: [] });   // キズナ攻撃は 使えず、倒すしか ない
        const lost = absorbed(state);
        mode = 'black';
        await talk(LINES.normalSecond(lost.join('も、') || 'スイマたち'));
        await finalBattle('nightmare2', { kizuna: [], scale: 1 + ABSORB_RATE * lost.length });
        mode = 'black';
        musicOverride = ENDING_BGM.normal;   // 救った人の パートだけ 鳴る
        await talk(LINES.normalAfter);
        if (state.status.riku === 'saved') await talk(LINES.normalRikuSaved);
        else {
            await talk(LINES.normalRikuLost);
            const friends = kizunaFriends(state);
            await talk(friends.includes('ミオ') ? LINES.normalRikuLostMio : friends.length ? [] : LINES.normalAlone);
        }
    }
    await ui.say('', `${LINES.endTitles[route]}　……${LINES.endTail[route]}`);
    await ui.menu([{ id: 'title', label: LINES.toTitle }], { center: true });
    location.reload();
}

async function ending() {
    await ui.fade(true);
    ui.hideHud();
    mode = 'shadow';
    await ui.fade(false);
    await talk(LINES.shadow);
    await ui.fade(true);
    await playCalendar(1, 2);
    skipTear = true;
    mode = 'morning';
    await ui.fade(false);
    await talk(LINES.morning);
    keep.tutorial = true;
}

async function announceSkills(before) {
    const known = before.map((skill) => skill.id);
    for (const skill of bakSkills(keep.growth)) {
        if (!known.includes(skill.id)) {
            sound.se('SE34');
            await talk(LINES.learned(skill.label));
        }
    }
}

async function saved(foe, before) {
    const result = rescue(state, keep, foe.dream, foe.ally);
    await talk(LINES.rescued[foe.dream]);
    await talk(LINES.overcome[foe.dream]);   // 夢主が 自分の ユメクイと 話し、夢を 乗り越える
    const name = ALLIES[foe.ally].name;
    await talk(result.copied ? LINES.copied(name) : LINES.joined(name));
    await talk(LINES.grewSaved);
    await announceSkills(before);
    if (state.flags.early) await awakenAlly(foe.ally);
    if (foe.dream === 'riku') state.flags.rikuSavedDay = state.day;
    await tellReaped(result.other);
}

// 活性化の 前に 仲間にした ユメクイ: 弱いまま。前の周の 夢のかけらが あれば、使って 活性化できる
async function awakenAlly(ally) {
    setDormant(state, ally);
    const name = ALLIES[ally].name;
    await talk(LINES.dormantJoined(name));
    await offerDreamShard(ally);
}

async function offerDreamShard(ally) {
    const shard = dreamShardOf(keep, ally);
    if (!shard || !isDormant(state, ally)) return;
    const name = ALLIES[ally].name;
    await talk(LINES.shardHint(name));
    const id = await ui.menu([{ id: 'yes', label: LINES.shardYes }, { id: 'no', label: LINES.shardNo }], { head: LINES.shardHead(name, shard.lv) });
    if (id !== 'yes') return;
    useDreamShard(state, keep, ally);
    await talk(LINES.shardUsed(name, shard.lv));
}

// 心のかけらを 拾う。経験値の かけらは だれかに 持たせ、技の かけらは だれかに 覚えさせる
async function findHeart(object) {
    if (!pickHeart(keep, object.id)) return;
    state.gone[object.id] = true;
    const heart = HEARTS[object.id];
    await talk(LINES.heartFound(heart.label, heart.info));
    await useHeart(object.id);
}

async function useHeart(id) {
    const heart = HEARTS[id];
    const rec = heartsOf(keep)[id];
    if (heart.kind === 'move' && rec.taught) {
        await talk(LINES.heartTaughtAlready(ALLIES[rec.taught].name, heart.moveLabel));
        return;
    }
    const items = keep.allies.map((ally) => ({ id: ally, label: ALLIES[ally].name + (rec.holder === ally ? '（持っている）' : '') }));
    items.push({ id: 'cancel', label: 'あとで' });
    const who = await ui.menu(items, { head: heart.kind === 'exp' ? LINES.heartGiveHead : LINES.heartTeachHead(heart.moveLabel) });
    if (who === 'cancel') return;
    if (heart.kind === 'exp') {
        giveHeart(keep, id, who);
        await talk(LINES.heartGiven(ALLIES[who].name));
    } else {
        teachHeart(keep, id, who);
        await talk(LINES.moveLearnedTalk(ALLIES[who].name, heart.moveLabel));
    }
}

// メニューの「かけら」: 心のかけら と、使える 夢のかけら
async function shardMenu() {
    const items = Object.keys(heartsOf(keep)).map((id) => ({ id, label: HEARTS[id].label }));
    for (const ally of keep.allies) {
        if (isDormant(state, ally) && dreamShardOf(keep, ally)) items.push({ id: `dream:${ally}`, label: LINES.dreamShardName(ALLIES[ally].name) });
    }
    if (!items.length) {
        await talk(LINES.noShards);
        return;
    }
    items.push({ id: 'close', label: 'とじる' });
    const id = await ui.menu(items, { head: 'かけら', wide: true });
    if (id === 'close') return;
    if (id.startsWith('dream:')) await offerDreamShard(id.slice(6));
    else await useHeart(id);
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
    resetFollow();
    return explore();
}

// ---- 時間の演出 ----------------------------------------------------------

// 時間が過ぎていく (朝 → 昼 → 放課後 → 夕方 → 夜 のうち labels の順)。A で 飛ばせる
function playLapse(labels) {
    if (labels.length < 2) return Promise.resolve();
    ui.hideHud();
    ui.hideMsg();
    return new Promise((resolve) => {
        const off = input.onPress((key) => { if (key === 'a') lapse.start = -1e9; });
        lapse = { labels, start: performance.now(), done: () => { off(); resolve(); } };
        mode = 'lapse';
    });
}

// 1 日が 終わって、カレンダーが 1 枚 はがれる。A で 飛ばせる
async function playCalendar(from, to) {
    ui.hideHud();
    ui.hideMsg();
    await new Promise((resolve) => {
        const off = input.onPress((key) => { if (key === 'a') calendarView.start = -1e9; });
        calendarView = { from, to, start: performance.now() + 420, done: () => { off(); resolve(); } };
        mode = 'calendar';
        ui.fade(false);
    });
    await ui.fade(true);
}

// 戦闘に入るときの 演出 (その夢に 合わせた エフェクト)
function playEncounter(theme, boss) {
    ui.hideMsg();
    return new Promise((resolve) => {
        encounter = { theme, boss, start: performance.now(), done: resolve };
        mode = 'encounter';
    });
}

// ---- 演出スクリプト (ムービー) --------------------------------------------

// 番号で ムービーを 流す。2 回目からは 短い版 (あれば)。決定の 長押しで 飛ばせる
const FILM_EFFECTS = {
    // ホラー演出: ふつうなら 画面を 揺らす。ひかえめなら 揺らさない
    horror: (step, instant) => {
        if (instant || !step.shake || sound.settings().horror === 'soft') return;
        const screen = document.getElementById('screen');
        screen.classList.remove('shake');
        void screen.offsetWidth;
        screen.classList.add('shake');
    },
    calendar: (step) => playCalendar(step.from, step.to),
    lapse: (step) => playLapse(step.labels)
};
async function film(id) {
    const movie = MOVIES[id];
    const steps = stepsOf(movie, seenMovies.has(id));
    seenMovies.add(id);
    Object.assign(stage, createStage(), { soft: sound.settings().horror === 'soft' });
    const back = mode;
    mode = 'film';
    const player = createMoviePlayer({ stage, ui, sound, effects: FILM_EFFECTS });
    const result = await playFilm(steps, { stage, input, player });
    if (mode === 'film') mode = back;
    return result;
}

// ---- 朝の 通学路の ムービー ------------------------------------------------

const MOVIE_STEP_MS = 190;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ハルを 1 マスずつ 自動で 歩かせる (横に そろえてから 縦)
async function autoWalk([tx, ty]) {
    while (state.x !== tx || state.y !== ty) {
        const dx = Math.sign(tx - state.x);
        const dy = dx ? 0 : Math.sign(ty - state.y);
        state.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
        state.x += dx;
        state.y += dy;
        [walk.dx, walk.dy] = [dx, dy];
        walk.left = 1;
        showHud();
        await sleep(MOVIE_STEP_MS);
    }
}

// 手順 ({ walk: [x, y] } / { cast, say }) を 順に 流す。出来事の 人は 話し終わると 去る
async function playMovie(steps) {
    mode = 'movie';
    for (const step of steps) {
        if (step.walk) await autoWalk(step.walk);
        if (step.say) {
            actors = step.cast;
            await sleep(250);
            await talk(step.say);
            actors = [];
        }
    }
}

// 朝: ハルが 通学路 (坂道) を 歩く様子を ムービーで 流す。出てくる人と 話 (ヒント) は 日付・周・救った人で 変わる。
//   平日は 校門まで 歩いて 朝の ホームルームの 出来事 → 時間が 放課後まで 進む。土日は 商店街まで 歩くと 昼になる
async function morningPhase() {
    startMorning(state);
    const weekend = isWeekend(state.day);
    mode = 'movie';
    showHud();
    await ui.fade(false);
    if (LINES.morningEvent[state.day] && !state.flags[`morning${state.day}`]) {
        state.flags[`morning${state.day}`] = true;
        await talk(LINES.morningEvent[state.day]);
    }
    if (keep.loop >= 2 && state.day === 2 && !keep.duetTold) {
        keep.duetTold = true;
        await talk(LINES.duetLesson);
    }
    if (keep.loop >= 2 && state.day === 2 && !state.flags.loopAdvice) {
        // 2 周目からの 2 日: 完ぺきな 絵なら 活性化前でも 入れること、前の周に 入らなかった 夢にも 入ろうと バクが 言う
        state.flags.loopAdvice = true;
        const known = PAIR.filter((who) => knowsDream(keep, who) && state.status[who] === 'idle');
        if (known.length) await talk(LINES.earlyAdvice(known.map((who) => NAMES[who]).join('と')));
        const missed = PAIR.filter((who) => !keep.lastVisited?.[who] && state.status[who] === 'idle');
        if (missed.length) await talk(LINES.otherDreamAdvice(missed.map((who) => NAMES[who]).join('と')));
    }
    await playMovie(morningMovie(state, keep));
    if (!weekend) await talk(LINES.enterSchool);
    if (!weekend && LINES.homeroom[state.day] && !state.flags[`homeroom${state.day}`]) {
        state.flags[`homeroom${state.day}`] = true;
        await ui.fade(true);
        Object.assign(state, TOWN_START.weekday);
        mode = 'scene';
        showHud();
        await ui.fade(false);
        await talk(LINES.homeroom[state.day]);
    }
    await playLapse(timesBetween('朝', weekend ? '昼' : '放課後', weekend));
}

// 放課後 (土日は 昼): 学校と町を 歩いて 話す。夢主と じっくり話すか、家の玄関に入ると 夜になる
async function dayPhase() {
    startDay(state);
    if (keep.loop >= 3 && savedPair()) state.flags.rikuOpen = true;   // 3 周目、ミオと カナを 救ったことが あれば リクの家へ
    const done = explore();
    mode = 'scene';   // 日の始めの 出来事を 見せるまで 歩けない
    await ui.fade(false);
    await scene(async () => {
        if (state.flags.prepDay) {
            state.flags.prepDay = false;
            await talk(LINES.prepTown);
        }
        if (state.day === 14 && state.flags.dreamsClosed && !state.flags.lastSky) {
            state.flags.lastSky = true;
            await talk(LINES.lastDaySky);
        }
        if (LINES.day[state.day] && !state.flags[`day${state.day}`]) {
            state.flags[`day${state.day}`] = true;
            await talk(LINES.day[state.day]);
        }
        if (state.day === 10 && PAIR.some((id) => state.status[id] === 'broken')) await talk(LINES.broken);
        if (state.flags.duetSaved && !state.flags.duetAfter && state.day < 13) {
            state.flags.duetAfter = true;
            await talk(LINES.duetAfter);
        }
        if (state.day === 13 && state.flags.duetSaved) await talk(LINES.concertTogether);
    });
    await done;
    await playLapse(timesBetween(timeLabel(state), '夜', isWeekend(state.day)));   // 夕方 → 夜
}

// 夜: ハルの部屋を歩く。キャンバスに描いた夢にだけ入れる。描かずに ベッドで寝るか、
//   玄関から 夜の町へ出て 帰って寝ると、夢に入らずに 朝になる (仕様書「1日の流れ」)
async function nightPhase() {
    Object.assign(state, NIGHT_START);
    if (keep.loop === 1 && state.day === LAST_RESCUE_DAY && !state.flags.nightmareDone && PAIR.every((id) => state.status[id] === 'idle')) {
        mode = 'scene';
        await ui.fade(false);
        await talk(LINES.nightmareVisit);
        await fight({ script: 'nightmare', foe: 'nightmare' });
        return;
    }
    // リクを 救った 次の夜 (3 周目): 迷い (台本 4-4)
    const doubt = keep.loop >= 3 && state.status.riku === 'saved' && state.flags.rikuSavedDay && state.day > state.flags.rikuSavedDay && !state.flags.rikuDoubt;
    if (doubt) state.flags.rikuDoubt = true;
    state.nightOut = false;
    const done = explore();
    mode = 'scene';
    await ui.fade(false);
    await scene(async () => {
        if (doubt) await talk(LINES.rikuDoubt);
    });
    const ending = await done;
    if (ending?.dream) await enterDream(ending.dream);
}

// キャンバス: だれの夢を描くか選ぶ (描く画面は 段階2 で作る)
async function useCanvas() {
    if (state.flags.prologue) {
        await prologueCanvas();
        return;
    }
    if (state.phase !== 'night') {
        await talk(LINES.canvas);
        return;
    }
    if (state.nightOut) {
        await talk(LINES.canvasOut);
        return;
    }
    const dreams = dreamsTonight(state, keep);
    if (!keep.canvasTold) {
        keep.canvasTold = true;
        await talk(LINES.firstCanvas);
    }
    if (dreams.length && state.day < ACTIVE_DAY && !keep.earlyTold) {
        keep.earlyTold = true;
        await talk(LINES.perfectCanvas);
    }
    if (state.flags.dreamsClosed) await talk(LINES.canvasClosed);
    else if (!dreams.length && state.day < ACTIVE_DAY) {
        // 活性化の 前: 描いても 絵が 漠然としていて、夢の チャンネルに 引っかからない
        await talk(keep.channelTold ? LINES.notActiveAgain : LINES.notActive);
        keep.channelTold = true;
    } else if (!dreams.length) await talk(LINES.noDreamYet);
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
    await talk(id === 'duet' ? LINES.drewDuet : LINES.drew(NAMES[id]));
    await paintCanvas(id);
    if (id === 'duet' && isNightmare(keep)) await talk(LINES.nightmareWarn);
    wakeUp({ dream: id });
}

// 夜の キャンバスに 描く 画面。今の 段階の 絵に なる (十字キーで 線、A で 描き終える)
const CANVAS_COLORS = { water: [79, 134, 184], tempo: [176, 88, 104], sun: [214, 180, 70] };
const CANVAS_THEME = { mio: 'water', kana: 'tempo', riku: 'sun' };
async function paintCanvas(id) {
    const stage = stageOf(keep, id);
    const colors = id === 'duet' ? [CANVAS_COLORS.water, CANVAS_COLORS.tempo] : [CANVAS_COLORS[CANVAS_THEME[id]], CANVAS_COLORS[CANVAS_THEME[id]]];
    const caption = LINES.canvasCaption(stage, STAGES[stage].label);
    ui.hideHud();
    await new Promise((resolve) => {
        const off = input.onPress((key) => { if (key === 'a') finishPainting(painting, performance.now()); });
        sound.se('SE10');
        painting = createPainting(performance.now(), { colors, caption, blur: (5 - stage) / 4 });
        painting.done = () => { off(); resolve(); };
        mode = 'painting';
    });
    await new Promise((resolve) => setTimeout(resolve, 900));
    painting = null;
    mode = 'scene';
    showHud();
    await talk(LINES.canvasStageInfo(STAGES[stage].effect));
}

async function useBed() {
    if (state.flags.prologue) {
        if (!state.flags.painted) {
            await talk(LINES.bedNotYet);
            return;
        }
        const id = await ui.menu([{ id: 'yes', label: LINES.sleepYes }, { id: 'no', label: LINES.sleepNo }], { head: LINES.sleepHead });
        if (id === 'yes') wakeUp('sleep');
        return;
    }
    if (state.phase !== 'night') {
        await talk(LINES.bed);
        return;
    }
    const id = await ui.menu([{ id: 'yes', label: LINES.bedYes }, { id: 'no', label: LINES.bedNo }], { head: LINES.bedHead });
    if (id !== 'yes') return;
    await talk(LINES.slept);
    wakeUp('sleep');
}

function layerLabel(dreamId, layer) {
    const list = DREAM_LAYERS[dreamId];
    const name = MAPS[list[layer - 1]].name;
    return layer === list.length ? LINES.deepestLabel(name) : LINES.layerLabel(layer, name);
}

async function enterDream(id) {
    // たどり着いた 階層が あれば、どこから 始めるか 選ぶ (その周の あいだ)
    let layer = 1;
    const reached = startLayers(state, keep, id, DREAM_LAYERS[id].length);
    if (reached > 1) {
        const items = Array.from({ length: reached }, (_, i) => ({ id: String(i + 1), label: layerLabel(id, i + 1) }));
        layer = Number(await ui.menu(items, { head: LINES.layerHead, wide: true }));
    }
    const map = DREAM_LAYERS[id][layer - 1];
    const stage = stageOf(keep, id);
    const early = isEarly(state, id);   // 完ぺきな 絵で 活性化前に 入る (ボスは まだ 活性化していない)
    // リクの夢: 3 周目、リクの家で『引っ越し』を 聞いていれば しおれた 壁が 開く (台本 4-3)
    const wallOpens = id === 'riku' && keep.loop >= 3 && state.words.includes('引っ越し') && !state.flags.rikuWall;
    if (wallOpens) state.flags.rikuWall = true;
    state.flags.early = early;
    state.dreamsVisited ??= {};
    state.dreamsVisited[id] = true;
    await ui.fade(true);
    const entered = dream(map);
    state.sight = { ...sightOf(stage), nightmare: id === 'duet' && isNightmare(keep) };
    reachLayer(state, id, layer);
    mode = 'scene';   // 夢に入る セリフが 終わるまで 歩けない (フェードの あいだに 敵に ぶつからない)
    await ui.fade(false);
    await scene(async () => {
        if (layer === 1) {
            await talk(map === 'duet' ? LINES.duetEnter : LINES.enterDream[map]);
            if (early) await talk(LINES.earlyIn);
            else if (!state.flags.active && id !== 'riku') await talk(LINES.noBoss);
            if (wallOpens) await talk(LINES.rikuWallOpen);
        } else await talk(LINES.layerEnter(layerLabel(id, layer)));
        if (state.sight.nightmare) await talk(LINES.nightmareIn);
    });
    await entered;
    // 夢から 覚めると、夢の中で 見た 景色が 絵に 描き足される (その日に 言葉を 拾っていれば もう 1 段)
    state.sight = null;
    state.flags.early = false;
    if (state.nightFailed) {
        state.nightFailed = false;   // ナイトメアに 捕まった 夜は 失敗 (絵は 描き足されない)
        return;
    }
    const before = stageOf(keep, id);
    const after = growCanvas(keep, id, state.words.length > (state.wordsAtDay ?? 0));
    if (after > before) await talk(LINES.canvasGrew(after, STAGES[after].label));
    await askReborn();
}

// 夢感情が 100 に なった 仲間は、夢から 覚めたときに 夢変わり (夢昇華) するか 聞かれる
async function askReborn() {
    for (const p of pendingReborn(keep, grownUnits())) {
        const name = ALLIES[p.id].name;
        await talk(p.sublime ? LINES.sublimeAsk(name, p.attr) : LINES.rebornAsk(name, p.attr));
        const id = await ui.menu([{ id: 'yes', label: p.sublime ? LINES.sublimeYes : LINES.rebornYes }, { id: 'no', label: LINES.rebornNo }], { head: p.sublime ? LINES.sublimeHead : LINES.rebornHead });
        if (id === 'yes') {
            reborn(keep, p.id, p.attr, ALLIES[p.id].attr);
            const unit = grownUnits().find((u) => u.id === p.id);
            await talk(LINES.rebornDone(name, unit.name, unit.moves.extra.at(-1).label));
        } else {
            declineReborn(keep, p.id, p.attr);
            await talk(LINES.rebornLater);
        }
    }
}

async function campaign() {
    const first = dream('odoriba');
    await ui.fade(false);
    await first;
    for (;;) {
        await ui.fade(true);
        const before = state.day;
        const next = advance(state);
        if (next === 'loop') {
            mode = 'opening';
            ui.hideHud();
            await ui.fade(false);
            if (isFinalLoop(keep)) {
                await finale();   // 3 周目の 14 日の 夜で 小規模版は 終わる
                return;
            }
            musicOverride = 'M17';   // ループ「十四日目の夜」(M24 と ムービー MV07 は 段階5 の 続きで)
            await talk(LINES.loop);
            state = nextLoop(keep, state);
            await ui.fade(true);
            musicOverride = undefined;
        } else if (state.day !== before && !skipTear) {
            await playCalendar(before, state.day);
            // 土日: カレンダーが めくれたあと、朝が 飛んで 昼まで 時間が進む
            if (state.phase === 'day' && isWeekend(state.day)) {
                await playLapse(timesBetween('朝', '昼', true));
                await ui.fade(true);
            }
        }
        skipTear = false;
        if (state.flags.hospitalNext) {
            // 病院で 目を覚まし、そのまま 町へ (準備の 期間)
            state.flags.hospitalNext = false;
            await hospitalScene();
            state.phase = 'day';
            state.flags.prepDay = true;
        }
        if (state.phase === 'morning') await morningPhase();
        else if (state.phase === 'day') await dayPhase();
        else await nightPhase();
    }
}

// ---- 夢合わせ (言葉を つなげて 本音の 文を 作る) ----------------------------

async function weaveWords() {
    const fronts = frontChoices(state.words);
    const made = state.sentences ?? [];
    if (!fronts.length) {
        await talk(made.length ? LINES.sentenceList(made.map((s) => `${OWNER_NAMES[s.owner]}『${s.text}』`)) : LINES.weaveNone);
        return;
    }
    const items = fronts.map((w) => ({ id: w, label: `${w}（${OWNER_NAMES[WORDS[w].owner]}）` }));
    if (made.length) items.push({ id: 'list', label: '作った文を見る' });
    items.push({ id: 'cancel', label: 'やめる' });
    const first = await ui.menu(items, { head: LINES.weaveHead1, wide: true });
    if (first === 'cancel') return;
    if (first === 'list') {
        await talk(LINES.sentenceList(made.map((s) => `${OWNER_NAMES[s.owner]}『${s.text}』`)));
        return;
    }
    const chosen = [first];
    for (;;) {
        const next = nextChoices(state.words, chosen);
        const list = [...next.backs.map((w) => ({ id: w, label: `${chosen.join('、')}……${w}` }))];
        list.push(...next.fronts.map((w) => ({ id: `front:${w}`, label: `${chosen[0]}、${w}……（つづける）` })));
        list.push({ id: 'cancel', label: 'やめる' });
        const pick = await ui.menu(list, { head: LINES.weaveHead2, wide: true });
        if (pick === 'cancel') return;
        if (pick.startsWith('front:')) {
            chosen.push(pick.slice(6));
            continue;
        }
        const sentence = makeSentence(state, chosen, pick);
        await talk(sentence ? LINES.weaveMade(sentence.text) : LINES.weaveHave);
        return;
    }
}

// ---- 設定 --------------------------------------------------------------

async function fieldMenu() {
    const items = [{ id: 'grow', label: 'なかま' }, { id: 'shards', label: 'かけら' }, { id: 'bak', label: 'バクの成長' }, { id: 'keys', label: 'ボタン設定' }, { id: 'audio', label: '音の設定' }, { id: 'close', label: 'とじる' }];
    if (keep.tutorial) items.unshift({ id: 'weave', label: '夢合わせ' });
    if (keep.brush) items.unshift({ id: 'brush', label: '夢筆' });
    if (keep.tutorial && MAPS[state.map].dream) items.unshift({ id: 'wake', label: '夢から覚める' });
    const id = await ui.menu(items);
    if (id === 'keys') await settings();
    if (id === 'audio') await audioSettings();
    if (id === 'grow') await growScreen();
    if (id === 'shards') await shardMenu();
    if (id === 'weave') await weaveWords();
    if (id === 'brush') await talk(canUseBrush(state, keep) ? LINES.brushInfo(keep.images.map((i) => IMAGES[i].label).join('、')) : LINES.brushReal);
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

// 音の 設定: 曲・効果音・声の 音量 (選ぶたびに 10% ずつ。100% の 次は 0%) と ホラー演出
async function audioSettings() {
    const pct = (v) => `${Math.round(v * 100)}%`;
    for (;;) {
        const now = sound.settings();
        const items = [
            { id: 'bgm', label: `曲：${pct(now.bgm)}` },
            { id: 'se', label: `効果音：${pct(now.se)}` },
            { id: 'voice', label: `セリフの声：${pct(now.voice)}` },
            { id: 'horror', label: `ホラー演出：${now.horror === 'soft' ? 'ひかえめ' : 'ふつう'}` },
            { id: 'back', label: 'もどる' }
        ];
        const id = await ui.menu(items, { head: '音の設定', wide: true });
        if (id === 'back') return;
        if (id === 'horror') sound.set('horror', now.horror === 'soft' ? 'normal' : 'soft');
        else sound.set(id, stepVolume(now[id]));
    }
}

async function assignKey(action) {
    const { label } = ACTIONS.find((item) => item.id === action);
    ui.show(`「${label}」にするキーを押してください（Esc でやめる）`);
    const key = await input.capture();
    ui.hideMsg();
    if (key) input.assign(action, key);
}

// ---- プロローグ (台本 1-0: 2月1日の放課後) --------------------------------
// 校門から リクと 坂道を 下り (分かれ道で 別れる)、家で 父に 進路を 問われ、自分の部屋で 初めて キャンバスに 描く。
// 何を描いても 海のような絵に なる。ベッドで 眠ると オープニング (1-1) から ハルの夢へ

async function prologue() {
    Object.assign(state, { day: 1, phase: 'day', time: 'day' }, PROLOGUE_START);
    state.flags.prologue = true;
    state.flags.rikuWalk = true;
    resetFollow();
    const done = explore();
    mode = 'scene';
    await ui.fade(false);
    await scene(() => talk(LINES.prologueStart));
    await done;
    state.flags.prologue = false;
    state.phase = 'night';
    state.time = 'day';
}

// 歩くたびに 見る: 坂の分かれ道で リクと 別れる・自分の部屋に 入る
function prologueStep() {
    if (state.flags.rikuWalk && state.map === 'saka' && state.y >= RIKU_BRANCH_Y) scene(rikuLeaves);
    if (state.map === 'home' && state.x >= 8 && !state.flags.roomEntered) {
        state.flags.roomEntered = true;
        scene(() => talk(LINES.prologueRoom));
    }
}

async function rikuLeaves() {
    await talk(LINES.rikuBye);
    state.flags.rikuWalk = false;
    const riku = { who: 'riku', x: follow.x, y: follow.y };
    actors = [riku];
    while (riku.x < 24) {   // 分かれ道を 右へ 去っていく
        riku.x++;
        await sleep(110);
    }
    actors = [];
}

async function enterHomePrologue() {
    await ui.fade(true);
    Object.assign(state, { map: 'home', x: 3, y: 7, dir: 'up' });
    state.time = 'evening';
    resetFollow();
    showHud();
    await ui.fade(false);
    if (state.flags.homeTalk) return;
    state.flags.homeTalk = true;
    await talk(LINES.fatherTalk);
    // どれを選んでも 言葉が出ない
    await ui.menu(LINES.fatherChoices.map((label, i) => ({ id: 'c' + i, label })), { head: LINES.fatherHead });
    const screen = document.getElementById('screen');
    screen.classList.remove('shake');
    void screen.offsetWidth;
    screen.classList.add('shake');
    await talk(LINES.fatherAngry);
    await talk(LINES.fatherDone);
}

async function lookDesk() {
    if (state.flags.prologue && !state.flags.deskSeen) {
        state.flags.deskSeen = true;
        await talk(LINES.desk);
        return;
    }
    await talk(state.flags.painted || !state.flags.prologue ? LINES.seaPainting : LINES.deskAgain);
}

async function prologueCanvas() {
    if (state.flags.painted) {
        await talk(LINES.seaPainting);
        return;
    }
    if (!state.flags.deskSeen) {
        await talk(LINES.canvasBefore);
        return;
    }
    await talk(LINES.paintingTip);
    ui.hideHud();
    await new Promise((resolve) => {
        const off = input.onPress((key) => { if (key === 'a') finishPainting(painting, performance.now()); });
        painting = createPainting(performance.now());
        painting.done = () => { off(); resolve(); };
        mode = 'painting';
    });
    state.flags.painted = true;
    await talk(LINES.painted);
    mode = 'scene';
    painting = null;
    showHud();
}

// はじまりの 夢: 青い海の 砂浜に ハルが 一人。ゆがんで 暗くなり、大きな目と「おきろ」。チャイムで 目が覚める (A で 飛ばせる)
async function playIntro() {
    ui.hideHud();
    await new Promise((resolve) => {
        const off = input.onPress((key) => { if (key === 'a') intro.skip = true; });
        intro = { start: performance.now() + 420, done: () => { off(); resolve(); } };
        mode = 'intro';
        ui.fade(false);
    });
    mode = 'black';
    await talk(LINES.introWake);
    await ui.fade(true);
}

// ---- 全体 --------------------------------------------------------------

async function start() {
    mode = 'title';
    ui.hideHud();
    ui.title(true);
    for (;;) {
        const id = await ui.menu([{ id: 'start', label: 'はじめる' }, { id: 'keys', label: 'ボタン設定' }, { id: 'audio', label: '音の設定' }], { center: true });
        sound.unlock();   // スマホは 画面を 触るまで 音を 出せない
        if (id === 'start') break;
        ui.title(false);
        if (id === 'audio') await audioSettings();
        else await settings();
        ui.title(true);
    }
    ui.title(false);
    await ui.fade(true);
    await playIntro();
    await prologue();
    await ui.fade(true);
    ui.hideHud();
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
    if (mode === 'field' && state.chaser) updateChase(now);
    if (walk.left > 0 && mode !== 'field') walk.left = Math.max(0, walk.left - delta / WALK_MS);
    if (mode === 'intro' && intro) {
        if (drawIntro(ctx, intro, now) && !intro.finished) {
            intro.finished = true;
            intro.done();
        }
    } else if (mode === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 320, 240);
    } else if (mode === 'painting' && painting) {
        updatePainting(painting, input.direction(), delta, now);
        if (drawPainting(ctx, painting, now) && !painting.finished) {
            painting.finished = true;
            painting.done();
        }
    } else if (mode === 'lapse' && lapse) {
        if (drawLapse(ctx, lapse, now) && !lapse.finished) {
            lapse.finished = true;   // 最後の 絵の まま 止めておく (次の フェードまで)
            lapse.done();
        }
    } else if (mode === 'calendar' && calendarView) {
        if (drawCalendar(ctx, calendarView, now) && !calendarView.finished) {
            calendarView.finished = true;
            calendarView.done();
        }
    } else if (mode === 'encounter' && encounter) {
        drawField(ctx, state, walk, now, [], followerView());
        if (drawEncounter(ctx, encounter, now) && !encounter.finished) {
            encounter.finished = true;   // 真っ白の まま 止めておく (次の フェードまで)
            encounter.done();
        }
    } else if (mode === 'film') drawFilm(ctx, stage, now);
    else if (mode === 'battle' && battleView) drawBattle(ctx, battleView, now);
    else if (mode === 'shadow') drawShadow(ctx, now);
    else if (mode === 'morning') drawMorning(ctx);
    else if (mode === 'title' || mode === 'opening') drawSky(ctx, now);
    else if (mode === 'scare') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = '#e8203a';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(LINES.scareText, 160 + (Math.random() - 0.5) * 6, 126 + (Math.random() - 0.5) * 6);
        ctx.textAlign = 'left';
    } else drawField(ctx, state, walk, now, state.chaser ? [{ ...state.chaser, who: 'nightmare' }] : actors, followerView());
    updateMusic();
    requestAnimationFrame(frame);
}

// 場面に 合わせて 曲を 切り替える (同じ 曲なら 何もしない)
function updateMusic() {
    const map = MAPS[state.map];
    const id = bgmFor({
        mode, map, phase: state.phase, foes: battleView?.foeIds ?? [], chase: Boolean(state.chaser),
        prologue: state.flags.prologue ? { roomEntered: Boolean(state.flags.roomEntered) } : null, override: musicOverride
    });
    if (id === undefined) return;
    sound.playBgm(id, { transition: transitionFor(mode, id), layers: layersFor(id, state.status), wobble: wobbleFor(id, keep.loop, isFinalLoop(keep)) });
}

// ブラウザのテストが 状態を読むための窓口
window.yumekui = { get state() { return state; }, get mode() { return mode; }, get keep() { return keep; }, get bgm() { return sound.current(); }, get bgmPlaying() { return sound.playing(); },growScreen, finale, film };

requestAnimationFrame(frame);
start();
