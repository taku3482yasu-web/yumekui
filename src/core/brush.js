// 夢筆の 決まり (2026-11-10 ユーザー指定)。データは data/brush.js
//   - 最初の夢で バクが 筆に 姿を変えて 手に入る (keep.brush)。現実では 使えない
//   - 夢の中の 描ける場所 (brushSpot) で、覚えた イメージ (keep.images) から 1 つ 描く
//   - その夢に 合わない物は 描けない / その場所で 役に立たない物を 描いても 何も起きない
//   - 描くと state.flags.painted_<場所> が 立つ。場所の paint にある マスが 通れる タイルに 変わる (階段・橋 など)
//   - イメージは 現実で 物を 調べると 覚える。ハルの 記憶なので ループしても 残る
import { MAPS } from '../data/maps.js';
import { IMAGES, dreamKind } from '../data/brush.js';

export const paintedFlag = (spot) => `painted_${spot.group ?? spot.id}`;

export function canUseBrush(state, keep) {
    return Boolean(keep.brush) && !MAPS[state.map].real;
}

// 現実で 物を 見て イメージを 覚える。新しく 覚えたら true
export function learnImage(keep, id) {
    if (!IMAGES[id] || keep.images.includes(id)) return false;
    keep.images.push(id);
    return true;
}

// 描ける場所に イメージを 描く。結果: unfit (夢に合わない) / useless (ここでは役に立たない) / ok
export function paint(state, keep, spot, imageId) {
    const kind = dreamKind(MAPS[state.map]);
    if (!IMAGES[imageId].fits.includes(kind)) return 'unfit';
    if (!spot.accepts.includes(imageId)) return 'useless';
    state.flags[paintedFlag(spot)] = true;
    return 'ok';
}

// この場所で 役に立つ イメージを 持っているか (なければ バクが ヒントを言う)
export function hasImageFor(keep, spot) {
    return spot.accepts.some((id) => keep.images.includes(id));
}

// 描いて 変わった タイル (なければ null)
export function paintedTile(state, x, y) {
    for (const object of MAPS[state.map].objects) {
        if (object.kind !== 'brushSpot' || !object.paint || !state.flags[paintedFlag(object)]) continue;
        const cell = object.paint.find(([px, py]) => px === x && py === y);
        if (cell) return cell[2];
    }
    return null;
}
