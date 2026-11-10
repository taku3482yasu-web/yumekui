// 育成画面の 見た目を 確かめる。node tools/grow-shot.mjs <URL> <画像フォルダ>
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
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'yk-'))}`, '--window-size=960,860', 'about:blank'], { stdio: 'ignore' });
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
const run = (code) => send('Runtime.evaluate', { expression: code, awaitPromise: false });
const key = async (name, code) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code, windowsVirtualKeyCode: { ArrowRight: 39, ArrowDown: 40 }[name] });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code });
    await sleep(150);
};
const shot = async (name) => writeFileSync(join(shots, `${name}.png`), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url });
await sleep(1500);
await run(`(() => { const k = yumekui.keep; k.allies = ['bak','gakufume','togemetoro']; k.growth.saved = 2; k.ypTotal = 20; k.ypSpent = { stats: { hp: 2, atk: 3, kokoro: 1 }, moves: ['drowsy','pillow'] };
  yumekui.state.levels = { bak: { lv: 12, exp: 200 }, gakufume: { lv: 9, exp: 100 }, togemetoro: { lv: 7, exp: 40 } }; yumekui.growScreen(true); })()`);
await sleep(500);
await shot('grow-bak');
for (let i = 0; i < 5; i++) await key('ArrowDown', 'ArrowDown');
await shot('grow-bak-move');
await key('ArrowRight', 'ArrowRight');
await shot('grow-gakufume');
console.log('エラー', errors.length ? errors : 'なし');
ws.close();
chrome.kill();
