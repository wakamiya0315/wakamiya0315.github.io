# Taishiro Wakamiya — Research Outputs

公開サイト: **https://wakamiya0315.github.io/**

英語の業績一覧サイトです。氏名、論文、国際会議、国内学会、特許を掲載します。日本語の業績タイトルと学会名は原題を維持しています。

## ローカル確認

Node.js 22以上を使用します。追加パッケージのインストールは不要です。

```sh
node --test
node scripts/dev.mjs
```

`http://127.0.0.1:4321` を開いて確認します。ソースを修正したらサーバーを終了して再実行します。`node scripts/build.mjs` だけでも `dist/` に公開用HTML・CSS・JavaScriptを生成できます。npmがある環境では、同じ処理を `npm test` / `npm run dev` / `npm run build` でも実行できます。

## 業績を更新する

正本は `data/achievements.json` です。HTMLを直接編集せず、このファイルを更新します。

1. `records` に業績を追加、または既存項目を修正します。
2. `site.updated` を更新日（`YYYY-MM-DD`）にします。
3. `node --test` と `node scripts/build.mjs` を実行し、ブラウザーでも確認します。
4. `main` にpushすると、GitHub Actionsが検証・生成・公開します。

Codexへの依頼例:

> この業績をサイトに追加してください。題名・著者順・掲載誌または学会・日付・DOIは次のとおりです: …。出典も記録し、Allと年別表示を確認して公開してください。

### データの要点

- `id`: サイト内で重複しない英数字・ハイフン・アンダースコアの識別子。既存のT2R2 IDは維持します。
- `category`: `journal` / `international-conference` / `domestic-conference` / `patent`。
- `title`, `titleLanguage` (`en` / `ja`), `authors`: 原題と元の著者順。`site.authorAliases` に一致する本人名を太字表示します。
- 論文・発表は `date` と `venue`、必要に応じて `volume`, `issue`, `award` を保存します。日付は確認できた精度（`YYYY` / `YYYY-MM` / `YYYY-MM-DD`）を維持します。
- 特許は `patent` に `status` (`published` / `registered`)、出願人、出願日・番号、公開日・番号、登録日・番号を保存します。登録レコードには登録日・番号が必要です。
- `links`: 確認済みの関連リンク。例: `{ "label": "DOI", "url": "https://doi.org/..." }`。
- `source`: 出典URL、`accessedDate`、保存した出典ファイルの `archive`。新しい出典も `sources/` に保存します。

新しい年や分類別の件数は自動生成されます。既存16件の移行回帰テストは、新しい業績を追加しても変更する必要はありません。

## 年別表示

初期表示は **All** です。年を選ぶと全分類を横断して絞り込みます。該当しない分類とページ内リンクは非表示になります。JavaScriptが使えない場合も全件を読めます。

| 種別 | 年の基準 |
| --- | --- |
| 論文 | 発行年 |
| 学会発表 | 開催年（T2R2の発表日） |
| 公開特許レコード | 公開年 |
| 登録特許レコード | 登録年 |

移行時の内訳は論文2件・国際会議3件・国内学会7件・特許4レコード、年別では2026年5件・2025年3件・2024年8件です。特許の年基準が異なるため、T2R2の年タブの件数とは一致しません。

## 出典と公開

T2R2の元ページ・BibTeX・CSVと取得情報を `sources/t2r2/2026-10-18/` に保存しています。欠損のあるCSVをそのまま移行せず、16件の個別ページを照合しました。DOIの補足情報と特許レコードの扱いは `sources/README.md` を参照してください。

GitHub Pagesの公開元は **GitHub Actions** です。公開するのは生成した `dist/` のみで、サイトの表示にT2R2や外部APIへの通信は必要ありません。

Gitコミットは `type(scope): 日本語の要約` のConventional Commits形式を使用します。

## TSUBAME4 Drive Storage

個人用Google DriveマウントのOAuthアプリ説明を `public/apps/tsubame4-drive/` に配置しています。
`index.html` がアプリの説明、`privacy.html` がGoogle APIデータの取り扱い、`terms.html` が利用条件です。
公開URLは `https://wakamiya0315.github.io/apps/tsubame4-drive/` です。

ビルドでは `public/` の静的ファイルを階層ごと `dist/` にコピーします。
Google Search Consoleの所有権確認用メタタグは `scripts/site.mjs` のホームページ生成部分で公開を維持します。
OAuthのクライアントシークレット、トークン、個人用設定ファイルはこのリポジトリに保存しません。
