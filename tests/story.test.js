// ストーリーの進め方 (企画書 11/11): 話しかけて 1 段ずつ 進め、最後の段を 見た夜に 活性化する。進めなくても 期限 (7 日) に 活性化する
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/core/field.js';
import { advance, advanceStory, dreamsTonight, activeDay, lastRescueDay, ACTIVE_DAY, STORY_STEPS } from '../src/core/calendar.js';
import { isActive } from '../src/core/canvas.js';
import { present, canDeepTalk } from '../src/core/town.js';

function dayState(day) {
    const state = createState();
    Object.assign(state, { day, phase: 'day' });
    return state;
}

test('話を進めなければ 期限の 7 日に 活性化し、救える夜は 7〜9 日', () => {
    const state = dayState(3);
    assert.equal(activeDay(state), ACTIVE_DAY);
    assert.equal(lastRescueDay(state), 9);
    assert.ok(!isActive(state));
    state.day = 7;
    assert.ok(isActive(state));
});

test('最後の段まで 話すと、その夜から 3 晩 救える (期限より 早い)', () => {
    const state = dayState(2);
    assert.equal(advanceStory(state), 1);
    state.day = 3;
    assert.equal(advanceStory(state), 2);
    assert.ok(!isActive(state));
    state.day = 4;
    assert.equal(advanceStory(state), STORY_STEPS);
    assert.equal(activeDay(state), 4);
    assert.equal(lastRescueDay(state), 6);
    assert.ok(isActive(state), 'その夜に 入れる');
    assert.ok(dreamsTonight(state).includes('mio'));
    assert.ok(present(state, 'mio'), '進めた その日は まだ 町にいる');
    assert.ok(!canDeepTalk(state, 'kana'), 'もう じっくりは 話せない');
    state.day = 5;
    assert.ok(!present(state, 'mio'), '次の日からは 倒れている');
    state.day = 7;
    assert.ok(!isActive(state), '期限の日には もう 3 晩が 過ぎている');
});

test('3 晩が 過ぎると、救えなかった 夢主は 戻らない', () => {
    const state = dayState(4);
    state.story = { duet: 2 };
    advanceStory(state);
    state.day = 6;
    state.phase = 'night';
    advance(state);
    assert.equal(state.status.mio, 'broken');
    assert.equal(state.day, 7);
});
