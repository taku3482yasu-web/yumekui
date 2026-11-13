import { actionOf, DEFAULT_KEYS, normalizeKey, rebind } from '../core/keys.js';

const STORE = 'yumekui.input';

function load() {
    try {
        return JSON.parse(localStorage.getItem(STORE)) ?? {};
    } catch {
        return {};
    }
}

function save(settings) {
    try {
        localStorage.setItem(STORE, JSON.stringify(settings));
    } catch {
        // 保存できない環境では、開いている間だけ有効
    }
}

// held は 押している間の向き、press は 押した瞬間の知らせ
export function createInput() {
    const saved = load();
    let bindings = { ...DEFAULT_KEYS, ...saved.bindings };   // あとから 足した 操作 (ダッシュ) は 最初の キー
    let swapped = Boolean(saved.swapped);
    let capturing = null;
    const held = [];
    const listeners = new Set();

    const remember = () => save({ bindings, swapped });
    const paintPad = () => document.body.classList.toggle('pad-swap', swapped);

    const down = (action) => {
        if (!held.includes(action)) held.push(action);
        for (const listener of [...listeners]) listener(action);
    };
    const up = (action) => {
        const index = held.indexOf(action);
        if (index >= 0) held.splice(index, 1);
    };

    addEventListener('keydown', (event) => {
        const key = normalizeKey(event.key);
        if (capturing) {
            event.preventDefault();
            const done = capturing;
            capturing = null;
            done(key === 'Escape' ? null : key);
            return;
        }
        const action = actionOf(bindings, key);
        if (!action) return;
        event.preventDefault();
        if (!event.repeat) down(action);
    });
    addEventListener('keyup', (event) => {
        const action = actionOf(bindings, normalizeKey(event.key));
        if (action) up(action);
    });
    addEventListener('blur', () => { held.length = 0; });

    for (const button of document.querySelectorAll('#pad [data-key]')) {
        const action = button.dataset.key;
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            down(action);
        });
        for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
            button.addEventListener(type, () => up(action));
        }
    }

    paintPad();

    return {
        direction: () => [...held].reverse().find((action) => action !== 'a' && action !== 'b' && action !== 'dash') ?? null,
        isHeld: (action) => held.includes(action),   // ムービーを 長押しで 飛ばす
        onPress(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        bindings: () => bindings,
        swapped: () => swapped,
        // 次に押されたキーを返す。Esc で やめる
        capture: () => new Promise((resolve) => { capturing = resolve; }),
        assign(action, key) {
            bindings = rebind(bindings, action, key);
            remember();
        },
        toggleSwap() {
            swapped = !swapped;
            paintPad();
            remember();
        },
        reset() {
            bindings = DEFAULT_KEYS;
            swapped = false;
            paintPad();
            remember();
        }
    };
}
