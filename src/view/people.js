// 現実の 人の ドット絵 (2026-11-13 ユーザー指定: 重厚感を 出す。立ち絵の ある 人は 立ち絵を 参考に)
// 横 16 × 縦 24 ドット。頭・体・足を 型で 描いてから、まわりに 濃い 輪郭線を 足す。光は 左上から (右側を 暗く)。
// LOOKS の 1 人ずつに 髪型 (hair)・服 (top)・下 (bottom) と 色を 決める。立ち絵 public/img/chara/*.png の 特徴:
//   ハル: 黒っぽい 茶の くせ毛・紺の ブレザー・白シャツ・青い ネクタイ
//   リク: 茶色の はねた 髪・日焼け・紺の ブレザーの 下に 黄色い パーカー
//   ミオ: 黒髪の 低い サイドの 一つ結び・紺の ブレザー・赤い リボン・紺の プリーツスカート
//   カナ: 黒髪の ボブ・紺の ブレザー・赤い リボン・赤い リストバンド
//   アキ先生: 茶色の くせ毛を 後ろで まとめる・紺の ジャージ・白い Tシャツ・首から 笛
//   父: 黒の 短い 髪 (こめかみが 白い)・白い シャツを 腕まくり・紺の ネクタイ・灰色の ズボン
//   リクの父: 茶色の 短い くせ毛・日焼け・紺の 作業着・灰色の Tシャツ
//   ミチル: 長い 黒髪を ゆるく 結ぶ・黒い コート・ベージュの タートルネック・星の ペンダント
//   ヒカリ: 黒い ボブに 髪どめ・黄色い カーディガン・水色の パジャマ

const W = 16;
const H = 24;
const OUTLINE = '#1a1830';
const SKIN = { light: '#f6d2b0', tan: '#e2b088', dark: '#c98e64' };
const NAVY = '#2a3466';

// 色を 暗く (k < 1) / 明るく (k > 1) する
function tone(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1))));
    return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
}

