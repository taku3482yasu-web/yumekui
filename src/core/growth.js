import { BAK } from '../data/units.js';

// バクの成長。救うと 守りと言葉、喰らうと 攻撃と凶暴なスキルが伸びる
export const MAX_GROWTH = 5;

const SAVED_SKILLS = [
    { need: 1, id: 'shield', label: 'ふとんの守り' },
    { need: 2, id: 'softword', label: '言葉をそえる' }
];

const EATEN_SKILLS = [
    { need: 1, id: 'bite', label: 'かみくだく' },
    { need: 2, id: 'gorge', label: 'むさぼる' }
];

export function grow(keep, path) {
    keep.growth[path] = Math.min(MAX_GROWTH, keep.growth[path] + 1);
}

export function bakSkills({ saved, eaten }) {
    return [
        ...SAVED_SKILLS.filter((skill) => saved >= skill.need),
        ...EATEN_SKILLS.filter((skill) => eaten >= skill.need)
    ].map(({ id, label }) => ({ id, label }));
}

export function bakUnit(keep) {
    const { saved, eaten } = keep.growth;
    const maxHp = BAK.maxHp + saved * 6 + eaten * 3;
    return {
        ...BAK,
        sprite: eaten > 0 ? 'bak-wild' : 'bak',
        hp: maxHp,
        maxHp,
        atk: BAK.atk + eaten * 4,
        def: BAK.def + saved * 2,
        kokoro: saved * 6,
        moves: { ...BAK.moves, extra: bakSkills(keep.growth) }
    };
}
