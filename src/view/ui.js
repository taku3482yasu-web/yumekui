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
                off();
                msg.removeEventListener('pointerdown', advance);
                resolve();
            };
            const reveal = () => {
                clearInterval(timer);
                text.textContent = line;
                done = true;
                if (wait !== null) autoTimer = setTimeout(finish, wait);
            };
            const advance = () => (done ? finish() : reveal());
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

    function menu(items, { head = '', wide = false, tall = false, center = false } = {}) {
        return new Promise((resolve) => {
            menuBox.replaceChildren();
            menuBox.hidden = false;
            menuBox.classList.toggle('wide', wide);
            menuBox.classList.toggle('tall', tall);
            menuBox.classList.toggle('center', center);
            menuBox.classList.toggle('grid', !wide && items.length > 5);
            if (head) {
                const title = document.createElement('div');
                title.className = 'head';
                title.textContent = head;
                menuBox.append(title);
            }
            let index = items.findIndex((item) => !item.disabled);
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
            const paint = () => buttons.forEach((button, i) => button.classList.toggle('on', i === index));
            const move = (delta) => {
                let next = index;
                do {
                    next = (next + delta + items.length) % items.length;
                } while (items[next].disabled);
                index = next;
                paint();
                sounds.cursor?.();
            };
            const off = input.onPress((key) => {
                if (key === 'up') move(-1);
                if (key === 'down') move(1);
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
    for (const el of Object.values(sides)) {
        el.addEventListener('load', () => { if (el.dataset.want === el.getAttribute('src')) el.hidden = false; });
        el.addEventListener('error', () => { missing.add(el.getAttribute('src')); el.hidden = true; });
    }
    function portraits(stage, pathOf) {
        for (const [side, el] of Object.entries(sides)) {
            const who = stage?.[side];
            const path = who ? pathOf(who.name, who.expression) : null;
            el.dataset.want = path ?? '';
            el.dataset.kind = portraitKind(path) ?? '';
            el.classList.toggle('flip', flipFor(side, path));
            el.classList.toggle('listen', Boolean(stage?.speaking) && stage.speaking !== side);
            el.classList.toggle('ghost', Boolean(stage?.ghost));   // 戦闘の 本音の 選択肢: 少し 透かす
            if (!path || missing.has(path)) {
                el.hidden = true;
                continue;
            }
            if (el.getAttribute('src') === path && el.complete && el.naturalWidth) el.hidden = false;
            else {
                el.hidden = true;
                el.setAttribute('src', path);
            }
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
            block.querySelector('.name').textContent = (many && foe === battle.foe && !foe.down ? '▶' : '') + foe.name;
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

    return { say, show, menu, hideMsg, fade, hud, hideHud, status, hideStatus, title, portraits, cutin };
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
