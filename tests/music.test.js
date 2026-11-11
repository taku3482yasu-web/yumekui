import test from 'node:test';
import assert from 'node:assert/strict';
import { battleBgm, battleJingle, bgmFile, loopSong, bgmFor, layersFor, normalizeAudio, seVolume, stepVolume, transitionFor, voicedAt, voiceOf, wobbleFor, BOSS_BGM, DREAM_BGM, ENDING_BGM } from '../src/core/music.js';
import { BGM, DEFAULT_AUDIO, SE } from '../src/data/sounds.js';
import { MAPS } from '../src/data/maps.js';
import { FOES } from '../src/data/units.js';

test('曲は 小規模版の 24 曲 (M01〜M24) と 戦闘の 終わりの 2 曲 (M25・M26)。ファイル名は 番号_英字', () => {
    assert.equal(Object.keys(BGM).length, 26);
    assert.equal(BGM.M25.file, 'M25_victory');
    assert.equal(BGM.M26.file, 'M26_defeat');
    assert.ok(BGM.M04.loopStart > 0, 'イントロの あとから くり返す');
    for (const [id, entry] of Object.entries(BGM)) assert.match(entry.file, new RegExp(`^${id}_[a-z_]+$`));
    for (const [id, entry] of Object.entries(SE)) assert.match(entry.file, new RegExp(`^${id}_[a-z]+$`));
});

test('タイトルは M01、地図の 上は 夢ごとの 曲、現実の 放課後は M06、夜は M07', () => {
    assert.equal(bgmFor({ mode: 'title' }), 'M01');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.odoriba }), 'M03');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.mizuzoko }), 'M08');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.renshu }), 'M09');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.duet3 }), 'M12');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.riku2 }), 'M14');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.saka, phase: 'day' }), 'M06');
    assert.equal(bgmFor({ mode: 'movie', map: MAPS.saka, phase: 'morning' }), 'M06');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.home, phase: 'night' }), 'M07');
});

test('どの 夢の 地図にも 曲が ある', () => {
    for (const map of Object.values(MAPS)) {
        if (map.dream) assert.ok(DREAM_BGM[map.dream], map.id);
    }
});

test('ナイトメアに 追われているあいだは M15', () => {
    assert.equal(bgmFor({ mode: 'field', map: MAPS.rikuField, chase: true }), 'M15');
});

test('バトルは ボスの 曲、ほかは 通常バトル M04', () => {
    assert.equal(battleBgm(['nanashi', 'suima']), 'M04');
    assert.equal(battleBgm(['gakufume']), 'M10');
    assert.equal(battleBgm(['duetDo', 'duetAi']), 'M13');
    assert.equal(bgmFor({ mode: 'battle', foes: ['himawarion'] }), 'M16');
    for (const id of Object.keys(BOSS_BGM)) assert.ok(FOES[id], id);
});

test('戦いは 物語の 場面の 曲より 先 (終幕の 戦いでも ボスの 曲)', () => {
    assert.equal(bgmFor({ mode: 'battle', foes: ['nightmareFinal'], override: ENDING_BGM.normal }), 'M15');
    assert.equal(bgmFor({ mode: 'black', override: 'M20' }), 'M20');
    assert.equal(bgmFor({ mode: 'scene', map: MAPS.mizuzoko, override: null }), null);
});

test('演出の あいだは 今の曲の まま、影と「にがさない」は その場で 止める', () => {
    for (const mode of ['calendar', 'lapse', 'painting', 'encounter', 'black', 'film']) assert.equal(bgmFor({ mode, map: MAPS.home }), undefined, mode);
    assert.equal(bgmFor({ mode: 'scare' }), null);
    assert.equal(transitionFor('scare', null), 'hard');
    assert.equal(transitionFor('battle', 'M04'), 'fast');
    assert.equal(transitionFor('field', 'M06'), 'fade');
});

test('プロローグの 家: 父との 会話は 曲なし、自分の部屋に 入ってから M07', () => {
    assert.equal(bgmFor({ mode: 'field', map: MAPS.home, prologue: { roomEntered: false } }), null);
    assert.equal(bgmFor({ mode: 'field', map: MAPS.home, prologue: { roomEntered: true } }), 'M07');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.saka, prologue: { roomEntered: false } }), 'M06');
});

