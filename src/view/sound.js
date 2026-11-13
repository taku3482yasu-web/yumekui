// 曲・効果音・セリフの声を 鳴らす (Web Audio)。曲は 番号 (M06 など) で 呼ぶ。
//   ファイルが 無いときは 何も 鳴らさない (エラーに しない)。ファイルを 置けば そのまま 鳴る。
//   ブラウザは 画面を 触るまで 音を 出せないので、最初に キーか 画面が 押されたときに 始める
import { AUDIO_DIR, BGM, SE } from '../data/sounds.js';
import { bgmFile, FADE_SEC, normalizeAudio, seVolume } from '../core/music.js';

const STORE = 'yumekui.audio';
const BASE = import.meta.env?.BASE_URL ?? './';
const WOBBLE_HZ = 0.35;   // テープの ゆれの 速さ

function loadSettings() {
    try {
        return normalizeAudio(JSON.parse(localStorage.getItem(STORE)) ?? {});
    } catch {
        return normalizeAudio();
    }
}

function saveSettings(settings) {
    try {
        localStorage.setItem(STORE, JSON.stringify(settings));
    } catch {
        // 保存できない 環境では、開いている 間だけ 有効
    }
}

export function createSound() {
    const settings = loadSettings();
    const buffers = new Map();   // ファイル名 → Promise<AudioBuffer | null>
    let ctx = null;
    let gains = null;
    let current = null;          // 今の曲 { id, nodes, gain, layers }
    let wanted = undefined;      // 鳴らしたい 曲 (音が 始まる 前に 決まった ものも 覚えておく)
    let token = 0;

    const ext = (() => {
        try {
            return new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? ['ogg', 'mp3'] : ['mp3', 'ogg'];
        } catch {
            return ['mp3', 'ogg'];
        }
    })();

    function unlock() {
        if (!ctx) {
            const Ctx = window.AudioContext ?? window.webkitAudioContext;
            if (!Ctx) return;
            ctx = new Ctx();
            gains = {};
            for (const kind of ['bgm', 'se', 'voice']) {
                gains[kind] = ctx.createGain();
                gains[kind].gain.value = settings[kind];
                gains[kind].connect(ctx.destination);
            }
            if (wanted) {
                const before = wanted;
                wanted = undefined;
                playBgm(before.id, before.options);
            }
        }
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    }
    for (const type of ['keydown', 'pointerdown']) addEventListener(type, unlock, { passive: true });

    // 1 つの ファイルを 読む。ogg と mp3 の 鳴らせるほうから。無ければ null
    function load(dir, name) {
        const key = dir + name;
        if (!buffers.has(key)) {
            buffers.set(key, (async () => {
                for (const e of ext) {
                    try {
                        const res = await fetch(`${BASE}${dir}${name}.${e}`);
                        const type = res.headers.get('content-type') ?? '';
                        if (!res.ok || type.includes('text/html')) continue;   // 無い ファイル (開発中は index.html が 返る)
                        return await ctx.decodeAudioData(await res.arrayBuffer());
                    } catch {
                        // 読めない・こわれた ファイルは 次の 形式へ
                    }
                }
                return null;
            })());
        }
        return buffers.get(key);
    }

    function stopCurrent(sec) {
        if (!current) return;
        const { gain, nodes } = current;
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + sec);
        for (const node of nodes) {
            try {
                node.stop(now + sec + 0.05);
            } catch {
                // もう 止まっている
            }
        }
        current = null;
    }

    // 曲を 鳴らす。id が null なら 止める。layers は 同時に 鳴らす パートの 名前、wobble は テープの ゆれ (セント)
    async function playBgm(id, options = {}) {
        const { transition = 'fade', layers = [], wobble = 0, version = null } = options;
        // 同じ 曲なら 読み直さない (パートと ゆれが 変わったときだけ 合わせる)
        if (wanted && wanted.id === id && (wanted.options.version ?? null) === version) {
            const was = wanted.options;
            wanted = { id, options };
            if (String(was.layers ?? []) !== String(layers)) setLayers(layers);
            if ((was.wobble ?? 0) !== wobble) setWobble(wobble);
            return;
        }
        wanted = { id, options };
        if (!ctx) return;
        const sec = FADE_SEC[transition] ?? FADE_SEC.fade;
        const mine = ++token;
        stopCurrent(sec);
        if (!id || !BGM[id]) return;
        const entry = BGM[id];
        const names = { main: bgmFile(id, version) };
        for (const [who, file] of Object.entries(entry.layers ?? {})) names[who] = file;
        const loaded = await Promise.all(Object.entries(names).map(async ([who, file]) => [who, await load(AUDIO_DIR.bgm, file)]));
        if (mine !== token) return;   // 読んでいる あいだに 別の 曲に 変わった
        const main = loaded.find(([who]) => who === 'main')[1];
        if (!main) return;   // 本体が 無ければ 鳴らさない
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(gains.bgm);
        const start = ctx.currentTime + 0.02;
        const nodes = [];
        const parts = {};
        // テープの ゆれ: すべての パートの ピッチを ゆっくり 揺らす
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = WOBBLE_HZ;
        depth.gain.value = wobble;
        lfo.connect(depth);
        lfo.start(start);
        nodes.push(lfo);
        for (const [who, buffer] of loaded) {
            if (!buffer) continue;
            const node = ctx.createBufferSource();
            node.buffer = buffer;
            node.loop = Boolean(entry.loop);
            // イントロを 1 回だけ 鳴らし、loopStart〜曲の終わりを くり返す (小節の 切れ目で 切ってある)
            if (node.loop && who === 'main' && entry.loopStart) node.loopStart = Math.min(entry.loopStart, buffer.duration - 0.1);
            depth.connect(node.detune);
            const part = ctx.createGain();
            part.gain.value = who === 'main' || layers.includes(who) ? 1 : 0;
            node.connect(part).connect(gain);
            node.start(start);
            nodes.push(node);
            parts[who] = part;
        }
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(1, start + Math.max(sec, 0.02));
        current = { id, version, gain, nodes, parts, depth };
    }

    function setLayers(layers) {
        if (!current) return;
        for (const [who, part] of Object.entries(current.parts)) {
            if (who === 'main') continue;
            part.gain.setTargetAtTime(layers.includes(who) ? 1 : 0, ctx.currentTime, 0.1);
        }
    }

    function setWobble(cents) {
        if (current) current.depth.gain.setTargetAtTime(cents, ctx.currentTime, 0.2);
    }

    // 短い 音を 1 回 鳴らす (効果音・声・ジングル)
    const jingles = new Set();   // 鳴っている 短い曲 (次の 戦闘が 始まったら 止める)
    async function once(kind, dir, file, volume = 1) {
        if (!ctx || !file) return;
        const buffer = await load(dir, file);
        if (!buffer) return;
        const node = ctx.createBufferSource();
        node.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        node.connect(gain).connect(gains[kind]);
        node.start();
        if (kind === 'bgm') {
            jingles.add(node);
            node.addEventListener('ended', () => jingles.delete(node));
        }
        await new Promise((resolve) => { node.onended = resolve; });   // 鳴り終わるまで (待つ かどうかは 呼ぶ側が 決める)
    }

    return {
        unlock,
        playBgm,
        current: () => wanted?.id ?? null,       // 鳴らしたい 曲
        playing: () => current?.id ?? null,      // ほんとうに 鳴っている 曲 (ファイルが 無ければ null)
        // 効果音 (ホラーの 音は 設定で 小さく)
        se(id) {
            if (!SE[id]) return;
            once('se', AUDIO_DIR.se, SE[id].file, seVolume(id, settings) / Math.max(settings.se, 0.01));
        },
        // 短い 曲 (救ったときの M18 など)。曲の 音量で 鳴らす
        // 短い曲。返り値は 鳴り終わる (ファイルが 無ければ すぐ) promise
        jingle(id, version = null) {
            return once('bgm', AUDIO_DIR.bgm, bgmFile(id, version));
        },
        // 短い曲を 先に 読みこんでおく (勝った その瞬間に 鳴らせる ように。ファイルの 読みこみ待ちで 遅れていた)
        preload(id, version = null) {
            if (ctx) load(AUDIO_DIR.bgm, bgmFile(id, version));
        },
        // 鳴っている 短い曲を 止める (止めると 待っている promise も 終わる)
        stopJingles() {
            for (const node of jingles) {
                try { node.stop(); } catch { /* もう 止まっている */ }
            }
            jingles.clear();
        },
        voice(file) {
            once('voice', AUDIO_DIR.voice, file);
        },
        settings: () => ({ ...settings }),
        set(kind, value) {
            settings[kind] = value;
            if (gains?.[kind]) gains[kind].gain.value = value;
            saveSettings(settings);
        }
    };
}