export const LOOKS = {
    hal: { hair: 'messy', hairColor: '#2a2230', skin: SKIN.tan, top: 'blazer', jacket: NAVY, tie: '#3f6ad0', bottom: 'pants', pants: '#262c50' },
    riku: { hair: 'spiky', hairColor: '#7a5230', skin: SKIN.dark, top: 'hoodie', jacket: NAVY, inner: '#f2c232', bottom: 'pants', pants: '#262c50' },
    mio: { hair: 'sidetail', hairColor: '#1e1c2c', skin: SKIN.light, top: 'blazer', jacket: NAVY, ribbon: '#c8343c', bottom: 'skirt', pants: '#262c50', socks: '#262c50' },
    kana: { hair: 'bob', hairColor: '#1e1c2c', skin: SKIN.light, top: 'blazer', jacket: NAVY, ribbon: '#c8343c', bottom: 'skirt', pants: '#262c50', socks: '#262c50', band: '#e0443c' },
    aki: { hair: 'tiedMessy', hairColor: '#7a5234', skin: SKIN.light, top: 'track', jacket: '#2c3a74', inner: '#eef0f4', bottom: 'pants', pants: '#2c3a74', whistle: true },
    father: { hair: 'short', hairColor: '#1e1c24', gray: '#a8a8b8', skin: SKIN.tan, top: 'shirt', inner: '#eceaf0', tie: '#262c50', bottom: 'pants', pants: '#6a6a78', belt: true, adult: true },
    rikuFather: { hair: 'short', hairColor: '#6a4a30', skin: SKIN.dark, top: 'work', jacket: '#34507c', inner: '#6e6e78', bottom: 'pants', pants: '#3a3a48', adult: true },
    michiru: { hair: 'longLoose', hairColor: '#1e1c2c', skin: SKIN.light, top: 'coat', jacket: '#24222e', inner: '#d8c4a4', bottom: 'coat', pants: '#24222e', pendant: '#ffd86b', adult: true },
    hikari: { hair: 'bob', hairColor: '#1e1c2c', skin: SKIN.light, clip: true, top: 'cardigan', jacket: '#f0d282', inner: '#b8cce8', bottom: 'pajama', pants: '#b8cce8' },
    // 立ち絵の ない 人 (キャラクター設定資料集「町の人たち」の 色のまま 描き直す)
    momo: { hair: 'twin', hairColor: '#6a4a30', skin: SKIN.light, top: 'blazer', jacket: NAVY, ribbon: '#f0a0c0', bottom: 'skirt', pants: '#262c50', socks: '#eef0f4', pins: '#f0a0c0' },
    kaito: { hair: 'short', hairColor: '#1e1c24', skin: SKIN.light, top: 'blazer', jacket: NAVY, tie: '#3f6ad0', bottom: 'pants', pants: '#262c50', glasses: '#c84a48' },
    student: { hair: 'short', hairColor: '#3a2a20', skin: SKIN.light, top: 'blazer', jacket: NAVY, tie: '#3f6ad0', bottom: 'pants', pants: '#262c50' },
    sora: { hair: 'long', hairColor: '#6a4a30', skin: SKIN.light, top: 'smock', jacket: '#eef0f4', ribbon: '#c8343c', bottom: 'skirt', pants: '#262c50', socks: '#262c50', paint: true },
    tome: { hair: 'bun', hairColor: '#c8c8d8', skin: SKIN.light, top: 'cardigan', jacket: '#8a7aa8', inner: '#eef0f4', bottom: 'skirt', pants: '#59509a', socks: '#8a7a6a', old: true },
    ken: { hair: 'short', hairColor: '#1e1c24', skin: SKIN.tan, top: 'tee', jacket: '#5a9ae0', bottom: 'shorts', pants: '#8a6a4a', child: true },
    // 広げた 町の 人たち (11/13)
    neighbor: { hair: 'bob', hairColor: '#5c4630', skin: SKIN.light, top: 'cardigan', jacket: '#c87a6a', inner: '#eef0f4', bottom: 'skirt', pants: '#5a5a78', socks: '#c8b8a8', adult: true },
    oldman: { hair: 'short', hairColor: '#c8c8d8', skin: SKIN.tan, top: 'work', jacket: '#6a7a5a', inner: '#d8d0c0', bottom: 'pants', pants: '#5a5048', old: true, glasses: '#8a8ea8' },
    postman: { hair: 'short', hairColor: '#2a2230', skin: SKIN.tan, top: 'work', jacket: '#4a6aa8', inner: '#eef0f4', bottom: 'pants', pants: '#2a3a6a', bag: '#8a5a32', adult: true },
    jogger: { hair: 'spiky', hairColor: '#3a2a20', skin: SKIN.dark, top: 'track', jacket: '#d84a48', inner: '#eef0f4', bottom: 'shorts', pants: '#2a2a3a', adult: true },
    girlKid: { hair: 'twin', hairColor: '#3a2a20', skin: SKIN.light, top: 'tee', jacket: '#f0a0c0', bottom: 'skirt', pants: '#6fb0ff', socks: '#eef0f4', pins: '#ffd86b', child: true },
    commuterA: { hair: 'long', hairColor: '#3a2a20', skin: SKIN.light, top: 'blazer', jacket: NAVY, ribbon: '#5ab07a', bottom: 'skirt', pants: '#262c50', socks: '#262c50' },
    commuterB: { hair: 'spiky', hairColor: '#5c4630', skin: SKIN.light, top: 'blazer', jacket: NAVY, tie: '#3f6ad0', bottom: 'pants', pants: '#262c50', bag: '#8a6a4a' },
    commuterC: { hair: 'short', hairColor: '#1e1c24', skin: SKIN.light, top: 'blazer', jacket: NAVY, tie: '#3f6ad0', bottom: 'pants', pants: '#262c50', glasses: '#c6c9ea' },
    commuterD: { hair: 'sidetail', hairColor: '#8a5a32', skin: SKIN.light, top: 'blazer', jacket: NAVY, ribbon: '#c8343c', bottom: 'skirt', pants: '#262c50', socks: '#eef0f4' }
};

