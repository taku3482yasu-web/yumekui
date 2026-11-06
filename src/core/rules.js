// 属性の相性: 喜は怒に、怒は哀に、哀は楽に、楽は喜に強い (企画書「バトル」)
export const ATTRS = ['喜', '怒', '哀', '楽'];

const STRONG = { 喜: '怒', 怒: '哀', 哀: '楽', 楽: '喜' };

export function affinity(attacker, defender) {
    if (STRONG[attacker] === defender) return 1.5;
    if (STRONG[defender] === attacker) return 0.75;
    return 1;
}

// power は 100 で 等倍。ふれ幅は 0.9〜1.1
export function damage(attacker, defender, power, rng = Math.random) {
    const base = (attacker.atk * power) / 100 - defender.def / 2;
    const swing = 0.9 + rng() * 0.2;
    return Math.max(1, Math.round(base * affinity(attacker.attr, defender.attr) * swing));
}
