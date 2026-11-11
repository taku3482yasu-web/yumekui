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
    }
};
