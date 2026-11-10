// 終幕 (3 つの エンディング) を 本物の Chrome で 確かめる。node tools/ending-test.mjs <URL> <画像フォルダ>
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const shots = process.argv[3] ?? join(tmpdir(), 'yumekui-shots');
mkdirSync(shots, { recursive: true });
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!chromePath) process.exit(0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9700 + Math.floor(Math.random() * 100);
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'yk-'))}`, '--window-size=960,720', 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { /* 起動待ち */ }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id) pending.get(d.id)?.(d.result);
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description);
};
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const read = async (code) => (await send('Runtime.evaluate', { expression: code, returnByValue: true })).result.value;
const CODES = { ArrowDown: 40, j: 74 };
const key = async (name) => {
    const base = { key: name, code: name === 'j' ? 'KeyJ' : name, windowsVirtualKeyCode: CODES[name] };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
    await sleep(40);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    await sleep(40);
};
const shot = async (name) => writeFileSync(join(shots, `${name}.png`), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
const labels = () => read('[...document.querySelectorAll("#menu button")].map(b=>b.textContent)');
const choose = async (index) => {
    for (let k = 0; k < index; k++) await key('ArrowDown');
    await key('j');
};

await send('Runtime.enable');
const ROUTES = {
    good: `Object.assign(s.status,{mio:'saved',kana:'saved',riku:'saved'}); s.flags.duetSaved=true;`,
    normal: `Object.assign(s.status,{mio:'saved',kana:'reaped',riku:'idle'});`,
    yumekui: `Object.assign(s.status,{mio:'eaten',kana:'eaten',riku:'eaten'}); k.eaten=['mio','kana','riku'];`
};
const results = {};
for (const [route, setup] of Object.entries(ROUTES)) {
    await send('Page.navigate', { url });
    await sleep(1500);
    // タイトルの メニューと 混ざらないよう、先に はじめて 歩ける 画面まで 進めてから 終幕へ 飛ぶ
    for (let i = 0; i < 300 && (await read('yumekui.mode')) !== 'field'; i++) {
        await key('j');
        await sleep(60);
    }
    await read(`(() => { const k = yumekui.keep, s = yumekui.state; k.loop = 3; k.tutorial = true; k.allies = ['bak','gakufume']; Object.assign(s, { map: 'home', x: 12, y: 3, day: 14, phase: 'night' }); s.levels = { bak: { lv: 12, exp: 0 }, gakufume: { lv: 12, exp: 0 } }; ${setup} yumekui.finale(); })()`);
    const seen = [];
    let shotBattle = false;
    for (let i = 0; i < 8000; i++) {
        const mode = await read('yumekui.mode');
        const menu = await read('!document.getElementById("menu").hidden');
        const msg = await read('!document.getElementById("msg").hidden');
        if (menu) {
            const list = await labels();
            if (list.includes('タイトルへ')) { await shot(`20-end-${route}`); seen.push(await read('document.getElementById("text").textContent')); break; }
            const head = await read('document.querySelector("#menu .head")?.textContent ?? ""');
            if (list.includes('たたかう')) await choose(list.indexOf('たたかう'));
            else if (head.endsWith('の わざ')) {
                if (!shotBattle) { shotBattle = true; await shot(`20-battle-${route}`); seen.push(list.join('/')); }
                const pick = list.findIndex((l) => l === '夢喰い' || l.startsWith('キズナ攻撃（あと'));
                await choose(pick >= 0 ? pick : 0);
            } else await choose(0);
        } else if (msg) {
            const text = await read('document.getElementById("text").textContent');
            if (seen.at(-1) !== text && /ネムリボシ……|まだ 終わってねえ|リク・ナイトメアだ|お姉ちゃん|呼べ|だれも、呼べない|夢喰い！|まだだ|駅|部屋/.test(text)) seen.push(text);
            await key('j');
        } else await sleep(60);
        if (mode === 'battle' && !shotBattle && !menu) await sleep(30);
    }
    results[route] = seen;
}
console.log(JSON.stringify(results, null, 1));
console.log('エラー', errors.length ? errors : 'なし');
ws.close();
chrome.kill();
process.exit(errors.length ? 1 : 0);
