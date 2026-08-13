# nona-mark

A less strict markup language. Markdown dialect of Nona powered by remark.

nona-mark は Markdown 方言（dialect）の**仕様**であり、現在の実装は
[unified] / [remark] プラグインの詰め合わせです。素の Markdown に、
下線・MDN 風 callout・言語属性の 3 つを足したものだと考えてください。

もともと [nonasaba.net] のリポジトリに直置きされていた remark プラグインを、
他のプロジェクトからも使えるように切り出したものです。

[unified]: https://unifiedjs.com/
[remark]: https://remark.js.org/
[nonasaba.net]: https://nonasaba.net

## インストール

```sh
npm install @nona-takahara/nona-mark
```

ESM 専用です。Node.js 24 以上を想定しています。

## 使い方

### Astro

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { nonaMarkPreset } from '@nona-takahara/nona-mark';

export default defineConfig({
  markdown: {
    remarkPlugins: [...nonaMarkPreset()],
  },
});
```

`nonaMarkPreset()` はプラグインの**配列**を返すので、そのまま展開できます。
unified の preset オブジェクト（`{ plugins: [...] }`）ではありません
— Astro の `remarkPlugins` はそれを受け付けないためです。

> **注意**: `nonaMarkPreset` は「呼ぶ」ファクトリですが、
> 個別のプラグインは remark の作法どおり**呼ばずに**渡します。
> `[remarkNonaUnderline]` は正しく、`[remarkNonaUnderline()]` は誤りです。
> オプションを渡すときは `[[remarkNonaUnderline, { tagName: 'ins' }]]` の形にします。

### 素の unified

```js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { nonaMarkPreset } from '@nona-takahara/nona-mark';

const processor = unified()
  .use(remarkParse)
  .use(nonaMarkPreset())
  .use(remarkRehype)
  .use(rehypeStringify);
```

### プラグインを個別に使う

```js
import { remarkNonaUnderline, remarkNonaCallout } from '@nona-takahara/nona-mark';
```

## 記法

### 下線

Discord 風に、`__` は下線、`**` は強調になります。CommonMark はどちらも
同じ `strong` ノードに落とすため、ソース上のマーカーを見て区別しています。

```markdown
__下線__ と **強調**
```

```html
<u>下線</u> と <strong>強調</strong>
```

### Callout

blockquote の先頭を `**マーカー**` で始めると callout になります。

```markdown
> **Callout:** 補足です
> **Note:** 覚えておくとよいこと
> **Warning:** 注意
```

```html
<mdn-callout class="callout" data-variant="callout"><p> 補足です</p></mdn-callout>
<mdn-callout class="callout note" data-variant="note"><p><strong>メモ：</strong> 覚えておくとよいこと</p></mdn-callout>
<mdn-callout class="callout warning" data-variant="warning"><p><strong>警告：</strong> 注意</p></mdn-callout>
```

`Callout:` はマーカーごと消え、`Note:` / `Warning:` はマーカーが日本語ラベルに
置き換わって太字のまま残ります。この非対称は元実装からの仕様です。

要素名・クラス名・ラベルはすべてオプションで変更できます。

### コード・数式の言語属性

コードブロックと数式に `data-lang` 属性が付きます。
クラス名を解析しなくてもコンポーネント側で言語を読めます。

````markdown
```js
let a = 1;
```
````

```html
<pre><code class="language-js" data-lang="language-js">let a = 1;</code></pre>
```

### GFM のサブセット

打ち消し線（`~~text~~`）とテーブルのみ有効です。
autolink literal・脚注・タスクリストは意図的に含めていません。

## API

### `nonaMarkPreset(options?)`

方言一式を `PluggableList` として返します。
`remark-math` を含むのは、`remarkNonaCodeLanguage` が数式ノードに付いた
クラス名を読むため、**必ず `remark-math` より後に走る必要がある**からです。
順序事故を避けるため、順序はプリセット内で固定しています。

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `gfm` | `{}` | `false` で GFM サブセットを外す |
| `math` | `true` | `false` で `remark-math` を外す |
| `underline` | `{}` | `false` で下線を外す |
| `callout` | `{}` | `false` で callout を外す |
| `codeLanguage` | `{}` | `false` で言語属性を外す |

### `remarkNonaUnderline(options?)`

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `tagName` | `"u"` | 出力する要素名 |
| `marker` | `"__"` | 下線と判定するソース上のマーカー |

### `remarkNonaCallout(options?)`

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `hName` | `"mdn-callout"` | 既定の要素名 |
| `variants` | `defaultCalloutVariants` | マーカー文字列 → バリアント定義 |
| `nodeType` | `"columnbox"` | 書き換え後の mdast ノード型 |

`variants` は既定を**置き換え**ます。追加したいときは展開してください。

```js
import { remarkNonaCallout, defaultCalloutVariants } from '@nona-takahara/nona-mark';

