# ユメクイ（仮題）

他人の夢に入り、言えなかった気持ちから生まれたモンスター「ユメクイ」を仲間にしていく、ループ型のモンスター育成RPGです。

企画書: https://claude.ai/artifact/1b5QqWpwvEiTK2mwCZKNDR

## 遊び方

```
npm install
npm run dev
```

- 移動: 矢印キー または WASD
- 決定・調べる: J / Z / Enter / スペース
- メニュー・もどる: X / Esc
- キーの割り当ては「ボタン設定」で変えられます
- スマホでは、画面の下のボタンで操作します

## いま入っているもの

小規模版の途中です。2月1日〜14日の昼と夜、ハルの夢、ミオとカナの単独の夢、仲間と交代、ループまで遊べます。夢合体、リクの夢、キャンバス、ルート分岐はこれからです。

## 開発

- `npm test`: ルールと地図のテスト
- `node tools/browser-test.mjs <URL> <画像フォルダ>`: Chrome でチュートリアルを最後まで自動で遊ぶ
- セリフは `src/scenes/story.js`、地図は `src/data/maps.js`、数値は `src/data/units.js` にあります
