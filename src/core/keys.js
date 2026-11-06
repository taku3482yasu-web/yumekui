// キーの割り当て。画面を持たないので テストできる
export const ACTIONS = [
    { id: 'a', label: '決定' },
    { id: 'b', label: 'メニュー・もどる' },
    { id: 'up', label: '上' },
    { id: 'down', label: '下' },
    { id: 'left', label: '左' },
    { id: 'right', label: '右' }
];

export const DEFAULT_KEYS = {
    a: ['j', 'z', 'Enter', ' '],
    b: ['x', 'Escape'],
    up: ['ArrowUp', 'w'],
    down: ['ArrowDown', 's'],
    left: ['ArrowLeft', 'a'],
    right: ['ArrowRight', 'd']
};

const NAMES = {
    ' ': 'スペース', Enter: 'Enter', Escape: 'Esc',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→'
};

export function normalizeKey(key) {
    return key.length === 1 ? key.toLowerCase() : key;
}

export function keyName(key) {
    return NAMES[key] ?? key.toUpperCase();
}

export function actionOf(bindings, key) {
    return Object.keys(bindings).find((action) => bindings[action].includes(key)) ?? null;
}

// action を key だけにする。key を使っていた操作が空になるときは、古いキーをゆずる
export function rebind(bindings, action, key) {
    const next = Object.fromEntries(Object.entries(bindings).map(([id, keys]) => [id, [...keys]]));
    const owner = actionOf(next, key);
    const old = next[action];
    next[action] = [key];
    if (owner && owner !== action) {
        next[owner] = next[owner].filter((item) => item !== key);
        if (next[owner].length === 0) next[owner] = old;
    }
    return next;
}
