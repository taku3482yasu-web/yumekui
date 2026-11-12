// 描いた 大きい 絵 (public/img/yumekui。ドット絵を 6 倍に した 同じ デザイン。引き継ぎ書 4-3)。
//   ドット絵の 名前 → 絵の 場所と 向き ('left' = 左を 向いている、'front' = 正面)
export const HD_ART = {
    bak: { src: 'img/yumekui/bak.png', faces: 'left' },
    gakufume: { src: 'img/yumekui/gakufume.png', faces: 'front' },
    togemetoro: { src: 'img/yumekui/togemetoro.png', faces: 'front' },
    himawarion: { src: 'img/yumekui/himawarion.png', faces: 'front' },
    'duet-boss': { src: 'img/yumekui/duet.png', faces: 'front' },
    nightmare: { src: 'img/yumekui/nightmare.png', faces: 'front' },
    'nightmare-reveal': { src: 'img/yumekui/nightmare_reveal.png', faces: 'front' }
};

// 大きい 絵の 場所 (無ければ null)
export function hdPath(name) {
    return HD_ART[name]?.src ?? null;
}
