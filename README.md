# U-culling Rock Site — README

ライブハウス風の照明演出・ニュース/ライブ情報・メンバーカルーセルを備えた**静的サイト**です。  
更新は `data/*.json` を編集し、画像を `assets/` に追加するだけで反映できます。

---

## 1) 動作要件

- 任意の静的サーバ（`file://` 直開きでは `fetch()` が失敗します）
  - 例（PowerShell / コマンドプロンプト）:
    - **Python**: `python -m http.server 8000`
    - **Node**: `npx serve -l 8000`
    - **VSCode**: Live Server 拡張
- モダンブラウザ（iOS/Android/Chrome/Edge/Safari）

---

## 2) ディレクトリ構成

```
u-culling-rock-site/
├─ index.html
├─ css/
│  └─ style.css              # 照明演出・3件スクロールなど全スタイル
├─ js/
│  ├─ main.js                # NEWS/LIVE/MEMBERS 読み込み & カルーセル制御
│  ├─ nav.js                 # モバイルドロワー（必要に応じて）
│  └─ util.js                # 小道具（あれば）
├─ data/
│  ├─ news.json              # ニュース（配列 or {news:[...]}）
│  ├─ shows.json             # ライブ情報（複数形式に対応）
│  └─ members.json           # メンバー一覧
└─ assets/
   ├─ hero.jpg, logo.jpg, live_*.jpg, member_*.jpg/png ...
   ├─ X.png, VRChat.png, github-mark-white.png   # SNSアイコン画像
   └─ icons.svg（使わなくてもOK）
```

---

## 3) ローカル表示

1. ルートでサーバ起動  
   例: `python -m http.server 8000`
2. ブラウザで `http://localhost:8000` を開く
3. 変更は保存後にリロード。**強制再読み込み（Ctrl+F5）**推奨

> `main.js` の `fetch()` は `cache: "no-store"` 指定済みですが、ブラウザの積極的キャッシュが残る場合は強制リロード・クエリ付与（`?v=タイムスタンプ`）をご利用ください。

---

## 4) データ更新（重要）

### 4.1 NEWS（`data/news.json`）

- 形式は**配列**または **`{ "news": [...] }`** のどちらでもOK  
- **4件目以降も全て読み込み**ます。表示は CSS 側で**3件固定＋縦スクロール**

**推奨スキーマ**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `title` | string | ✔ | 見出し（クリック可能にしたい場合は `url` も指定） |
| `date` | string | ✔ | `YYYY-MM-DD` 推奨（`YYYY/MM/DD` も可） |
| `tag` | string |  | 任意のカテゴリー名（NEWS, INFO など） |
| `desc` | string |  | 短い本文（任意） |
| `url` | string |  | 外部リンク（X/YouTube/告知など） |

**例（配列版）**
```json
[
  {
    "title": "初ワンマン決定！",
    "date": "2026-02-11",
    "tag": "NEWS",
    "desc": "渋谷WWWにて開催。詳細は近日公開。",
    "url": "https://example.com/announce"
  },
  {
    "title": "グッズ第2弾",
    "date": "2025-12-15",
    "tag": "INFO",
    "desc": "Tシャツ/ステッカーを追加しました。"
  }
]
```

> **日付表示**は `YYYY.MM.DD` でフォーマットされます（`fmtDate()`）。  
> **並び順**は日付の新しい順。

---

### 4.2 LIVE / SHOWS（`data/shows.json`）

**サポート形式は 3種類**（どれでもOK）

1) **区分済みオブジェクト形式**
```json
{
  "upcoming": [
    {
      "title": "U-culling LIVE 2026",
      "date": "2026-03-20",
      "venue": "渋谷WWW",
      "city": "Tokyo",
      "open": "18:00",
      "start": "19:00",
      "ticket": "https://example.com/ticket",
      "more": "https://example.com/detail"
    }
  ],
  "past": [
    { "title": "Vket After Party", "date": "2025-09-12", "venue": "下北沢SHELTER" }
  ]
}
```

