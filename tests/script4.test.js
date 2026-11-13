import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { portraitPath, scenePlan } from '../src/core/portraits.js';
import { FOES } from '../src/data/units.js';
import { MAPS } from '../src/data/maps.js';
import { LINES } from '../src/scenes/story.js';

// ---- 台本 4 章: 星の案内人・ミチル・ヒカリ ----------------------------------

const SCENES = ['starGuide', 'michiruMeet', 'michiruAgain', 'starDream', 'starDreamSky', 'michiruTruth', 'hikariBye', 'hikariAngry'];

test('4 章の 場面が LINES に あり、立ち絵の ある 話し手の 絵が public に ある', () => {
    for (const key of SCENES) {
        assert.ok(Array.isArray(LINES[key]) && LINES[key].length, key);
        for (const [name, line, face] of LINES[key]) {
            assert.equal(typeof line, 'string', key);
            const path = portraitPath(name, face);
            if (path) assert.ok(existsSync(`public/${path}`), `${key}: ${path}`);
        }
    }
});

test('星の案内人は ミチルの 全身 (表情は 変わらない)', () => {
    assert.equal(portraitPath('星の案内人'), 'img/chara/michiru_guide.png');
    assert.equal(portraitPath('星の案内人', 'smile'), 'img/chara/michiru_guide.png');
    assert.equal(portraitPath('ミチル', 'eroded'), 'img/chara/michiru_eroded.png');
    assert.equal(portraitPath('ヒカリ', 'angry'), 'img/chara/hikari_angry.png');
});

test('ヒカリとの お別れ: 先に 話す ヒカリが ふつうなら 左に なるので、main.js で 左 ミチル を 渡す (台本 4-5)', () => {
    assert.deepEqual(scenePlan(LINES.hikariBye), { center: null, left: 'ヒカリ' });
});

test('ノーマルの ナイトメアは 横顔に なったあと ヒカリの 声 (台本 4-6)', () => {
    assert.equal(FOES.nightmareFinal.revealLines, 'hikariAngry');
});

test('天文台の 石段は 坂道に あり、2 周目からの 印が いる', () => {
    const stairs = MAPS.saka.objects.find((object) => object.id === 'observatory');
    assert.ok(stairs);
    assert.equal(stairs.needs, 'observatory');
});