test('町の曲は 喰らった人の パートを 消す。ノーマルED は 救った人の パートだけ', () => {
    assert.deepEqual(layersFor('M06', { mio: 'eaten', kana: 'saved', riku: 'idle' }), ['kana', 'riku']);
    assert.deepEqual(layersFor('M21', { mio: 'saved', kana: 'eaten', riku: 'saved' }), ['mio', 'riku']);
    assert.deepEqual(layersFor('M04', {}), []);
});

test('テープの ゆれは 町の曲だけ。周を 重ねるほど 大きく、最終周は 消す', () => {
    assert.equal(wobbleFor('M06', 1), 0);
    assert.ok(wobbleFor('M06', 3) > wobbleFor('M06', 2));
    assert.equal(wobbleFor('M06', 3, true), 0);
    assert.equal(wobbleFor('M04', 3), 0);
});

test('版ちがいの ファイル名 (M24_short)。M18 は 全員 共通', () => {
    assert.equal(bgmFile('M18', 'mio'), 'M18_saved');
    assert.equal(bgmFile('M18'), 'M18_saved');
    assert.equal(bgmFile('M18', 'duet'), 'M18_saved');   // 無い 版は 本体
    assert.equal(bgmFile('M24', 'short'), 'M24_short');
});

test('セリフの 声: 「……」や 記号では 鳴らさない。ナイトメアは 声なし', () => {
    assert.equal(voiceOf('ハル'), 'haru');
    assert.equal(voiceOf(''), 'narration');
    assert.equal(voiceOf('ナイトメア'), null);
    assert.equal(voiceOf('父'), 'other');
    assert.equal(voicedAt('……', 0), false);
    assert.equal(voicedAt('あい', 0), true);
    assert.equal(voicedAt('あい', 1), false);
});

test('音量: 初期は 曲 70%・効果音 80%・声 80%。ホラーの 音は ひかえめで 小さく', () => {
    assert.deepEqual(normalizeAudio({}), DEFAULT_AUDIO);
    assert.deepEqual(normalizeAudio({ bgm: 5, se: 'x', horror: 'soft' }), { ...DEFAULT_AUDIO, horror: 'soft' });
    assert.equal(seVolume('SE21', { se: 0.8, horror: 'soft' }), 0.8);
    assert.ok(seVolume('SE43', { se: 0.8, horror: 'soft' }) < 0.8);
    assert.equal(stepVolume(0.7), 0.8);
    assert.equal(stepVolume(1), 0);
});

test('戦闘の 終わりの 短い曲: 勝ちは M25・負けは M26。ナイトメアに 負けたとき・終幕・救った・喰らった・にげたは 鳴らさない', () => {
    assert.equal(battleJingle('win'), 'M25');
    assert.equal(battleJingle('lose'), 'M26');
    assert.equal(battleJingle('lose', 'nightmare'), null);
    assert.equal(battleJingle('win', 'final'), null);
    assert.equal(battleJingle('truth'), null);
    assert.equal(battleJingle('devour'), null);
    assert.equal(battleJingle('flee'), null);
});

test('短い曲が 鳴っている あいだは 戦闘の 曲も 場面の 曲も 止めて おく。物語で 決めた 曲は 鳴らす', () => {
    assert.equal(bgmFor({ mode: 'battle', foes: [], jingle: true }), null);
    assert.equal(bgmFor({ mode: 'field', map: MAPS.odoriba, jingle: true }), null);
    assert.equal(bgmFor({ mode: 'field', map: MAPS.home, phase: 'night', jingle: true }), null);
    assert.equal(bgmFor({ mode: 'scene', override: 'M17', jingle: true }), 'M17');
    assert.equal(bgmFor({ mode: 'field', map: MAPS.odoriba }), 'M03');   // 鳴り終われば もとの 曲
});

test('ループの 場面は M24 まきもどしのうた。1 周目の 終わりは ふつうの版、2 周目の 終わりからは 短い版', () => {
    assert.deepEqual(loopSong(1), { id: 'M24', version: null });
    assert.deepEqual(loopSong(2), { id: 'M24', version: 'short' });
    assert.equal(bgmFile('M24', loopSong(1).version), 'M24_makimodoshi');
    assert.equal(bgmFile('M24', loopSong(2).version), 'M24_short');
});