2) **単一配列形式（自動で今/過去に振分け）**
```json
[
  { "title": "渋谷WWW", "date": "2026-03-20", "venue": "WWW", "city": "Tokyo" },
  { "title": "下北沢SHELTER", "date": "2025-09-12" }
]
```

3) **`{ "shows": [...] }` 形式（同上）**
```json
{ "shows": [ { "title":"...", "date":"..." } ] }
```

**振り分けルール**
- `date >= 本日` → **Upcoming**（本日分を含む）
- `date < 本日` → **Past**
- Upcoming は **日付昇順**、Past は **降順** で表示

**フィールド一覧**

| フィールド | 型 | 必須 | 例 |
|---|---|---|---|
| `title` | string | ✔ | 「Tokyo Indie Fes」 |
| `date`  | string | ✔ | `YYYY-MM-DD` 推奨（`YYYY/MM/DD` 可） |
| `venue` | string |  | 「渋谷WWW」 |
| `city`  | string |  | 「Tokyo」 |
| `open`  | string |  | 「18:00」 |
| `start` | string |  | 「19:00」 |
| `ticket`| string |  | チケットURL |
| `more`  | string |  | 詳細URL |

> **注意**: `date` は文字列で記述してください。  
> JavaScript の `Date` 変換はロケール依存の揺らぎがあるため、`YYYY-MM-DD` を推奨します。

---

### 4.3 MEMBERS（`data/members.json`）

- 形式: **配列**（または `{ "members":[ ... ] }`）
- 画像は `assets/` へ配置して相対パス指定

**スキーマ**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `name`  | string | ✔ | 表示名 |
| `role`  | string | ✔ | 役割（Vocal, Guitar など） |
| `image` | string |  | メンバー写真パス（例: `assets/member_vocal.jpg`） |
| `social`| object |  | SNSリンクの辞書（キー名は柔軟に解釈） |

**ソーシャルのキー名について**  
`main.js` 側で以下にマッピングされます（大文字小文字問わず）:

- `X` / `Twitter` → **x**
- `VRChat` / `vrchat` → **vrchat**
- `Github` / `GitHub` → **github**
- それ以外はそのままキー名で扱われます（アイコン追加は後述）

**例**
```json
[
  {
    "name": "ししゃもん",
    "role": "Vocal",
    "image": "assets/member_vocal.jpg",
    "social": { "X": "https://x.com/sh1sh4mo33" }
  },
  {
    "name": "DOYSOUND",
    "role": "Backing Guitar",
    "image": "assets/member_guitarB.png",
    "social": {
      "X": "https://x.com/sh1sh4mo33",
      "VRChat": "https://vrchat.com/home/user/usr_XXXX",
      "Github": "https://doysound-cmd.github.io/Portfolio/"
    }
  }
]
```

**SNSアイコンの追加方法**

1. 画像ファイル（PNG等）を `assets/` に置く  
2. `js/main.js` 内の `ICONS_MAP` にキーとパスを追加
   ```js
   const ICONS_MAP = {
     x: "assets/X.png",
     vrchat: "assets/VRChat.png",
     github: "assets/github-mark-white.png",
     youtube: "assets/youtube.png"   // ← 追加例
   };
   ```
3. `members.json` の `social` に `{"YouTube":"https://..."}`
   といった形でキーを追加（小文字化してマッピングされます）

---

## 5) 画像の追加・差し替え

1. `assets/` に **小さめのファイル** を配置（例: 1920×1080 以内、圧縮推奨）  
2. `news.json` / `shows.json`（必要なら）/ `members.json` で相対パス参照  
3. 反映されない場合は **強制リロード**、もしくはファイル名を変更

**トラブル時のチェック**
- パスの綴り（`assets/member_guitarA.jpg` など）  
- 大文字小文字の違い（Windows以外は厳密）  
- 画像の**拡張子**（`.JPG` と `.jpg`）  
- JSON の文法（カンマ漏れ・全角/半角記号）

---

## 6) 見た目・挙動に関する設定

### 6.1 照明演出（CSSカスタムプロパティ）
`css/style.css` 冒頭の `:root` で色や不透明度を調整