// facing: 'down' (正面) / 'up' (後ろ) / 'side' (右向き)
export function personCanvas(id, facing = 'down') {
    const look = LOOKS[id];
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
    // 子ども・年寄りは 背を 低く (上に すき間)
    const drop = look.child ? 4 : look.old ? 2 : 0;
    ctx.save();
    ctx.translate(0, drop);
    if (facing === 'side') drawSide(px, look);
    else drawFront(px, look, facing === 'up');
    ctx.restore();
    outline(ctx);
    return canvas;
}

// ---- 正面 と 後ろ ----------------------------------------------------------
function drawFront(px, look, back) {
    const skin = look.skin;
    const skinD = tone(skin, 0.86);
    const hair = look.hairColor;
    const hairD = tone(hair, 0.7);
    const hairL = tone(hair, 1.35);
    const jacket = look.jacket ?? NAVY;
    const jacketD = tone(jacket, 0.72);
    const jacketL = tone(jacket, 1.25);
    const shorter = look.child ? 2 : 0;   // 子どもは 体も 短く

    // 足 (下から 描く)
    drawLegs(px, look, shorter, back);
    // 体 (y 11〜18)
    const top = 11;
    const bottom = 18 - shorter;
    // 腕
    px(2, top + 1, 2, bottom - top - 1, jacket);
    px(12, top + 1, 2, bottom - top - 1, jacketD);
    px(2, bottom, 2, 1, skin);
    px(12, bottom, 2, 1, skinD);
    // 胴
    px(4, top, 8, bottom - top + 1, jacket);
    px(10, top, 2, bottom - top + 1, jacketD);   // 右側は 影
    px(4, top, 1, bottom - top + 1, jacketL);    // 左の ふちは 明るく
    if (!back) drawTop(px, look, top, bottom);
    else {
        px(6, top, 4, 1, jacketD);   // 後ろの えり
        if (look.hair === 'sidetail' || look.hair === 'longLoose' || look.hair === 'long') px(5, top, 6, 3, hair);   // 長い 髪が 背中に かかる
    }
    // 首
    px(7, 10, 2, 1, skinD);
    // 頭: 顔 (x 4〜11, y 3〜9)
    px(4, 3, 8, 7, skin);
    px(10, 3, 2, 7, skinD);
    if (!back) {
        // 目 (2 ドット) と 口
        const eye = '#20203a';
        px(5, 6, 1, 2, eye);
        px(10, 6, 1, 2, eye);
        px(5, 6, 1, 1, '#4a4a70');
        px(10, 6, 1, 1, '#4a4a70');
        px(7, 9, 2, 1, tone(skin, 0.8));
        if (['skirt', 'pajama'].includes(look.bottom) && !look.old) {   // 女の子は 頬に 赤み
            px(4, 8, 1, 1, '#f0a0a0');
            px(11, 8, 1, 1, '#e09090');
        }
        if (look.glasses) {
            px(4, 6, 3, 1, look.glasses);
            px(9, 6, 3, 1, look.glasses);
            px(7, 6, 2, 1, look.glasses);
        }
        if (look.adult) px(4, 8, 1, 1, skinD);   // 大人は 頬の 影
    }
    drawHair(px, look, back, hair, hairD, hairL);
}

