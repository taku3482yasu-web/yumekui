import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, isBlocked } from '../src/core/field.js';
import { createKeep } from '../src/core/calendar.js';
import { MORNING_START, startMorning } from '../src/core/town.js';
import { morningMovie, pickMorningEvents, MORNING_EVENTS } from '../src/scenes/mornings.js';
import { LINES } from '../src/scenes/story.js';

function morningOf(day, setup = () => {}) {
    const state = createState();
    const keep = createKeep();
    keep.tutorial = true;
    state.day = day;
    state.phase = 'morning';
    state.flags.bak = true;
    setup(state, keep);
    startMorning(state);
    return { state, keep };
}

const eventsOf = (state, keep) => Object.values(pickMorningEvents(state, keep).chosen).map((e) => e.id);

test('朝の ムービー: 家の前から 校門まで 歩く。通る道は ぜんぶ 通れる', () => {
    for (const day of [2, 9]) {
        const { state, keep } = morningOf(day);
        const steps = morningMovie(state, keep);
        let { x, y } = MORNING_START;
        for (const step of steps.filter((s) => s.walk)) {
            const [tx, ty] = step.walk;
            while (x !== tx || y !== ty) {
                if (x !== tx) x += Math.sign(tx - x);
                else y += Math.sign(ty - y);
                assert.ok(!isBlocked(state, x, y), `${day} 日: ${x},${y} は 通れない`);
            }
        }
        assert.deepEqual([x, y], [11, 2], '校門まで');
        assert.equal(steps.filter((s) => s.say).length, 3);
    }
});

test('出来事の 人は ハルの 歩く道に 立っていない', () => {
    const { state, keep } = morningOf(2);
    const steps = morningMovie(state, keep);
    const path = new Set();
    let { x, y } = MORNING_START;
    for (const step of steps.filter((s) => s.walk)) {
        const [tx, ty] = step.walk;
        while (x !== tx || y !== ty) {
            if (x !== tx) x += Math.sign(tx - x);
            else y += Math.sign(ty - y);
            path.add(`${x},${y}`);
        }
    }
    for (const event of MORNING_EVENTS) {
        const c = { state, keep, loop: 1 };
        for (const a of event.cast(c).filter((a) => a.who)) {
            assert.ok(!path.has(`${a.x},${a.y}`), `${event.id} の ${a.who}`);
            assert.ok(!isBlocked({ ...state, map: 'saka' }, a.x, a.y), `${event.id} の ${a.who} が 壁の中`);
        }
    }
});

test('日付で 出てくる人と ヒントが 変わる', () => {
    const early = morningOf(2);
    const mid = morningOf(4);
    const late = morningOf(8);
    assert.ok(eventsOf(early.state, early.keep).includes('riku'), '2 日まで リクと 歩く');
    assert.ok(eventsOf(mid.state, mid.keep).includes('classmates'), '3〜6 日は クラスメイトが リクの 話');
    assert.ok(eventsOf(late.state, late.keep).includes('gossip'), '7 日から 期限の うわさ');
    const lines = morningMovie(late.state, late.keep).flatMap((s) => s.say ?? []).map(([, t]) => t).join('');
    assert.ok(lines.includes('9日'), '7 日からは 9 日が 山だと 聞ける');
});

test('周が 変わると 別の 出来事になる (リクの 顔つき・ケンの 既視感・アキ先生)', () => {
    const first = morningOf(1, (s, k) => { k.loop = 1; });
    const second = morningOf(1, (s, k) => { k.loop = 2; });
    const a = eventsOf(first.state, first.keep);
    const b = eventsOf(second.state, second.keep);
    assert.ok(a.includes('riku') && !a.includes('kenDejavu'));
    assert.ok(b.includes('rikuLoop') && b.includes('kenDejavu') && b.includes('akiLoop'));
});

test('だれを救ったか・喰らったかで 出来事が 変わる。1 回きりの 出来事は その周で 1 度だけ', () => {
    const saved = morningOf(8, (s) => { s.status.mio = 'saved'; s.status.kana = 'reaped'; });
    assert.equal(pickMorningEvents(saved.state, saved.keep).chosen[1].id, 'savedMio');
    morningMovie(saved.state, saved.keep);
    assert.equal(pickMorningEvents(saved.state, saved.keep).chosen[1].id, 'reaped', '次の朝は 刈り取られた カナの 話');
    morningMovie(saved.state, saved.keep);
    assert.equal(pickMorningEvents(saved.state, saved.keep).chosen[1].id, 'gossip', 'その次は ふだんの うわさ');

    const eaten = morningOf(8, (s) => { s.status.kana = 'eaten'; s.status.mio = 'reaped'; });
    assert.equal(pickMorningEvents(eaten.state, eaten.keep).chosen[1].id, 'eatenWalk');
    const kana = morningOf(8, (s) => { s.status.kana = 'saved'; s.status.mio = 'reaped'; });
    assert.equal(pickMorningEvents(kana.state, kana.keep).chosen[1].id, 'savedKana');
});

test('相性の ヒント: ガクフメだけ 仲間なら カナ (怒) は 喜に弱い、ほかは 怒が 哀に強い', () => {
    const plain = morningOf(2);
    const withMio = morningOf(2, (s, k) => { k.allies.push('gakufume'); });
    const text = (m) => morningMovie(m.state, m.keep).find((s) => s.event === 'hintAffinity').say.map(([, t]) => t).join('');
    assert.ok(text(plain).includes('本気で怒る'));
    assert.ok(text(withMio).includes('笑い飛ばす'));
});

test('どの出来事にも セリフと 登場人物の 絵がある', () => {
    const { state, keep } = morningOf(4);
    for (const event of MORNING_EVENTS) {
        const c = { state, keep, loop: 2 };
        assert.ok(event.lines(c).length > 0, event.id);
    }
    assert.ok(Array.isArray(LINES.enterSchool));
});

test('出来事に 出る人には みんな ドット絵がある', async () => {
    const { PERSON_IDS } = await import('../src/view/sprites.js');
    const { state, keep } = morningOf(4, (s) => { s.status.kana = 'eaten'; });
    for (const event of MORNING_EVENTS) {
        for (const loop of [1, 2]) {
            for (const a of event.cast({ state, keep, loop }).filter((a) => a.who)) {
                assert.ok(PERSON_IDS.includes(a.who), `${event.id} の ${a.who}`);
            }
        }
    }
});
