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

async function battle(useShake, eat = false) {
    let turn = 0;
    for (let i = 0; i < 400; i++) {
        const now = await state();
        if (now.m !== 'battle') return now;
        const labels = await read('[...document.querySelectorAll("#menu button")].map(b=>b.textContent)');
        if (now.menu && labels.length) {
            const devourAt = labels.indexOf('バクに喰らわせる');
            if (eat && devourAt >= 0) {
                await shot('16-devour');
                for (let k = 0; k < devourAt; k++) await key('ArrowDown');
                await key('j');
                continue;
            }
            const pick = labels.findIndex((label) => ['ほんとは、自分で決めたかった', '一緒に吹きたかった', '相談してほしかった'].includes(label));
            if (pick >= 0) {
                await shot('05-truth-choices');
                for (let k = 0; k < pick; k++) await key('ArrowDown');
                await key('j');
            } else {
                const wanted = labels.findIndex((label) => label === '本音を言い当てる');
                const shake = labels.indexOf('ココロ攻撃');
                const hp = await read('Number(document.querySelector("#ally-status .num").textContent.split("/")[0])');
                const heal = labels.indexOf('悪夢を食べる');
                const healOff = heal >= 0 && await read(`document.querySelectorAll("#menu button")[${heal}].disabled`);
                const needHeal = hp < 28 && heal >= 0 && !healOff;
                const guard = labels.indexOf('まもる');
                const big = (useShake || eat) && turn % 4 === 3;
                const hit = labels.indexOf(eat ? 'ひっかく' : labels[0]);
                const target = wanted >= 0 && !eat ? wanted : big ? guard : needHeal ? heal : (useShake && shake >= 0 ? shake : Math.max(hit, 0));
                turn++;
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

// 結末から 2 月 2 日へ
const pick = async (text) => {
    for (let i = 0; i < 200; i++) {
        const now = await state();
        const labels = await read('[...document.querySelectorAll("#menu button")].map(b=>b.textContent)');
        if (now.menu && labels.length) {
            const index = labels.findIndex((label) => label.includes(text));
            if (index < 0) throw new Error(text + ' がない: ' + labels);
            for (let k = 0; k < index; k++) await key('ArrowDown');
            await key('j');
            await sleep(200);
            return;
        }
        if (now.msg) await key('j');
        else await sleep(80);
    }
    throw new Error('メニューが出ない ' + text);
};
const waitField = async () => {
    for (let i = 0; i < 200; i++) {
        const now = await state();
        if (now.m === 'field' && !now.msg) return;
        if (now.msg) await key('j');
        else await sleep(80);
    }
    throw new Error('夢に入れない');
};
const fightAt = async (x, y, shake = false) => {
    await walkTo(x, y);
    await sleep(300);
    await skip();
    await sleep(900);
    await battle(shake);
    await sleep(300);
};

await pick('音楽室');
await sleep(300);
await shot('12-town');
await pick('ミオの夢');
await sleep(900);
await waitField();
await shot('13-mio-dream');
await fightAt(9, 7);
await skip();
await fightAt(15, 4);
await skip();
await walkTo(15, 1);
await skip();
console.log('2/2 の言葉', JSON.stringify((await state()).s.words));
await walkTo(10, 9);
await sleep(300);
await shot('13b-wake-door');
await pick('目を覚ます');
await sleep(1000);
for (let day = 3; day < 7; day++) {
    await pick('今夜は休む').catch(() => {});
    await sleep(300);
    await pick('家に帰る');
    await sleep(300);
}
await pick('今夜は休む');
await sleep(300);
await pick('家に帰る');
await sleep(300);
const seven = await state();
console.log('今の日', seven.s.day, seven.s.phase, '活性化', seven.s.flags.active);
await pick('ミオの夢');
await sleep(900);
await waitField();
await fightAt(9, 4, true);
await sleep(500);
console.log('ボス戦のあと: 解決', JSON.stringify(await read('yumekui.keep.solved')), '画面', (await state()).m, '文', await read('document.getElementById("text").textContent'));
await shot('14-after-rescue');
await pick('今夜は休む').catch(() => {});
const rescued = await state();
console.log('仲間', JSON.stringify(await read('yumekui.keep.allies')), '状態', JSON.stringify(rescued.s.status));
for (let i = 0; i < 12; i++) {
    const now = await state();
    if ((await read('yumekui.keep.loop')) === 2) break;
    const labels = await read('[...document.querySelectorAll("#menu button")].map(b=>b.textContent)');
    if (now.menu && labels.some((l) => l.includes('早送り'))) await pick('早送り');
    else if (now.menu && labels.some((l) => l.includes('休む'))) await pick('今夜は休む');
    else if (now.menu) await pick('家に帰る');
    else if (now.msg) await key('j');
    await sleep(300);
}
for (let i = 0; i < 30 && (await read('yumekui.keep.loop')) !== 2; i++) {
    const now = await state();
    if (now.msg) await key('j');
    else if (now.menu) await key('j');
    else await sleep(100);
}
await sleep(1200);
await shot('15-loop-2');
const looped = await state();
const loop = await read('yumekui.keep.loop');
const allies = await read('yumekui.keep.allies');
console.log('周', loop, '日', looped.s.day, '仲間', JSON.stringify(allies), '状態', JSON.stringify(looped.s.status));

// 2 周目: 2/7 まで進めて カナのユメクイを喰らう
for (let day = 2; day < 7; day++) {
    await pick('家に帰る');
    await sleep(300);
    await pick('今夜は休む');
    await sleep(300);
}
await pick('家に帰る');
await sleep(300);
await pick('カナの夢');
await sleep(900);
await waitField();
await walkTo(6, 8);
await sleep(300);
await skip();
await sleep(900);
await battle(false);
await skip();
await walkTo(10, 8);
await walkTo(10, 7);
await walkTo(9, 5);
await sleep(300);
await skip();
await sleep(900);
await battle(false, true);
await sleep(1200);
for (let i = 0; i < 40; i++) {
    const now = await state();
    if (now.menu) break;
    if (now.msg) await key('j');
    else await sleep(100);
}
const after = await state();
const growth = await read('yumekui.keep.growth');
console.log('成長', JSON.stringify(growth), '状態', JSON.stringify(after.s.status), '喰らった', JSON.stringify(await read('yumekui.keep.eaten')));
console.log('エラー', errors.length ? errors : 'なし');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true });
await send('Page.reload');
await sleep(1200);
await shot('11-phone');
chrome.kill();
await sleep(400);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome が つかんでいることがある */ }
const ok = !errors.length && loop === 2 && allies.includes('gakufume') && looped.s.status.mio === 'idle' && growth.eaten === 1 && after.s.status.kana === 'eaten';
process.exit(ok ? 0 : 1);
