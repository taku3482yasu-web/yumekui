import { facingOf, flipFor, portraitKind } from '../core/portraits.js';

const $ = (id) => document.getElementById(id);
const TYPE_MS = 28;

// sounds: { type(name, line, index) 1 文字 出るたび・cursor() カーソル移動・decide(id) 決めたとき } (音を 鳴らす)
export function createUi(input, sounds = {}) {
    const msg = $('msg');
    const speaker = $('speaker');
    const text = $('text');
    const menuBox = $('menu');

    // 文字を 1 字ずつ出す。A かタップで 全部出す。もう一度で 次へ
    function say(name, line, { wait = null } = {}) {
        return new Promise((resolve) => {
            msg.hidden = false;
            speaker.textContent = name;
            text.textContent = '';
            let shown = 0;
            let timer = null;
            let done = false;

            const finish = () => {
                clearInterval(timer);
                clearTimeout(autoTimer);
                stopTalking();
                off();
                msg.removeEventListener('pointerdown', advance);
                resolve();
            };
            const reveal = () => {
                clearInterval(timer);
                text.textContent = line;
                done = true;
                stopTalking();
                if (wait !== null) autoTimer = setTimeout(finish, wait);
            };
            const advance = () => (done ? finish() : reveal());
            // 話している 人の 立ち絵を 文字が 出ている あいだ 動かす (11/13 ユーザー指定: 本当に しゃべって いるように)
            const mouth = speakingEl;
            mouth?.classList.add('talking');
            const stopTalking = () => mouth?.classList.remove('talking');
            let autoTimer = null;
            const off = input.onPress((key) => {
                if (key === 'a' || key === 'b') advance();
            });
            msg.addEventListener('pointerdown', advance);
            timer = setInterval(() => {
                shown++;
                text.textContent = line.slice(0, shown);
                sounds.type?.(name, line, shown - 1);
                if (shown >= line.length) reveal();
            }, TYPE_MS);
        });
    }

    // onMove: カーソルが 動くたびに 呼ぶ (item)。ねらう 敵の 矢印を 動かす など
    function menu(items, { head = '', wide = false, tall = false, center = false, onMove = null, start = null } = {}) {
        return new Promise((resolve) => {
            menuBox.replaceChildren();
            menuBox.hidden = false;
            menuBox.classList.toggle('wide', wide);
            menuBox.classList.toggle('tall', tall);
            menuBox.classList.toggle('center', center);
            const cols = !wide && items.length > 5 ? 2 : 1;   // 6 つ 以上は 2 列に 並べる
            menuBox.classList.toggle('grid', cols === 2);
            if (head) {
                const title = document.createElement('div');
                title.className = 'head';
                title.textContent = head;
                menuBox.append(title);
            }
            let index = start != null && items[start] && !items[start].disabled ? start : items.findIndex((item) => !item.disabled);
            const close = (item) => {
                off();
                sounds.decide?.(item.id);
                menuBox.hidden = true;
                resolve(item.id);
            };
            const buttons = items.map((item, i) => {
                const button = document.createElement('button');
                button.textContent = item.label;
                button.disabled = Boolean(item.disabled);
                button.addEventListener('click', () => close(item));
                button.addEventListener('pointerenter', () => { index = i; paint(); });
                menuBox.append(button);
                return button;
            });
            const paint = () => {
                buttons.forEach((button, i) => button.classList.toggle('on', i === index));
                onMove?.(items[index]);
            };
            // 2 列の ときは 上下で 同じ 列の 上下へ、左右で 同じ 行の 左右へ (11/13 ユーザー指定)。端は 反対の 端へ 回る
            const move = (delta) => {
                let next = index;
                for (let tries = 0; tries < items.length; tries++) {
                    if (Math.abs(delta) === 1 && cols === 2) {
                        const row = Math.floor(next / 2);
                        const col = (next % 2 + 1) % 2;
                        next = row * 2 + col;
                        if (next >= items.length) next = row * 2;   // 最後の 行に 1 つ しか ない
                    } else {
                        const step = cols === 2 ? Math.sign(delta) * 2 : Math.sign(delta);
                        next += step;
                        if (cols === 2) {
                            const col = index % 2;
                            const rows = Math.ceil((items.length - col) / 2);
                            if (next >= items.length) next = col;
                            if (next < 0) next = col + (rows - 1) * 2;
                        } else next = (next + items.length) % items.length;
                    }
                    if (!items[next].disabled) break;
                }
                if (next === index) return;
                index = next;
                paint();
                sounds.cursor?.();
            };
            const off = input.onPress((key) => {
                if (key === 'up') move(cols === 2 ? -2 : -1);
                if (key === 'down') move(cols === 2 ? 2 : 1);
                if (cols === 2 && (key === 'left' || key === 'right')) move(1);
                if (key === 'a') close(items[index]);
            });
            paint();
        });
    }

    const hideMsg = () => { msg.hidden = true; };

    // 会話の 立ち絵。stage = { left, right, center, speaking } (core/portraits.js)、null で みんな 消す。
    //   話している人は 明るく、聞いている人は 暗く。読み込めない 絵 (まだ 無い 人) は 覚えておいて 出さない
    const missing = new Set();
    const sides = { left: $('portrait-left'), right: $('portrait-right'), center: $('portrait-center') };
    const showPortrait = (el) => {
        if (el.hidden) {   // はじめて 出る ときは 下から ふわっと
            el.classList.remove('enter');
            void el.offsetWidth;
            el.classList.add('enter');
        }
        el.hidden = false;
    };
    for (const el of Object.values(sides)) {
        el.addEventListener('load', () => { if (el.dataset.want === el.getAttribute('src')) showPortrait(el); });
        el.addEventListener('error', () => { missing.add(el.getAttribute('src')); el.hidden = true; });
        el.addEventListener('animationend', (event) => { if (event.animationName === 'portrait-enter') el.classList.remove('enter'); });
    }
    // 立ち絵を 先に 読みこんで 持っておく (11/13 ユーザー指定: 会話の とちゅうで 遅れて 出ていた)
    const loaded = new Map();
    function preload(paths) {
        return Promise.all(paths.filter(Boolean).map((path) => {
            if (!loaded.has(path)) {
                const image = new Image();
                image.src = path;
                loaded.set(path, (image.decode ? image.decode() : Promise.resolve()).catch(() => missing.add(path)));
            }
            return loaded.get(path);
        }));
    }
    // 会話の 前に その会話の 絵が そろうのを 待つ (待ちすぎない)
    const ready = (paths, ms = 700) => Promise.race([preload(paths), new Promise((resolve) => setTimeout(resolve, ms))]);
    let speakingEl = null;
    function portraits(stage, pathOf) {
        speakingEl = stage?.speaking ? sides[stage.speaking] : null;
        for (const [side, el] of Object.entries(sides)) {
            const who = stage?.[side];
            const path = who ? pathOf(who.name, who.expression) : null;
            el.dataset.want = path ?? '';
            el.dataset.kind = portraitKind(path) ?? '';
            el.classList.toggle('flip', flipFor(side, path));
            el.classList.toggle('listen', Boolean(stage?.speaking) && stage.speaking !== side);
            el.classList.toggle('ghost', Boolean(stage?.ghost));   // 戦闘の 本音の 選択肢: 少し 透かす
            el.classList.toggle('shade', Boolean(stage?.shade));   // 一瞬の 声 (ナイトメアの 中の ヒカリ): 暗く 透かす
            if (!path || missing.has(path)) {
                el.hidden = true;
                continue;
            }
            if (el.getAttribute('src') === path && el.complete && el.naturalWidth) showPortrait(el);
            else el.setAttribute('src', path);   // 表情が 変わる ときは 前の 絵を 出した まま 入れかえる (消えて 遅れて 出ない)
        }
    }

    // キズナ攻撃の カットイン: 仲間の 青い 横顔を 画面の 右から 左へ 0.8 秒で すべらせる (引き継ぎ書 5-2)。
    //   左へ 進むので 左を 向かせる (右向きの 絵は 反転)
    function cutin(path) {
        const el = $('cutin');
        if (!path || !el.animate) return Promise.resolve();
        el.src = path;
        el.hidden = false;
        const flip = facingOf(path) === 'right' ? ' scaleX(-1)' : '';
        const run = el.animate([
            { transform: `translateX(110%)${flip}`, opacity: 0.2 },
            { transform: `translateX(20%)${flip}`, opacity: 1, offset: 0.35 },
            { transform: `translateX(-20%)${flip}`, opacity: 1, offset: 0.75 },
            { transform: `translateX(-120%)${flip}`, opacity: 0 }
        ], { duration: 800, easing: 'ease-in-out' });
        return run.finished.catch(() => {}).then(() => { el.hidden = true; });
    }

    // 大きい 絵を まん中に 出して、ゆっくり 消す。出しきった ところで 返す (消えるのは そのあとも 続く)
    function bigArt(path) {
        const el = $('bigart');
        if (!path || !el.animate) return Promise.resolve();
        el.src = path;
        el.hidden = false;
        const run = el.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.92)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.2 },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1.02)', offset: 0.55 },
            { opacity: 0, transform: 'translate(-50%, -50%) scale(1.06)' }
        ], { duration: 2200, easing: 'ease-out' });
        run.finished.catch(() => {}).then(() => { el.hidden = true; });
        return new Promise((resolve) => setTimeout(resolve, 1200));
    }

    function fade(on) {
        $('fade').style.opacity = on ? 1 : 0;
        return new Promise((resolve) => setTimeout(resolve, 420));
    }

    // 左上に 日付と 時間帯 (夢の中では 夢の名前)、右上に 今いる場所 (仕様書「画面左上の表示」)
    function hud(place, state, date, time) {
        $('hud').hidden = false;
        $('date').textContent = date;
        $('time').textContent = time;
        $('time').dataset.time = time;
        $('place').textContent = place;
        $('items').textContent = `言葉 ${state.words.length}　夢のかけら ${state.shards}${state.snacks > 0 ? `　駄菓子 ${state.snacks}` : ''}`;
    }

    const hideHud = () => { $('hud').hidden = true; };

    // 敵は 何体でも 並べる (ねらっている 敵に ▶、倒れた 敵は うすく)。本音を持つ 敵は ココロゲージも
    function status(battle) {
        $('status').hidden = false;
        const box = $('foe-status');
        const many = battle.foes.length > 1;
        box.replaceChildren(...battle.foes.map((foe) => {
            const block = document.createElement('div');
            block.className = 'foe';
            block.classList.toggle('down', Boolean(foe.down));
            block.innerHTML = '<div class="row"><span class="name"></span><span class="attr"></span></div><div class="bar hp"><i></i></div>';
            const same = battle.foes.filter((f) => f.name === foe.name);   // 同じ 名前は A・B・C で 呼び分ける
            const name = same.length > 1 ? foe.name + 'ABCDE'[same.indexOf(foe)] : foe.name;
            block.querySelector('.name').textContent = (many && foe === battle.foe && !foe.down ? '▶' : '') + name;
            block.querySelector('.attr').textContent = foe.attr;
            paintBar(block.querySelector('.hp'), foe.hp / foe.maxHp);
            if (foe.truth) {
                const kokoro = document.createElement('div');
                kokoro.className = 'bar kokoro';
                kokoro.innerHTML = '<i></i>';
                kokoro.firstElementChild.style.width = `${foe.kokoro}%`;
                block.append(kokoro);
            }
            return block;
        }));
        paintUnit('ally-status', battle.ally);
        document.querySelector('#ally-status .num').textContent = `${battle.ally.hp}/${battle.ally.maxHp}`;
    }

    const hideStatus = () => { $('status').hidden = true; };

    function title(on) {
        $('title').hidden = !on;
    }

    function show(line) {
        msg.hidden = false;
        speaker.textContent = '';
        text.textContent = line;
    }

    return { say, show, menu, hideMsg, fade, hud, hideHud, status, hideStatus, title, portraits, preload, ready, cutin, bigArt };
}

function paintUnit(id, unit) {
    const box = $(id);
    box.querySelector('.name').textContent = unit.name;
    box.querySelector('.attr').textContent = unit.attr;
    paintBar(box.querySelector('.hp'), unit.hp / unit.maxHp);
}

function paintBar(bar, value) {
    const rate = Math.max(0, value);
    bar.classList.toggle('low', rate < 0.3);
    bar.firstElementChild.style.width = `${rate * 100}%`;
}
