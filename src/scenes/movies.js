// ムービーの 一覧 (命令の 書き方は core/movie.js)。番号 (MV01 など) で 呼ぶ。
//   steps が ふつうの版、short が 2 回目からの 短い版。絵は sprites.js の 名前
//   MV01〜MV11 は 新しい ドット絵が いるので、段階5 の 続きで ここに 足していく (ムービー資料・素材制作仕様書「1本ごとの仕様」)
import { LINES } from './story.js';

export const MOVIES = {
    // ナイトメアに 捕まった・負けたときの「に が さ な い」(テスト版から ある 演出を スクリプトに した もの)。
    //   曲は その場で 止める (静けさの 場面)。ホラー演出が ひかえめなら 揺れと 文字の ふるえを 弱く する (call: 'horror')
    NIGASANAI: {
        steps: [
            { bgm: null, hard: true },
            { bg: '#000000' },
            { se: 'SE42' },
            { call: 'horror', shake: true },
            { text: LINES.scareText, color: '#e8203a', size: 22, jitter: 6, ms: 1600 },
            { text: null }
        ]
    },
    // デュエットの 合体: 背中合わせの 2 羽が 寄っていき、光の中で 1 体に 溶け合う。胸に 二重奏の 楽譜が 灯る
    DUET_FUSION: {
        steps: [
            { bg: '#141428' },
            { show: 'ai', sprite: 'bird-ai', x: 110, y: 120, scale: 4 },
            { show: 'do', sprite: 'bird-do', x: 210, y: 120, scale: 4 },
            { say: ['', LINES.duetFuseA], ms: 1400 },
            { move: 'ai', to: [150, 120], ms: 900 },
            { move: 'do', to: [170, 120], ms: 900 },
            { shake: 700 },
            { dark: 1, ms: 300 },
            { hide: 'ai' },
            { hide: 'do' },
            { show: 'duet', sprite: 'duet-boss', x: 160, y: 120, scale: 1 },
            { dark: 0, ms: 500 },
            { zoom: 'duet', scale: 3, ms: 900 },
            { shake: 500 },
            { say: ['', LINES.duetFuseB], ms: 1600 },
            { text: 'デュエット', color: '#e8d6ff', size: 20, ms: 1200 },
            { text: null }
        ],
        short: [
            { bg: '#141428' },
            { show: 'duet', sprite: 'duet-boss', x: 160, y: 120, scale: 3 },
            { shake: 400 },
            { say: ['', LINES.duetFuseB], ms: 1200 }
        ]
    }
};
