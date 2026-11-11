// 曲・効果音・セリフの声の 一覧 (サウンドリスト・素材制作仕様書「置き場所とファイル名」)。
//   曲は public/audio/bgm/<file>.ogg (同じ名前の .mp3 も)、効果音は public/audio/se/、声は public/audio/voice/。
//   ファイルが まだ 無いものは 鳴らさない (エラーにも しない)。置けば そのまま 鳴る
export const AUDIO_DIR = { bgm: 'audio/bgm/', se: 'audio/se/', voice: 'audio/voice/' };

// loop: 最後まで 鳴ったら 頭に もどる。layers: 同じ 長さの パート (ステム)。あれば 本体と 同時に 鳴らし、場面に 合わせて 消す
export const BGM = {
    M01: { file: 'M01_title', title: '夢見坂', loop: true },
    M02: { file: 'M02_haru', title: 'うん、いいよ', loop: true },
    M03: { file: 'M03_haru_dream', title: 'みんなこっちを見てる', loop: true },
    M04: { file: 'M04_battle', title: '飲み込んだ言葉', loop: true },
    M05: { file: 'M05_muresuima', title: '自分で決めたかった', loop: true },
    // 町の曲: 町の人の パートを 別に 用意できたら、喰らった人の パートを 永久に 消す
    M06: { file: 'M06_town', title: '潮風と坂道', loop: true, town: true, layers: { mio: 'M06_mio', kana: 'M06_kana', riku: 'M06_riku' } },
    M07: { file: 'M07_room', title: '白いキャンバス', loop: true },
    M08: { file: 'M08_mio_dream', title: '泡になったソロ', loop: true },
    M09: { file: 'M09_kana_dream', title: 'せかされる拍', loop: true },
    M10: { file: 'M10_gakufume', title: 'ひとりの席', loop: true },
    M11: { file: 'M11_togemetoro', title: '相談なんて', loop: true },
    M12: { file: 'M12_duet_hall', title: 'すれ違う二重奏', loop: true },
    M13: { file: 'M13_duet', title: '一緒に吹きたかった', loop: true },
    M14: { file: 'M14_riku_dream', title: 'だいじょうぶだいじょうぶ', loop: true },
    M15: { file: 'M15_nightmare', title: '星のない夜', loop: true },
    M16: { file: 'M16_himawarion', title: '空元気', loop: true },
    M17: { file: 'M17_loop', title: '十四日目の夜', loop: false },
    // 救ったとき: 人ごとの 版 (M18_mio など) が あれば そちらを 鳴らす
    M18: { file: 'M18_saved', title: 'ほどける音', loop: false, versions: ['mio', 'kana', 'riku'] },
    M19: { file: 'M19_devour', title: '―', loop: false },
    M20: { file: 'M20_good_end', title: '言えた日', loop: false },
    // ノーマルED: 救った人の パートだけ 鳴らす (救えなかった人の パートは 鳴らない)
    M21: { file: 'M21_normal_end', title: '空白のある絵', loop: false, layers: { mio: 'M21_mio', kana: 'M21_kana', riku: 'M21_riku' } },
    M22: { file: 'M22_yumekui_end', title: 'おなかいっぱい', loop: false },
    M23: { file: 'M23_bak', title: 'ふとんの中の味方', loop: true },
    M24: { file: 'M24_makimodoshi', title: 'まきもどしのうた', loop: false, versions: ['short'] }
};

export const SE = {
    SE01: { file: 'SE01_cursor', label: 'カーソル移動' },
    SE02: { file: 'SE02_decide', label: '決定' },
    SE03: { file: 'SE03_back', label: 'もどる・開けない' },
    SE05: { file: 'SE05_word', label: '吹き出しを拾う' },
    SE06: { file: 'SE06_gate', label: '門が開く' },
    SE07: { file: 'SE07_shard', label: '夢のかけらを取り戻す' },
    SE08: { file: 'SE08_door', label: '光る扉（目を覚ます）' },
    SE09: { file: 'SE09_blanket', label: '毛布で休む' },
    SE10: { file: 'SE10_canvas', label: 'キャンバスに描く' },
    SE20: { file: 'SE20_battle', label: 'バトル開始' },
    SE21: { file: 'SE21_hit', label: '攻撃が当たる' },
    SE22: { file: 'SE22_weak', label: '弱点を突く' },
    SE23: { file: 'SE23_guard', label: 'まもるで受ける' },
    SE24: { file: 'SE24_heal', label: '回復' },
    SE25: { file: 'SE25_heart', label: 'ココロ攻撃が当たる' },
    SE26: { file: 'SE26_miss', label: 'ココロ攻撃が外れる' },
    SE27: { file: 'SE27_chance', label: '本音のチャンス' },
    SE28: { file: 'SE28_truth', label: '本音を当てる' },
    SE29: { file: 'SE29_wrong', label: '本音を外す' },
    SE30: { file: 'SE30_swap', label: '交代' },
    SE31: { file: 'SE31_down', label: '味方が倒れる' },
    SE32: { file: 'SE32_charge', label: '敵のため' },
    SE33: { file: 'SE33_sleep', label: '眠らせる' },
    SE34: { file: 'SE34_learn', label: 'スキルを覚える' },
    SE35: { file: 'SE35_musou', label: '夢双' },
    // ホラー演出 (「ホラー演出：ひかえめ」では 小さく する)
    SE40: { file: 'SE40_attack', label: 'ユメクイが襲いかかる', horror: true },
    SE41: { file: 'SE41_scream', label: 'ユメクイの叫び声', horror: true },
    SE42: { file: 'SE42_redtext', label: 'ナイトメアの赤い字', horror: true },
    SE43: { file: 'SE43_jumpscare', label: 'ジャンプスケア', horror: true },
    SE44: { file: 'SE44_wake', label: 'ベッドで飛び起きる', horror: true },
    SE45: { file: 'SE45_face', label: '夢主の顔が重なる', horror: true }
};

// セリフの 声: 話す人の 名前 → 声の ファイル。名前の 無い 地の文は ナレーション。ナイトメアは 声なし
export const VOICES = {
    '': 'narration',
    'ハル': 'haru',
    'バク': 'bak',
    'リク': 'riku',
    'ミオ': 'mio',
    'カナ': 'kana',
    'ミチル': 'michiru'
};
export const SILENT_SPEAKERS = ['ナイトメア', '？？？'];

// 音量の 初期値 (曲 70%・効果音 80%・声 80%)。ホラー演出は ふつう / ひかえめ
export const DEFAULT_AUDIO = { bgm: 0.7, se: 0.8, voice: 0.8, horror: 'normal' };
export const SOFT_HORROR_RATE = 0.4;
