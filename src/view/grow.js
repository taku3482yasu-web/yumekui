import { expToNext, levelOf, statCost, ypLeft, ypMoves, buyMove, buyStat, spentOf, YP_MAX_STEP, MAX_LEVEL } from '../core/level.js';
import { LEVEL_MOVES, YP_STATS } from '../data/growth.js';
import { sprite } from './sprites.js';

// 育成画面「そだてる」(デザイン「ユメクイ 育成画面」① ②)。
//   ◀▶ 仲間を きりかえ、▲▼ えらぶ、A のばす／おぼえる (canSpend のときだけ)、B もどる
//   units: growUnit で 作った 仲間 (今の ステータス)。refresh(): YP を 使ったあとに 作り直す
export function openGrow({ input, units, keep, state, head, canSpend, refresh }) {
    const box = document.getElementById('grow');
    let tab = 0;
    let row = 0;
    let note = '';

    return new Promise((resolve) => {
        box.hidden = false;
        const rows = () => (units[tab].id === 'bak' ? [...YP_STATS.map((s) => ({ kind: 'stat', id: s.id })), ...ypMoves(keep).map((m) => ({ kind: 'move', id: m.id }))] : []);
        const paint = () => {
            const unit = units[tab];
            box.replaceChildren(header(units, tab, head), unit.id === 'bak' ? bakBody(unit, keep, state, rows()[row], canSpend) : allyBody(unit, state), footer(unit, canSpend, note));
        };
        const off = input.onPress((key) => {
            note = '';
            if (key === 'b') {
                off();
                box.hidden = true;
                resolve();
                return;
            }
            if (key === 'left' || key === 'right') {
                tab = (tab + (key === 'left' ? -1 : 1) + units.length) % units.length;
                row = 0;
            }
            const list = rows();
            if (list.length && key === 'up') row = (row - 1 + list.length) % list.length;
            if (list.length && key === 'down') row = (row + 1) % list.length;
            if (key === 'a' && list.length) {
                const pick = list[row];
                if (!canSpend) note = 'ユメポイントは 夢の毛布か、夜の ハルの部屋で 使える。';
                else if (pick.kind === 'stat' ? buyStat(keep, pick.id) : buyMove(keep, pick.id)) {
                    units = refresh();
                    note = pick.kind === 'stat' ? 'のばした！' : 'おぼえた！';
                } else note = 'ユメポイントが たりない。';
            }
            paint();
        });
        paint();
    });
}

function el(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== '') node.textContent = text;
    return node;
}

function header(units, tab, head) {
    const top = el('div', 'g-head');
    const title = el('div', 'g-title');
    title.append(el('b', '', 'そだてる'), el('span', 'g-dim', head));
    const tabs = el('div', 'g-tabs');
    units.forEach((unit, i) => tabs.append(el('span', i === tab ? 'on' : '', unit.name)));
    top.append(title, tabs);
    return top;
}

// 左の 列: 絵・名前・属性・レベルと 経験値
function profile(unit, state) {
    const card = el('div', 'g-card g-profile');
    const pic = document.createElement('canvas');
    const art = sprite(unit.sprite);
    pic.width = art.width;
    pic.height = art.height;
    pic.getContext('2d').drawImage(art, 0, 0);
    pic.className = 'g-pic';
    const name = el('div', 'g-name');
    name.append(el('b', '', unit.name), el('span', `g-attr a-${unit.attr}`, unit.attr));
    const { lv, exp } = levelOf(state, unit.id);
    const need = expToNext(lv);
    const level = el('div', 'g-level');
    level.append(el('b', '', `Lv ${lv}`), el('span', 'g-dim', lv >= MAX_LEVEL ? 'さいだい' : `つぎまで ${need - exp}`));
    const bar = el('div', 'g-bar');
    const fill = el('i');
    fill.style.width = `${lv >= MAX_LEVEL ? 100 : Math.round((exp / need) * 100)}%`;
    bar.append(fill);
    card.append(pic, name, level, bar);
    return card;
}

function statusCard(unit) {
    const card = el('div', 'g-card');
    card.append(el('div', 'g-sub', 'ステータス'));
    const grid = el('div', 'g-stats');
    for (const [label, value] of [['体力', unit.maxHp], ['攻撃', unit.atk], ['防御', unit.def], ['素早さ', unit.spd]]) {
        const line = el('div');
        line.append(el('span', 'g-dim', label), el('span', '', String(value)));
        grid.append(line);
    }
    card.append(grid);
    return card;
}