function drawTop(px, look, top, bottom) {
    const jacket = look.jacket ?? NAVY;
    const jacketD = tone(jacket, 0.72);
    const white = '#eef0f6';
    switch (look.top) {
        case 'blazer': {
            // 白い シャツの V と、ネクタイ か リボン。えりの 線と 金の ボタン
            px(6, top, 4, 3, white);
            px(7, top + 3, 2, 1, white);
            px(5, top, 1, 4, jacketD);
            px(10, top, 1, 4, jacketD);
            if (look.tie) {
                px(7, top, 2, 1, tone(look.tie, 0.8));
                px(7, top + 1, 2, 4, look.tie);
                px(8, top + 1, 1, 4, tone(look.tie, 0.75));
            }
            if (look.ribbon) {
                px(6, top, 4, 1, look.ribbon);
                px(7, top + 1, 2, 1, tone(look.ribbon, 0.75));
                px(6, top + 2, 1, 1, look.ribbon);
                px(9, top + 2, 1, 1, look.ribbon);
            }
            px(5, bottom - 2, 1, 1, '#d8b04a');
            px(5, bottom - 4, 1, 1, '#d8b04a');
            break;
        }
        case 'hoodie': {
            // 開いた ブレザーの まん中に 黄色い パーカー。首まわりに フード
            const inner = look.inner;
            px(6, top, 4, bottom - top + 1, inner);
            px(9, top, 1, bottom - top + 1, tone(inner, 0.82));
            px(5, top - 1, 6, 2, inner);
            px(5, top - 1, 1, 2, tone(inner, 0.8));
            px(7, top + 2, 1, 3, tone(inner, 0.7));   // ひも
            px(8, top + 2, 1, 2, tone(inner, 0.7));
            px(6, bottom - 2, 4, 1, tone(inner, 0.85));   // ポケット
            break;
        }
        case 'track': {
            // 紺の ジャージ: まん中の ファスナー、肩から 白い 線。首から 笛
            px(6, top, 4, 2, look.inner);
            px(7, top + 2, 1, bottom - top - 1, '#c6c9ea');
            px(3, top + 1, 1, bottom - top - 2, '#eef0f6');
            px(12, top + 1, 1, bottom - top - 2, '#c6c9ea');
            if (look.whistle) {
                px(6, top + 1, 1, 2, '#c6c9ea');
                px(9, top + 1, 1, 2, '#c6c9ea');
                px(8, top + 3, 2, 2, '#d8dce8');
                px(9, top + 4, 1, 1, '#8a8ea8');
            }
            break;
        }
        case 'shirt': {
            // 白い シャツを 腕まくり・ネクタイ・ベルト
            const inner = look.inner;
            px(2, top + 1, 2, bottom - top - 1, inner);
            px(12, top + 1, 2, bottom - top - 1, tone(inner, 0.82));
            px(2, top + 4, 2, 3, look.skin);
            px(12, top + 4, 2, 3, tone(look.skin, 0.86));
            px(4, top, 8, bottom - top + 1, inner);
            px(10, top, 2, bottom - top + 1, tone(inner, 0.84));
            px(6, top, 1, 1, tone(inner, 0.7));
            px(9, top, 1, 1, tone(inner, 0.7));
            px(7, top, 2, 6, look.tie);
            px(8, top + 1, 1, 5, tone(look.tie, 0.7));
            px(11, top + 2, 1, 2, tone(inner, 0.75));   // 胸ポケット
            if (look.belt) {
                px(4, bottom, 8, 1, '#24222a');
                px(7, bottom, 2, 1, '#b8b8c8');
            }
            break;
        }
        case 'work': {
            // 紺の 作業着: 灰色の Tシャツ・胸ポケット 2 つ
            px(6, top, 4, bottom - top + 1, look.inner);
            px(9, top, 1, bottom - top + 1, tone(look.inner, 0.8));
            px(4, top + 2, 2, 2, jacketD);
            px(10, top + 2, 2, 2, tone(jacket, 0.6));
            px(5, top, 1, 2, tone(jacket, 1.25));
            px(10, top, 1, 2, jacketD);
            break;
        }
        case 'coat': {
            // 黒い コート・ベージュの タートルネック・星の ペンダント
            px(6, top - 1, 4, 2, look.inner);
            px(6, top + 1, 4, 4, look.inner);
            px(9, top - 1, 1, 6, tone(look.inner, 0.82));
            px(7, top + 3, 2, 1, look.pendant);
            px(5, top, 1, 6, tone(jacket, 1.5));
            px(10, top, 1, 6, tone(jacket, 1.3));
            break;
        }
        case 'cardigan': {
            // カーディガン: まん中から 内側の 服が 見える。すそに ゴム編みの 線
            px(6, top, 4, bottom - top + 1, look.inner);
            px(9, top, 1, bottom - top + 1, tone(look.inner, 0.85));
            px(7, top + 2, 1, 1, '#ffffff');
            px(8, top + 4, 1, 1, '#d8b04a');
            px(4, bottom, 2, 1, tone(jacket, 0.8));
            px(10, bottom, 2, 1, tone(jacket, 0.65));
            px(2, bottom - 1, 2, 1, tone(jacket, 0.8));
            break;
        }
        case 'smock': {
            // 美術部の 白い スモック (絵の具の しみ) と リボン
            px(6, top, 4, 1, look.ribbon);
            px(7, top + 1, 2, 1, tone(look.ribbon, 0.75));
            if (look.paint) {
                px(5, top + 3, 1, 1, '#6fb0ff');
                px(9, top + 4, 1, 1, '#ff8f7a');
                px(7, top + 6, 1, 1, '#ffd86b');
            }
            break;
        }
        case 'tee': {
            px(6, top, 4, 1, tone(jacket, 0.7));
            px(7, top + 3, 2, 2, '#ffffff');
            break;
        }
        default: break;
    }
    if (look.band) px(12, bottom - 1, 2, 1, look.band);   // カナの 赤い リストバンド
    if (look.bag) {
        px(1, top + 3, 2, 5, look.bag);
        px(3, top, 1, 4, tone(look.bag, 0.7));
    }
}

