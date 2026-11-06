const KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    z: 'a', Enter: 'a', ' ': 'a',
    x: 'b', Escape: 'b'
};

// held は 押している間の向き、press は 押した瞬間の知らせ
export function createInput() {
    const held = [];
    const listeners = new Set();

    const down = (key) => {
        if (!held.includes(key)) held.push(key);
        for (const listener of [...listeners]) listener(key);
    };
    const up = (key) => {
        const index = held.indexOf(key);
        if (index >= 0) held.splice(index, 1);
    };

    addEventListener('keydown', (event) => {
        const key = KEYS[event.key];
        if (!key) return;
        event.preventDefault();
        if (!event.repeat) down(key);
    });
    addEventListener('keyup', (event) => {
        const key = KEYS[event.key];
        if (key) up(key);
    });
    addEventListener('blur', () => { held.length = 0; });

    for (const button of document.querySelectorAll('#pad [data-key]')) {
        const key = button.dataset.key;
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            down(key);
        });
        for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
            button.addEventListener(type, () => up(key));
        }
    }

    return {
        direction: () => [...held].reverse().find((key) => key !== 'a' && key !== 'b') ?? null,
        onPress(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
}
