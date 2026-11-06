const $ = (id) => document.getElementById(id);
const TYPE_MS = 28;

export function createUi(input) {
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

    function fade(on) {
        $('fade').style.opacity = on ? 1 : 0;
        return new Promise((resolve) => setTimeout(resolve, 420));
    }

    function hud(place, state, date) {
        $('hud').hidden = false;
        $('place').textContent = `${date}　${place}`;
        $('items').textContent = `言葉 ${state.words.length}　夢のかけら ${state.shards}`;
    }

    const hideHud = () => { $('hud').hidden = true; };

    function status(battle) {
        $('status').hidden = false;
        paintUnit('foe-status', battle.foe);
        paintUnit('ally-status', battle.ally);
        const kokoro = document.querySelector('#foe-status .kokoro');
        kokoro.hidden = !battle.foe.truth;
        kokoro.firstElementChild.style.width = `${battle.foe.kokoro}%`;
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

    return { say, show, menu, hideMsg, fade, hud, hideHud, status, hideStatus, title };
}

function paintUnit(id, unit) {
    const box = $(id);
    box.querySelector('.name').textContent = unit.name;
    box.querySelector('.attr').textContent = unit.attr;
    const rate = Math.max(0, unit.hp / unit.maxHp);
    const bar = box.querySelector('.hp');
    bar.classList.toggle('low', rate < 0.3);
    bar.firstElementChild.style.width = `${rate * 100}%`;
}
