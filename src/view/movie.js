// 演出スクリプトの 再生 (命令の 意味は core/movie.js)。ドット絵を 2〜4 倍で 出して 動かす。
//   決定ボタンの 長押しで 飛ばせる。今ある 演出 (カレンダー・時間・描く画面 など) は call で 呼ぶ
import { runMovie, SKIP_HOLD_MS } from '../core/movie.js';
import { sprite } from './sprites.js';

const W = 320;
const H = 240;
const DEFAULT_SAY_MS = 1400;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function createStage() {
    return { bg: '#000000', actors: new Map(), anims: [], dark: 0, gray: false, shakeUntil: 0, text: null, holdStart: null, soft: false };
}

// 時間で 値を 動かす (move・zoom・dark)
function animate(stage, apply, ms, now) {
    return new Promise((resolve) => {
        stage.anims.push({ start: now, ms: Math.max(1, ms), apply, done: resolve });
    });
}

// player.run(step, instant): 1 つの 命令を 実行する
export function createMoviePlayer({ stage, ui, sound, effects = {}, now = () => performance.now(), sleep }) {
    const wait = (ms) => (sleep ? sleep(ms) : new Promise((resolve) => setTimeout(resolve, ms)));
    async function run(step, instant) {
        if ('bg' in step) stage.bg = step.bg;
        if ('show' in step) {
            stage.actors.set(step.show, {
                frames: step.frames ?? [step.sprite], frameMs: step.frameMs ?? 200, start: now(),
                x: step.x ?? W / 2, y: step.y ?? H / 2, scale: step.scale ?? 3, flip: Boolean(step.flip), alpha: step.alpha ?? 1
            });
        }
        if ('hide' in step) stage.actors.delete(step.hide);
        if ('frames' in step && !('show' in step)) {
            const actor = stage.actors.get(step.frames);
            if (actor) Object.assign(actor, { frames: step.list, frameMs: step.frameMs ?? actor.frameMs, start: now() });
        }
        if ('move' in step) {
            const actor = stage.actors.get(step.move);
            if (actor) {
                const [fx, fy] = [actor.x, actor.y];
                const [tx, ty] = step.to;
                const apply = (t) => { actor.x = fx + (tx - fx) * t; actor.y = fy + (ty - fy) * t; };
                if (instant || !step.ms) apply(1);
                else await animate(stage, apply, step.ms, now());
            }
        }
        if ('zoom' in step) {
            const actor = stage.actors.get(step.zoom);
            if (actor) {
                const from = actor.scale;
                const apply = (t) => { actor.scale = from + (step.scale - from) * ease(t); };
                if (instant || !step.ms) apply(1);
                else await animate(stage, apply, step.ms, now());
            }
        }
        if ('dark' in step) {
            const from = stage.dark;
            const apply = (t) => { stage.dark = from + (step.dark - from) * t; };
            if (instant || !step.ms) apply(1);
            else await animate(stage, apply, step.ms, now());
        }
        if ('gray' in step) stage.gray = Boolean(step.gray);
        if ('shake' in step && !instant) stage.shakeUntil = now() + step.shake;
        if ('text' in step) stage.text = step.text ? { value: step.text, color: step.color ?? '#ffffff', size: step.size ?? 22, jitter: step.jitter ?? 0 } : null;
        if ('se' in step && !instant) sound?.se(step.se);
        if ('bgm' in step) sound?.playBgm(step.bgm, { transition: step.hard ? 'hard' : 'fade' });
        if ('call' in step && effects[step.call]) await effects[step.call](step, instant);
        if (instant) return;
        if ('say' in step) {
            const [name, line] = step.say;
            await ui.say(name, line, { wait: step.ms ?? DEFAULT_SAY_MS });
            ui.hideMsg();
        }
        if ('wait' in step) await wait(step.wait);
        if ('text' in step && step.ms) await wait(step.ms);
    }
    return { run };
}

// ムービーを 1 本 流す。決定 (A) の 長押しで 飛ばす
export async function playFilm(steps, { stage, input, player }) {
    let skip = false;
    const offPress = input.onPress((key) => { if (key === 'a') stage.holdStart = performance.now(); });
    const timer = setInterval(() => {
        if (stage.holdStart === null) return;
        if (!input.isHeld('a')) stage.holdStart = null;
        else if (performance.now() - stage.holdStart >= SKIP_HOLD_MS) skip = true;
    }, 50);
    try {
        return await runMovie(steps, player, { skipped: () => skip });
    } finally {
        offPress();
        clearInterval(timer);
        stage.holdStart = null;
        for (const anim of stage.anims) anim.done();
        stage.anims = [];
    }
}

export function drawFilm(ctx, stage, now) {
    // 動いている 命令を 進める
    stage.anims = stage.anims.filter((anim) => {
        const t = Math.min(1, (now - anim.start) / anim.ms);
        anim.apply(t);
        if (t >= 1) anim.done();
        return t < 1;
    });
    ctx.save();
    if (now < stage.shakeUntil) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    ctx.fillStyle = stage.bg;
    ctx.fillRect(-8, -8, W + 16, H + 16);
    if (stage.gray) ctx.filter = 'grayscale(1)';
    for (const actor of stage.actors.values()) {
        const name = actor.frames[Math.floor((now - actor.start) / actor.frameMs) % actor.frames.length];
        const image = sprite(name);
        if (!image) continue;
        const w = image.width * actor.scale;
        const h = image.height * actor.scale;
        ctx.globalAlpha = actor.alpha;
        if (actor.flip) {
            ctx.save();
            ctx.translate(Math.round(actor.x), 0);
            ctx.scale(-1, 1);
            ctx.drawImage(image, Math.round(-w / 2), Math.round(actor.y - h / 2), w, h);
            ctx.restore();
        } else ctx.drawImage(image, Math.round(actor.x - w / 2), Math.round(actor.y - h / 2), w, h);
        ctx.globalAlpha = 1;
    }
    ctx.filter = 'none';
    if (stage.dark > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${stage.dark})`;
        ctx.fillRect(-8, -8, W + 16, H + 16);
    }
    if (stage.text) {
        const j = stage.text.jitter * (stage.soft ? 0.3 : 1);   // ホラー演出が ひかえめなら ふるえを 弱く
        ctx.fillStyle = stage.text.color;
        ctx.font = `bold ${stage.text.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(stage.text.value, W / 2 + (Math.random() - 0.5) * j, H / 2 + 6 + (Math.random() - 0.5) * j);
        ctx.textAlign = 'left';
    }
    ctx.restore();
    // 長押しの あいだ、右下に 飛ばす 印 (たまっていく 線)
    if (stage.holdStart !== null) {
        const t = Math.min(1, (now - stage.holdStart) / SKIP_HOLD_MS);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px sans-serif';
        ctx.fillText('長押しで とばす', W - 84, H - 12);
        ctx.fillRect(W - 84, H - 8, 76 * t, 2);
    }
}
