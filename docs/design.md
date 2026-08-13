# 設計メモ

nonasaba.net（[nona-takahara.github.io]）のリポジトリ直置きだった remark
プラグインを、このパッケージへ切り出したときの検討記録です。

関連 issue: [nona-takahara.github.io#4]

[nona-takahara.github.io]: https://github.com/nona-takahara/nona-takahara.github.io
[nona-takahara.github.io#4]: https://github.com/nona-takahara/nona-takahara.github.io/issues/4

## 何を切り出したか

issue 起票時（2023 年）は「Markdown パーサ」と呼んでいましたが、独自パーサは
存在せず、実体はリポジトリルートの 2 ファイル・計 147 行でした。

| 元ファイル | 移行先 |
| --- | --- |
| `nonagfm.mjs` | `src/plugins/gfm.ts` |
| `markparse.mjs` の `underLine` | `src/plugins/underline.ts` |
| `markparse.mjs` の `MDNblock`（callout 部分） | `src/plugins/callout.ts` |
| `markparse.mjs` の `MDNblock`（`Key:` 部分） | `src/petitcom/index.ts` |
| `markparse.mjs` の `remarkCodeLanguage` | `src/plugins/code-language.ts` |

## なぜ独自パーサを書かなかったか

現行資産がすべて remark 前提であり、Astro / Next.js / 素の unified の
いずれからも同じ形で使えるため、「他の自作プロジェクトで利用可能にする」
という issue の目標をプラグイン集で十分に満たせます。
パーサ自作は工数が桁違いで、目標に対して過剰と判断しました。

description の「A less strict markup language」は方言の**仕様**を指し、
remark プラグイン集はその**実装**です。将来別の実装に置き換える余地は
仕様レベルで残ります。

## サイト固有だった部分の切り離し

元実装には nonasaba.net 固有のハードコードがありました。
そのままでは他プロジェクトで使えないため、すべてオプション化し、
**既定値を元の挙動に一致させる**方針を採りました。
これにより「サイト側は設定ゼロで従来どおり」「他プロジェクトは設定で調整」
が両立します。

| ハードコードだったもの | 対応 |
| --- | --- |
| 要素名 `mdn-callout` / `petitcom-public-key` | `hName` オプション |
| 日本語ラベル「警告：」「メモ：」 | バリアント定義の `label` |
| マーカー語 `Callout:` / `Note:` / `Warning:` | `variants` のキー |
| プチコン公開キー | `./petitcom` サブパスへ分離、プリセット非包含 |

## 移行時に直した不具合

元実装をそのまま TypeScript に移しただけでは、以下の不具合を持ち込むことに
なります。移行にあたって修正しました。

### GFM 拡張が呼ばれていなかった（最重要）

`nonagfm.mjs` は `gfmTable` / `gfmTableFromMarkdown` /
`gfmStrikethroughFromMarkdown` を**関数として呼ばずに**渡していました。
これらは各パッケージの v2 でオブジェクト export から関数 export に変わっており、
関数は enumerable なプロパティを持たないため、拡張の合成ループが何も見つけられず
**無言で no-op** になります。

結果として、テーブルは完全に無効、打ち消し線は micromark 側だけが生きて
**チルダが黙って消える**状態でした。

```
~~deleted~~ text  →  <p>deleted text</p>
```

テーブルは記事中で未使用だったため発覚していませんでしたが、
打ち消し線は実際に使われており、サイト上で表示されていませんでした。

### display math で例外

`remarkCodeLanguage` は `className` が配列である前提で添字アクセスしていました。
`mdast-util-math` は display math（`$$…$$`）にクラス名を付けないため、
`undefined` への添字アクセスで `TypeError` になり、ビルドが落ちます。
記事中に display math がなかったため発覚していませんでした。

### 公開キーの書式が違うと例外

`> **Key:** VALUE` のように括弧がない場合、`split()` の結果を無検証で参照して
`TypeError` になっていました。書式が合わないときは通常の blockquote として
そのまま残すようにしました。

### ノード型を見ない書き換え

`> **`Note:`** body` のようにマーカーがインラインコードだと、
`<strong><code>メモ：</code></strong>` という想定外の出力になっていました。
マーカーが `text` ノードのときだけ callout として扱うようにしています。

### mdast のノード型名の誤り

`'inline-code'` は mdast の型名として存在せず（正しくは `inlineCode`）、
その分岐は動いていませんでした。

### マーカー位置の参照

下線判定はマーカー位置を `strong` の**最初の子**を基準に求めていました。
実測では `___both___` や `**a __b__ c**` でも結果は変わりませんでしたが、
`strong` ノード自身の開始位置を見るほうが素直なので変更しています。

## あえて直さなかったもの

`data-lang="language-null"` は一見バグですが、**直してはいけません**。

nonasaba.net の MDX `code` コンポーネントは `data-lang` 属性の**有無**で
ブロックコードとインラインコードを判別し、ハイライタは `null` という言語名を
明示的に読み飛ばしています。言語指定のないフェンスは記事中に多数あるため、
属性を出すのをやめると、それらがすべてインラインコード扱いになり
レイアウトが崩れます。

既定は元の挙動のままとし、`emitForMissingLang: false` で無効化できる
オプションにしました。

## 挙動が変わる箇所

サイトの見た目に出る差分は、打ち消し線の復活だけです。

| 記事 | 変化 |
| --- | --- |
| `entry16.mdx` | `~~…~~` が `<del>` になる |
| `entry17.mdx` | `~~忙しくて~~` が `<del>` になる |

いずれも打ち消し線を意図した記述なので、修正が著者の意図に沿うと判断しました。

テーブル・display math・公開キーの異常系は、修正すると挙動が変わりますが、
現在の記事では使われていないため見た目には影響しません。

## 技術的な選択

| 項目 | 選択 | 理由 |
| --- | --- | --- |
| モジュール形式 | ESM 専用 | unified が ESM 専用 |
| Node.js | 24 以上 | |
| TypeScript | 6.0 系 | 下記参照 |
| ビルド | `tsc` のみ | バンドル不要のライブラリなので依存を増やさない |
| パッケージ検査 | `publint` + `arethetypeswrong` | ESM 専用・サブパス exports・型定義の組み合わせは壊れやすい |
| 公開先 | npm 公開レジストリ | スコープ付きなので `publishConfig.access` を `public` に |

### TypeScript のバージョンについて

TypeScript 7.0 は Go 移植版で、`typescript-eslint` がまだ対応していません
（[typescript-eslint#10940]）。7.0 では lint が実行時に明示的に拒否されるため、
JS 実装系の最新である 6.0 系を採っています。
`typescript-eslint` が 7 系に対応したら追随してください。

[typescript-eslint#10940]: https://github.com/typescript-eslint/typescript-eslint/issues/10940

## テストについて

このパッケージにはまだテストがありません。書くときは、元実装との
出力比較を軸にするのが最も効果的です。詳細は切り出し時のプルリクエストに
方針を残してあります。

要点として、単純な「全ケース一致」は成立しません。上に挙げたとおり、
元実装は一部のケースで壊れた出力を出すか例外を投げるためです。
一致させるケースと、意図的に差分が出るケースを分けて書く必要があります。
