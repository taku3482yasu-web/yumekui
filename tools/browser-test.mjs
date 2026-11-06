// 本物の Chrome で チュートリアルを 最後まで遊ぶ。node tools/browser-test.mjs <URL> <画像フォルダ>
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const shots = process.argv[3] ?? join(tmpdir(), 'yumekui-shots');
mkdirSync(shots, { recursive: true });

const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!chromePath) {
    console.log('Chrome が見つからないので 飛ばしました');
    process.exit(0);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const port = 9500 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), 'yumekui-test-'));
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=960,720', 'about:blank'], { stdio: 'ignore' });

let target;
for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
        target = list.find((item) => item.type === 'page');
    } catch { /* 起動待ち */ }
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => { ws.onopen = resolve; });
let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.id) pending.get(data.id)?.(data.result);
    if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.exception?.description ?? data.params.exceptionDetails.text);
    if (data.method === 'Log.entryAdded' && data.params.entry.level === 'error') errors.push(data.params.entry.text);
};
const send = (method, params = {}) => new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
});
const read = async (code) => (await send('Runtime.evaluate', { expression: code, returnByValue: true })).result.value;
const CODES = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, j: 74 };
const key = async (name, hold = 40) => {
    const base = { key: name, code: name === 'j' ? 'KeyJ' : name, windowsVirtualKeyCode: CODES[name] };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
    await sleep(hold);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    await sleep(30);
};
const shot = async (name) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(shots, `${name}.png`), Buffer.from(data, 'base64'));
};
const state = () => read('JSON.stringify({m:yumekui.mode,s:yumekui.state,msg:!document.getElementById("msg").hidden,menu:!document.getElementById("menu").hidden,title:!document.getElementById("title").hidden})').then(JSON.parse);

// 会話を 終わるまで送る
async function skip(limit = 80) {
    for (let i = 0; i < limit; i++) {
        const now = await state();
        if (now.m === 'field' && !now.msg) return now;
        if (now.menu || now.m === 'battle') return now;
        if (now.msg) await key('j');
        else await sleep(60);
    }
    throw new Error('会話が終わらない');
}

async function walkTo(x, y, avoid = true) {
    for (let i = 0; i < 300; i++) {
        const now = await state();
        if (now.m !== 'field') return now;
        if (now.s.x === x && now.s.y === y) return now;
        const route = await read(`(${routeCode})(${x},${y})`);
        if (!route) throw new Error(`道がない ${x},${y} / いま ${now.s.x},${now.s.y}`);
        await key(route, 170);
        await sleep(30);
    }
    throw new Error('たどりつかない');
}

// 地図を読んで 次の一歩を決める (ブラウザの中で動かす)
const routeCode = `(tx,ty)=>{const s=yumekui.state;const t=window.__tiles(s.map);const key=(x,y)=>x+','+y;
const prev=new Map([[key(s.x,s.y),null]]);const q=[[s.x,s.y]];const D=[['ArrowUp',0,-1],['ArrowDown',0,1],['ArrowLeft',-1,0],['ArrowRight',1,0]];
while(q.length){const [x,y]=q.shift();if(x===tx&&y===ty){let c=key(x,y),step=null;while(prev.get(c)){step=prev.get(c)[1];c=prev.get(c)[0];}return step;}
for(const [n,dx,dy] of D){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(prev.has(k))continue;const ch=t[ny]?.[nx];if(!ch||ch==='w'||ch==='M')continue;if(ch==='G'&&!s.flags.gateOpen)continue;
const hit=window.__objects().find(o=>o.x===nx&&o.y===ny);if(hit&&!(nx===tx&&ny===ty)&&hit.kind!=='exit')continue;prev.set(k,[key(x,y),n]);q.push([nx,ny]);}}return null;}`;