function drawLegs(px, look, shorter, back) {
    const pants = look.pants;
    const pantsD = tone(pants, 0.7);
    const shoe = look.child ? '#eef0f4' : '#2a2430';
    const y0 = 19 - shorter;
    switch (look.bottom) {
        case 'skirt': {
            // プリーツスカート と 足・靴下
            px(4, y0 - 1, 8, 3, pants);
            px(10, y0 - 1, 2, 3, pantsD);
            for (let x = 5; x < 11; x += 2) px(x, y0, 1, 2, tone(pants, 1.3));
            px(5, y0 + 2, 2, 1, look.skin);
            px(9, y0 + 2, 2, 1, tone(look.skin, 0.86));
            px(5, y0 + 3, 2, 1, look.socks ?? '#eef0f4');
            px(9, y0 + 3, 2, 1, tone(look.socks ?? '#eef0f4', 0.8));
            px(4, y0 + 4, 3, 1, shoe);
            px(9, y0 + 4, 3, 1, shoe);
            break;
        }
        case 'coat': {
            // 長い コートの すそ
            px(4, y0 - 1, 8, 3, pants);
            px(10, y0 - 1, 2, 3, tone(pants, 0.7));
            px(7, y0 - 1, 1, 3, tone(pants, 1.6));
            px(5, y0 + 2, 2, 2, '#2a2836');
            px(9, y0 + 2, 2, 2, '#22202c');
            px(4, y0 + 4, 3, 1, shoe);
            px(9, y0 + 4, 3, 1, shoe);
            break;
        }
        case 'shorts': {
            px(5, y0 - 1, 6, 2, pants);
            px(9, y0 - 1, 2, 2, pantsD);
            px(5, y0 + 1, 2, 2, look.skin);
            px(9, y0 + 1, 2, 2, tone(look.skin, 0.86));
            px(5, y0 + 3, 2, 1, '#eef0f4');
            px(9, y0 + 3, 2, 1, '#c6c9ea');
            px(4, y0 + 4, 3, 1, shoe);
            px(9, y0 + 4, 3, 1, shoe);
            break;
        }
        default: {   // ズボン・パジャマ
            px(5, y0, 6, 4, pants);
            px(9, y0, 2, 4, pantsD);
            px(7, y0 + 1, 2, 3, back ? pantsD : tone(pants, 0.82));
            if (look.bottom === 'pajama') px(6, y0 + 1, 1, 1, '#eef0f6');
            px(4, y0 + 4, 3, 1, look.bottom === 'pajama' ? '#eef0f4' : shoe);
            px(9, y0 + 4, 3, 1, look.bottom === 'pajama' ? '#c6c9ea' : shoe);
        }
    }
}

