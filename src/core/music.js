// どの場面で どの曲を 鳴らすか (サウンドリスト「曲リスト」「入れ方の決まり」)。
//   bgmFor() の 答え: 曲の 番号 (M06 など) = その曲にする / null = 曲を 止める / undefined = 今の曲の まま
import { BGM, DEFAULT_AUDIO, SE, SILENT_SPEAKERS, SOFT_HORROR_RATE, VOICES } from '../data/sounds.js';

// 夢の 名前 (地図の dream) → 夢の 曲
export const DREAM_BGM = {
    '顔色の坂道': 'M03',
    '水底の音楽室': 'M08',
    '止まらない練習室': 'M09',
    '二重奏ホール': 'M12',
    'ひまわり畑': 'M14'
};

// ボスの 曲 (いない 敵は 通常バトル M04)。ネムリボシは 小規模版に 曲が 無いので 仮に M15
export const BOSS_BGM = {
    muresuima: 'M05',
    duetSuima: 'M05',
    gakufume: 'M10',
    togemetoro: 'M11',
    duetDo: 'M13',
    duetAi: 'M13',
    himawarion: 'M16',
    nightmare: 'M15',
    nightmareFinal: 'M15',
    nightmare2: 'M15',
    rikuNightmare: 'M15',
    nemuriboshi: 'M15'
};

export const ENDING_BGM = { good: 'M20', normal: 'M21', yumekui: 'M22' };
export const TOWN_PEOPLE = ['mio', 'kana', 'riku'];

// 曲を その場で 止める (フェードしない) 場面: 影・ナイトメアの「にがさない」
const HARD_STOP_MODES = ['scare', 'shadow'];
const MAP_MODES = ['field', 'scene', 'movie'];

export function battleBgm(foeIds = []) {
    for (const id of foeIds) if (BOSS_BGM[id]) return BOSS_BGM[id];
    return 'M04';
}

// 場面から 曲を 決める。override は 物語の 場面で 決めた 曲 (エンディングなど。null なら 無音)
export function bgmFor({ mode, map = null, phase = 'day', foes = [], chase = false, prologue = null, override } = {}) {
    if (mode === 'battle') return battleBgm(foes);   // 戦いは 物語の 場面の 曲より 先
    if (override !== undefined) return override;
    if (mode === 'title' || mode === 'opening') return 'M01';
    if (mode === 'intro') return null;
    if (HARD_STOP_MODES.includes(mode)) return null;
    if (mode === 'morning') return 'M06';
    // 地図の 上 (歩く・話す・朝の 通学路) だけ 地図で 決める。ほかの 演出の あいだは 今の曲の まま
    if (!MAP_MODES.includes(mode) || !map) return undefined;
    if (chase) return 'M15';
    if (map.dream) return DREAM_BGM[map.dream] ?? 'M03';
    // プロローグの 家: 父との 会話は 曲なし (時計の 音)、自分の部屋に 入ってから M07
    if (prologue && map.id === 'home') return prologue.roomEntered ? 'M07' : null;
    if (phase === 'night') return 'M07';
    return 'M06';
}

// 切り替え方: hard = その場で 止める / fast = すばやく (バトル開始) / fade = 0.5 秒で 入れ替える
export function transitionFor(mode, id) {
    if (id === null && HARD_STOP_MODES.includes(mode)) return 'hard';
    if (mode === 'battle') return 'fast';
    return 'fade';
}
export const FADE_SEC = { hard: 0, fast: 0.15, fade: 0.5 };

// 同時に 鳴らす パート。町の曲は 喰らった人の パートを 消し、ノーマルED は 救った人の パートだけ
export function layersFor(id, status = {}) {
    const layers = BGM[id]?.layers;
    if (!layers) return [];
    const names = Object.keys(layers);
    if (id === 'M21') return names.filter((who) => status[who] === 'saved');
    return names.filter((who) => status[who] !== 'eaten');
}

// 周回ごとの テープの ゆれ (町の曲だけ)。周を 重ねるほど 大きく、最終周だけ 消す。値は ピッチの ゆれ幅 (セント)
export const WOBBLE_CENTS = 8;
export function wobbleFor(id, loop = 1, final = false) {
    if (!BGM[id]?.town || final) return 0;
    return Math.max(0, loop - 1) * WOBBLE_CENTS;
}

// 曲の ファイル名 (版ちがいが あれば M18_mio のように)
export function bgmFile(id, version = null) {
    const entry = BGM[id];
    if (!entry) return null;
    if (version && entry.versions?.includes(version)) return `${entry.file.split('_')[0]}_${version}`;
    return entry.file;
}

// セリフの 声: 話す人 → 声の ファイル (null なら 鳴らさない)
export function voiceOf(name = '') {
    if (SILENT_SPEAKERS.includes(name)) return null;
    return VOICES[name] ?? 'other';
}

// 1 文字ごとの 声を 鳴らすか: 「……」や 空白・記号では 鳴らさない。2 文字に 1 回 (うるさく ならないように)
export function voicedAt(line, index) {
    const ch = line[index];
    if (!ch || /[\s…・、。！？!?「」『』（）()ー〜]/.test(ch)) return false;
    return index % 2 === 0;
}

// 効果音の 音量 (ホラーの 音は ひかえめで 小さく)
export function seVolume(id, settings = DEFAULT_AUDIO) {
    const base = settings.se ?? DEFAULT_AUDIO.se;
    return SE[id]?.horror && settings.horror === 'soft' ? base * SOFT_HORROR_RATE : base;
}

// 音量の 設定を 正しい 形に そろえる (保存された 値が 壊れていても 初期値で 補う)
export function normalizeAudio(saved = {}) {
    const clamp = (v, d) => (typeof v === 'number' && v >= 0 && v <= 1 ? Math.round(v * 10) / 10 : d);
    return {
        bgm: clamp(saved.bgm, DEFAULT_AUDIO.bgm),
        se: clamp(saved.se, DEFAULT_AUDIO.se),
        voice: clamp(saved.voice, DEFAULT_AUDIO.voice),
        horror: saved.horror === 'soft' ? 'soft' : 'normal'
    };
}

// 音量を 1 段 (10%) 上げ下げ。100% の 次は 0% に もどる
export function stepVolume(value) {
    const next = Math.round((value + 0.1) * 10) / 10;
    return next > 1 ? 0 : next;
}