async function battle(useShake) {
    for (let i = 0; i < 400; i++) {
        const now = await state();
        if (now.m !== 'battle') return now;
        const labels = await read('[...document.querySelectorAll("#menu button")].map(b=>b.textContent)');
        if (now.menu && labels.length) {
            const pick = labels.findIndex((label) => label.includes('ほんとは、自分で'));
            if (pick >= 0) {
                await shot('05-truth-choices');
                for (let k = 0; k < pick; k++) await key('ArrowDown');
                await key('j');
            } else {
                const wanted = labels.findIndex((label) => label === '本音を言い当てる');
                const shake = labels.indexOf('ココロ攻撃');
                const target = wanted >= 0 ? wanted : (useShake && shake >= 0 ? shake : 0);
                for (let k = 0; k < target; k++) await key('ArrowDown');
                await key('j');
            }
        } else if (now.msg) {
            await key('j');
        } else {
            await sleep(60);
        }
    }
    throw new Error('バトルが終わらない');
}

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Page.navigate', { url });
await sleep(1500);
await shot('01-title');
await key('ArrowDown');
await key('j');
await sleep(300);
await shot('01b-settings');
await key('ArrowUp');
await key('j');
await sleep(300);
await key('j');
await sleep(700);
await skip();
await read(`(async()=>{const m=await import('/src/data/maps.js');const f=await import('/src/core/field.js');window.__tiles=(id)=>m.MAPS[id].tiles;window.__objects=()=>f.objectsOf(yumekui.state);})()`);
await sleep(200);
await shot('02-field');

await walkTo(9, 5);
await key('ArrowUp', 40);
await sleep(100);
await key('j');
await sleep(400);
await shot('03-talk');
await skip();

// 最初の戦い
await key('ArrowUp', 170);
await walkTo(9, 3);
await key('ArrowUp', 170);
await sleep(300);
await skip();
await sleep(900);
await shot('04-battle');
await battle(false);
await skip();
await walkTo(9, 1);
await sleep(700);
await skip();
await sleep(300);
await shot('06-omen');

for (const [fx, fy] of [[10, 5], [6, 2], [14, 8], [17, 3], [19, 2], [24, 5]]) {
    const alive = await read(`window.__objects().some(o=>o.x===${fx}&&o.y===${fy})`);
    if (!alive) continue;
    await walkTo(fx, fy);
    await sleep(300);
    await skip();
    await sleep(900);
    await battle(false);
    await skip();
    if ((await state()).s.map !== 'omen') throw new Error('倒された');
    if (fx === 6) { await walkTo(7, 1); await skip(); }
    if (fx === 14) { await walkTo(15, 9); await skip(); }
    if (fx === 19) { await walkTo(20, 1); await skip(); }
}
console.log('言葉', JSON.stringify((await state()).s.words));
if ((await state()).s.words.length !== 3) throw new Error('言葉が 3 つ そろっていない');
await shot('07-omen-end');
await walkTo(31, 5);
await sleep(700);
await skip();
await walkTo(9, 3);
await sleep(300);
await skip();
await sleep(900);
await shot('08-boss');
await battle(true);
await sleep(300);
await skip(10).catch(() => {});
for (let i = 0; i < 60; i++) {
    const now = await state();
    if (now.m === 'shadow' && now.msg) { await sleep(400); await shot('09-shadow'); }
    if (now.m === 'morning' && now.msg) { await sleep(300); await shot('10-morning'); }
    if (now.title) break;
    if (now.msg) await key('j');
    else await sleep(100);
}
await sleep(300);
const last = await state();
console.log('最後の画面', last.m, 'タイトル', last.title);
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true });
await send('Emulation.setEmitTouchEventsForMouse', { enabled: true });
await send('Page.reload');
await sleep(1200);
await shot('11-phone');
console.log('エラー', errors.length ? errors : 'なし');
chrome.kill();
await sleep(400);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome が つかんでいることがある */ }
process.exit(errors.length || !last.title ? 1 : 0);
