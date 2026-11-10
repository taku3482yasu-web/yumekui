// 夢筆 (ゆめふで) で 描けるもの (2026-11-10 ユーザー指定)
// 夢筆は バクが 姿を変えたもの。夢の中でだけ使え、現実で 見たことのある物 (イメージ) だけを 描ける。
// fits: 描ける夢の 種類。その夢に 合わない物は 描けない (水底の音楽室に 海は 描けない・楽器は 描ける)
//   hal = ハルの夢『顔色の坂道』(空に 海が浮かぶ 坂) / water = ミオの夢『水底の音楽室』/ tempo = カナの夢『止まらない練習室』
// see: 現実で どこを 調べると 覚えるか (説明用)
export const IMAGES = {
    stairs: { label: '階段', fits: ['hal', 'water', 'tempo', 'duet'], see: '学校の階段 (毎日 見ているので 最初から 描ける)' },
    bridge: { label: '橋', fits: ['hal', 'water', 'tempo', 'duet'], see: '学校の 渡り廊下の 手すり' },
    piano: { label: 'ピアノ', fits: ['water', 'tempo', 'duet'], see: '音楽室の ピアノ' },
    metronome: { label: 'メトロノーム', fits: ['water', 'tempo', 'duet'], see: '音楽室の メトロノーム' },
    easel: { label: 'イーゼル', fits: ['hal'], see: '美術室の イーゼル' },
    sea: { label: '海', fits: ['hal'], see: '坂道から 見える 海' }
};

// 最初から 持っている イメージ (学校の階段は 毎日 見ている)
export const FIRST_IMAGES = ['stairs'];

// 夢の 種類 (地図の theme)。現実の地図は real
export function dreamKind(map) {
    if (map.real) return 'real';
    return map.theme ?? 'hal';
}

// 現実の地図で 調べると イメージを 覚える タイル (正面の タイル)
export const TILE_IMAGES = { p: 'piano', s: 'stairs', e: 'easel', w: 'sea', f: 'bridge' };