```css
:root{
  --sl-opacity: .20;          /* 明るさ（0〜1） */
  --sl-c1:#ff6f68;            /* 赤系 */
  --sl-c2:#ffffff;            /* 白(黄寄り) */
  --sl-c3:#ffffff;            /* 白(水色寄り) */
  --sl-c4:#ff6f68;            /* 赤(紫寄り演出) */
}
```

### 6.2 「3件固定＋スクロール」の高さ
```css
:root{
  --news-h: 110px;   /* NEWS 1件の高さ */
  --show-h: 124px;   /* SHOW 1件の高さ */
}
```
テキスト量に応じて微調整してください。3件ぶんが**ピタッと収まる**設計です。

### 6.3 MEMBERS カルーセル
- **PC=3 / Tablet=2 / Mobile=1** 表示  
- 自動再生（デフォルト 3.5s）、ループ、ドット/ボタンあり  
- スクロールの**ラップ直後に加速する現象**を抑えるロジックを実装済み

### 6.4 モバイルのメニュー
スマホでは**メニュー非表示**の運用に合わせ、以下のように設定可能です（必要なら調整）。

```css
@media (max-width: 767.98px){
  .site-header{ display: none !important; }
  .nav-backdrop{ display: none !important; }
}
```

---

## 7) よくある質問（FAQ）

**Q. NEWS が3件しか出ません**  
A. `main.js` は**全件**読み込みます。CSSで**3件ぶんの高さ**に固定し、縦スクロールで4件目以降を表示する仕様です。`#news-list` が `overflow-y:auto` になっているか確認してください。

**Q. 画像が表示されない**  
A. パス・拡張子・大文字小文字を確認。`assets/` に存在するか、ブラウザのネットワークタブで 404/500 を確認。**ローカルは必ず HTTP サーバ**で開いてください。

**Q. SNSアイコンが出ない**  
A. `assets/` に `X.png` / `VRChat.png` / `github-mark-white.png` があるか、`ICONS_MAP` のキーとファイルパスを確認。未対応キーは `X` にフォールバックします。

**Q. Upcoming/Past の振り分けがおかしい**  
A. `shows.json` の `date` を `YYYY-MM-DD` に統一してください（時刻を含めるとタイムゾーンでずれることがあります）。

---

## 8) デプロイ（GitHub Pages 例）

1. リポジトリを GitHub に作成  
2. ルートに `index.html` がある状態で push  
3. **Settings → Pages**: Branch を `main` / `/ (root)` に設定  
4. 反映まで数分 → 公開URLで確認  
   変更後に反映が遅い場合は、ファイル名を変えるか `?v=timestamp` を付けると確実です。

---

## 9) 開発メモ

- iOSの `background-attachment: fixed` は制限があるため、hero 背景はメディアクエリで回避しています。  
- 「謎領域」対策として `body` 余白と `.site-header` 周辺のマージンは 0 で定義。  
  それでも出る場合はブラウザ拡張やデバッグ用CSSの干渉を確認してください。  
- レイアウトの基準フォントサイズは `--step-*` で管理。  
  **NEWS と LIVE の見出し**は `var(--step-1)` に統一済みです。

---

## 10) ライセンス / クレジット

- 画像・ロゴ・動画などの著作物は**各権利者に帰属**します。  
- サイトコードはバンド内運用を前提とした私的利用向けテンプレートです。外部配布時は権利関係に注意してください。

---

## 付録：最速チェックリスト（データ更新）

- [ ] 画像を `assets/` に追加（ファイル名は半角英数、小文字推奨）  
- [ ] `data/news.json` にニュースを追記（**配列** or **`{news:[...]}`**）  
- [ ] `data/shows.json` を更新（3形式いずれかでOK。日付は `YYYY-MM-DD`）  
- [ ] `data/members.json` を更新（`social` のキー名は柔軟に解釈）  
- [ ] ローカルサーバで表示確認（**強制リロード**）  
- [ ] 本番へデプロイ（GitHub Pages 等）→ 反映確認

困ったら `F12 → Console / Network` を開いてエラーを確認してください。JSON の **カンマ抜け** と **パスのタイプミス**が最多です。