function drawHair(px, look, back, hair, hairD, hairL) {
    // 共通: 頭の てっぺん (y 1〜3)
    px(4, 1, 8, 1, hair);
    px(3, 2, 10, 2, hair);
    px(11, 2, 2, 2, hairD);
    px(5, 1, 3, 1, hairL);   // つや
    if (back) {
        // 後ろ姿: 頭ぜんぶが 髪
        px(3, 3, 10, 7, hair);
        px(11, 3, 2, 7, hairD);
        px(5, 3, 2, 1, hairL);
    }
    switch (look.hair) {
        case 'messy': {   // ハル: くせ毛。前髪が ばらばらに 目へ かかる
            px(3, 4, 1, 4, hair);
            px(12, 4, 1, 4, hairD);
            if (!back) {
                px(4, 4, 7, 1, hair);
                px(5, 5, 1, 1, hair);
                px(7, 5, 2, 1, hair);
                px(10, 5, 1, 1, hairD);
            }
            px(4, 0, 1, 1, hair);
            px(8, 0, 2, 1, hair);
            px(2, 3, 1, 2, hair);
            break;
        }
        case 'spiky': {   // リク: はねた 髪。横にも 飛び出す
            px(3, 4, 1, 3, hair);
            px(12, 4, 1, 3, hairD);
            if (!back) {
                px(4, 4, 8, 1, hair);
                px(6, 5, 1, 1, hair);
                px(9, 5, 1, 1, hairD);
            }
            px(3, 0, 1, 1, hair);
            px(6, 0, 1, 1, hair);
            px(9, 0, 2, 1, hair);
            px(12, 1, 2, 1, hairD);
            px(1, 2, 2, 1, hair);
            px(13, 3, 1, 1, hairD);
            break;
        }
        case 'short': {   // 短い 髪 (父は こめかみが 白い)
            px(3, 4, 1, 2, look.gray ?? hair);
            px(12, 4, 1, 2, look.gray ? tone(look.gray, 0.8) : hairD);
            if (!back) px(4, 4, 8, 1, hair);
            px(5, 0, 1, 1, hair);
            px(8, 0, 1, 1, hair);
            break;
        }
        case 'bob': {   // カナ・ヒカリ: ボブ。前髪は まっすぐ、横は あごまで
            px(3, 4, 2, 6, hair);
            px(11, 4, 2, 6, hairD);
            px(3, 10, 1, 1, hair);
            px(12, 10, 1, 1, hairD);
            if (!back) {
                px(5, 4, 6, 1, hair);
                px(5, 5, 2, 1, hair);
                px(8, 5, 2, 1, hair);
            } else px(3, 9, 10, 2, hair);
            if (look.clip) {
                px(4, 3, 2, 1, '#ff8fb0');
                px(5, 4, 1, 1, '#8fe0a0');
            }
            break;
        }
        case 'sidetail': {   // ミオ: 低い サイドの 一つ結び (右肩に 垂れる)
            px(3, 4, 2, 6, hair);
            px(11, 4, 2, 5, hairD);
            if (!back) {
                px(5, 4, 6, 1, hair);
                px(6, 5, 1, 1, hair);
                px(9, 5, 1, 1, hair);
            }
            px(12, 9, 2, 1, '#c8343c');   // 髪ゴム
            px(12, 10, 2, 5, hair);
            px(13, 10, 1, 5, hairD);
            px(12, 15, 1, 1, hairD);
            break;
        }
        case 'twin': {   // モモ: ふたつ結び
            px(3, 4, 1, 4, hair);
            px(12, 4, 1, 4, hairD);
            if (!back) px(4, 4, 8, 1, hair);
            px(1, 4, 2, 5, hair);
            px(13, 4, 2, 5, hairD);
            px(2, 3, 1, 1, look.pins ?? hair);
            px(13, 3, 1, 1, look.pins ?? hair);
            break;
        }
        case 'long': {   // 長い まっすぐの 髪
            px(3, 4, 2, 9, hair);
            px(11, 4, 2, 9, hairD);
            if (!back) px(5, 4, 6, 1, hair);
            else px(3, 9, 10, 4, hair);
            break;
        }
        case 'longLoose': {   // ミチル: 長い 黒髪を ゆるく 結ぶ。顔に かかる
            px(3, 4, 2, 10, hair);
            px(11, 4, 2, 10, hairD);
            px(2, 6, 1, 6, hair);
            px(13, 6, 1, 6, hairD);
            if (!back) {
                px(5, 4, 6, 1, hair);
                px(5, 5, 1, 2, hair);
                px(10, 5, 1, 1, hairD);
            } else px(3, 9, 10, 5, hair);
            break;
        }
        case 'tiedMessy': {   // アキ先生: くせ毛を 後ろで まとめる・アホ毛
            px(3, 4, 1, 4, hair);
            px(12, 4, 1, 5, hairD);
            if (!back) {
                px(4, 4, 7, 1, hair);
                px(6, 5, 1, 1, hair);
            }
            px(9, 0, 1, 1, hair);
            px(10, -1 + 1, 1, 1, hairL);
            px(13, 6, 1, 4, hairD);   // 後ろで まとめた 髪
            break;
        }
        case 'bun': {   // トメ: 白髪の おだんご
            px(3, 4, 1, 2, hair);
            px(12, 4, 1, 2, hairD);
            if (!back) px(4, 4, 8, 1, hair);
            px(6, -1 + 1, 4, 1, hairD);
            break;
        }
        default: break;
    }
}