const plugins = [[remarkNonaCallout, {
  variants: {
    ...defaultCalloutVariants,
    'Tip:': { className: ['callout', 'tip'], dataVariant: 'tip', label: 'ヒント：' },
  },
}]];
```

バリアント定義で `label` を省略するとマーカーごと削除され、
指定するとマーカーがそのテキストに置き換わります。

### `remarkNonaCodeLanguage(options?)`

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `attribute` | `"data-lang"` | 言語を入れる属性名 |
| `prefix` | `"language-"` | 言語クラス名の接頭辞 |
| `emitForMissingLang` | `true` | 言語指定なしのフェンスにも属性を出す |
| `types` | `["code", "inlineCode", "math", "inlineMath"]` | 対象ノード型 |

`emitForMissingLang` が `true` のとき、言語指定のないフェンスは
`data-lang="language-null"` になります。不自然に見えますが、
nonasaba.net は**属性の有無**でブロックコードとインラインコードを判別し、
ハイライタ側で `null` を明示的に読み飛ばしているため、この挙動に依存しています。
その規約を使っていないプロジェクトでのみ `false` にしてください。

### `remarkNonaGfm(options?)`

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `strikethrough` | `true` | `~~打ち消し線~~` |
| `singleTilde` | remark 既定 | チルダ 1 つでも打ち消し線にするか |
| `table` | `true` | GFM テーブル |
| `tableToMarkdown` | — | `gfmTableToMarkdown` に渡す整形オプション |

### `remarkPetitcomKey(options?)`

プチコンの公開キー表示です。nonasaba.net 固有の機能なので
プリセットには含めず、サブパスから個別に読み込みます。

```js
import { remarkPetitcomKey } from '@nona-takahara/nona-mark/petitcom';
```

```markdown
> **Key:**(プチコン 4 公開キー) 4N443KXX3
```

```html
<petitcom-public-key class="petitcom-key"><span class="key-target">プチコン 4 公開キー</span><span class="key"> 4N443KXX3</span></petitcom-public-key>
```

| オプション | 既定値 |
| --- | --- |
| `marker` | `"Key:"` |
| `hName` | `"petitcom-public-key"` |
| `className` | `["petitcom-key"]` |
| `targetClassName` | `"key-target"` |
| `keyClassName` | `"key"` |
| `nodeType` | `"columnbox"` |

## 出力する要素について

callout と公開キーは `mdn-callout` / `petitcom-public-key` という
独自要素名で出力されます。MDX を使うなら、コンポーネントを割り当ててください。

```jsx
const components = {
  'mdn-callout': Callout,
  'petitcom-public-key': PetitcomPublicKey,
};
```

## ライセンス

[MIT](LICENSE)

`src/plugins/gfm.ts` は [remark-gfm] の派生であり、
Copyright (c) 2020 Titus Wormer, MIT License に基づきます。

[remark-gfm]: https://github.com/remarkjs/remark-gfm