// 個人ユメクイ: レベルで 覚える 技 (まだの 技は ？？？)
function allyBody(unit, state) {
    const body = el('div', 'g-body');
    const moves = el('div', 'g-card g-moves');
    moves.append(el('div', 'g-sub', '技'));
    const { lv } = levelOf(state, unit.id);
    for (const move of LEVEL_MOVES[unit.id] ?? []) {
        const known = move.lv <= lv;
        const line = el('div', known ? 'g-move' : 'g-move g-lock');
        const top = el('div', 'g-row');
        top.append(el('b', '', known ? move.label : '？？？'), el('span', 'g-dim', known ? `Lv${move.lv}` : `Lv${move.lv}で 覚える`));
        line.append(top);
        if (known) line.append(el('span', 'g-dim', move.info));
        moves.append(line);
    }
    const right = el('div', 'g-col');
    right.append(statusCard(unit), moves);
    body.append(profile(unit, state), right);
    return body;
}

// バク: ユメポイントで ステータスを のばす・技を おぼえる
function bakBody(unit, keep, state, focus, canSpend) {
    const body = el('div', 'g-body');
    const left = profile(unit, state);
    const yp = el('div', 'g-yp');
    yp.append(el('span', 'g-dim', 'もっている ユメポイント'), el('b', '', `${ypLeft(keep)} YP`), el('span', 'g-dim', `これまでに ${keep.ypTotal ?? 0}YP`));
    left.append(yp);
    const counts = el('div', 'g-row g-dim');
    counts.append(el('span', '', `救った夢 ${keep.growth.saved}`), el('span', '', `喰らった夢 ${keep.growth.eaten}`));
    left.append(counts);

    const stats = el('div', 'g-card');
    stats.append(el('div', 'g-sub', `ステータスを のばす（1段 ＋5%）`));
    const spent = spentOf(keep).stats;
    for (const stat of YP_STATS) {
        const n = spent[stat.id] ?? 0;
        const line = el('div', focus?.kind === 'stat' && focus.id === stat.id ? 'g-up on' : 'g-up');
        const top = el('div', 'g-row');
        const cost = statCost(keep, stat.id);
        top.append(el('span', '', stat.label), el('span', 'g-dim', cost === null ? 'さいだい' : `${n}/${YP_MAX_STEP}段 ・ 次 ${cost}YP`));
        const seg = el('div', 'g-seg');
        for (let i = 0; i < YP_MAX_STEP; i++) seg.append(el('i', i < n ? 'on' : ''));
        line.append(top, seg);
        stats.append(line);
    }
    const shown = el('div', 'g-row g-dim');
    shown.append(el('span', '', `体力 ${unit.maxHp}`), el('span', '', `攻撃 ${unit.atk}`), el('span', '', `防御 ${unit.def}`));
    stats.append(shown);

    const moves = el('div', 'g-card g-moves');
    moves.append(el('div', 'g-sub', '技を おぼえる（ループしても 残る）'));
    for (const move of ypMoves(keep)) {
        const on = focus?.kind === 'move' && focus.id === move.id;
        const line = el('div', `g-move${move.locked ? ' g-lock' : ''}${on ? ' on' : ''}`);
        const top = el('div', 'g-row');
        const cond = move.saved ? `救った夢 ${move.saved}` : `喰らった夢 ${move.eaten}`;
        const tag = move.learned ? 'おぼえた' : move.locked ? cond : `${move.cost}YP`;
        top.append(el('b', '', move.locked ? '？？？' : move.label), el('span', move.learned ? 'g-ok' : 'g-dim', tag));
        line.append(top);
        if (on && !move.locked) line.append(el('span', 'g-dim', move.info));
        moves.append(line);
    }
    body.append(left, stats, moves);
    body.classList.add('g-bak');
    return body;
}

function footer(unit, canSpend, note) {
    const foot = el('div', 'g-foot');
    if (note) foot.append(el('span', 'g-note', note));
    foot.append(el('span', '', '◀▶ 仲間'));
    if (unit.id === 'bak') foot.append(el('span', '', canSpend ? '▲▼ えらぶ ・ A のばす／おぼえる' : '▲▼ 見る'));
    foot.append(el('span', '', 'B もどる'));
    return foot;
}