// ---- 横向き (右を 向く) ----------------------------------------------------
function drawSide(px, look) {
    const skin = look.skin;
    const hair = look.hairColor;
    const hairD = tone(hair, 0.7);
    const jacket = look.jacket ?? NAVY;
    const jacketD = tone(jacket, 0.72);
    const pants = look.pants;
    const shorter = look.child ? 2 : 0;
    const top = 11;
    const bottom = 18 - shorter;
    const y0 = 19 - shorter;
    // 足 (前後に 開く)
    if (look.bottom === 'skirt') {
        px(5, y0 - 1, 7, 3, pants);
        px(6, y0 + 2, 2, 2, skin);
        px(9, y0 + 2, 2, 2, tone(skin, 0.86));
    } else if (look.bottom === 'coat') {
        px(5, y0 - 1, 7, 4, pants);
    } else {
        px(6, y0, 2, 4, pants);
        px(9, y0, 2, 4, tone(pants, 0.7));
    }
    px(6, y0 + 4, 3, 1, '#2a2430');
    px(9, y0 + 4, 3, 1, '#2a2430');
    // 体 と 前の 腕
    px(5, top, 6, bottom - top + 1, jacket);
    px(5, top, 1, bottom - top + 1, jacketD);
    if (look.top === 'blazer' || look.top === 'shirt') px(10, top, 1, 3, '#eef0f6');
    if (look.top === 'hoodie' || look.top === 'cardigan' || look.top === 'coat' || look.top === 'work') px(10, top, 1, bottom - top, look.inner);
    if (look.tie) px(10, top + 1, 1, 3, look.tie);
    px(7, top + 1, 2, bottom - top - 1, jacketD);
    px(7, bottom, 2, 1, skin);
    // 首 と 頭 (顔は 右へ)
    px(7, 10, 2, 1, tone(skin, 0.86));
    px(5, 3, 7, 7, skin);
    px(11, 6, 1, 2, skin);   // 鼻
    px(10, 6, 1, 2, '#20203a');   // 目
    px(10, 9, 1, 1, tone(skin, 0.7));
    // 髪: 後ろ (左) に 厚く
    px(5, 1, 6, 1, hair);
    px(4, 2, 8, 2, hair);
    px(4, 4, 3, 5, hair);
    px(4, 4, 1, 5, hairD);
    px(7, 4, 4, 1, hair);
    px(6, 2, 3, 1, tone(hair, 1.35));
    if (look.hair === 'messy') {
        px(10, 5, 1, 1, hair);
        px(5, 0, 1, 1, hair);
        px(8, 0, 2, 1, hair);
        px(3, 3, 1, 2, hair);
    }
    if (look.hair === 'bob' || look.hair === 'sidetail') px(4, 9, 3, 2, hair);
    if (look.hair === 'long' || look.hair === 'longLoose') px(4, 9, 3, 5, hairD);
}

// まわりに 1 ドットの 輪郭線 (重厚感)
function outline(ctx) {
    const image = ctx.getImageData(0, 0, W, H);
    const d = image.data;
    const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
    const edge = [];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (solid(x, y)) continue;
            if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) edge.push([x, y]);
        }
    }
    ctx.fillStyle = OUTLINE;
    for (const [x, y] of edge) ctx.fillRect(x, y, 1, 1);
}
