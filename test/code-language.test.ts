// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import { describe, expect, it } from "vitest";
import remarkMath from "remark-math";

import { remarkNonaCodeLanguage } from "../src/index.js";
import { renderWith } from "./helpers.js";

const render = renderWith([remarkNonaCodeLanguage]);
const renderWithMath = renderWith([remarkMath, remarkNonaCodeLanguage]);

describe("言語属性", () => {
  it("言語付きフェンスに `data-lang` が付く", () => {
    expect(render("```js\nlet a = 1;\n```")).toBe(
      '<pre><code class="language-js" data-lang="language-js">let a = 1;\n</code></pre>',
    );
  });

  // 一見バグに見えるが、これは意図した挙動。nonasaba.net の MDX `code`
  // コンポーネントは `data-lang` の「有無」でブロックコードとインライン
  // コードを判別しており、ハイライタは `null` という言語名を読み飛ばす。
  // 属性を出すのをやめると言語指定のないフェンスがすべてインラインコード
  // 扱いになるため、既定では出す。
  it("言語なしフェンスは `language-null` になる", () => {
    expect(render("```\nplain\n```")).toBe(
      '<pre><code data-lang="language-null">plain\n</code></pre>',
    );
  });

  it("インラインコードには付かない", () => {
    expect(render("これは `inline` です")).toBe(
      "<p>これは <code>inline</code> です</p>",
    );
  });

  it("インライン数式には付く", () => {
    expect(renderWithMath("foo $x^2$ bar")).toBe(
      '<p>foo <code class="language-math math-inline" data-lang="language-math">x^2</code> bar</p>',
    );
  });

  // display math にはクラス名が付かないため、属性も付かない。
  // ここで落ちないことが重要（クラス名の配列を無検証に読むと例外になる）。
  it("ディスプレイ数式では属性が付かず、例外にもならない", () => {
    expect(renderWithMath("$$\nx^2\n$$")).toBe(
      '<pre><code class="language-math math-display">x^2</code></pre>',
    );
  });

  describe("オプション", () => {
    it("`emitForMissingLang: false` で言語なしフェンスには付かなくなる", () => {
      const renderStrict = renderWith([
        [remarkNonaCodeLanguage, { emitForMissingLang: false }],
      ]);

      expect(renderStrict("```\nplain\n```")).toBe(
        "<pre><code>plain\n</code></pre>",
      );
      // 言語付きは従来どおり。
      expect(renderStrict("```js\nlet a = 1;\n```")).toBe(
        '<pre><code class="language-js" data-lang="language-js">let a = 1;\n</code></pre>',
      );
    });

    it("`attribute` で属性名を変えられる", () => {
      const renderCustom = renderWith([
        [remarkNonaCodeLanguage, { attribute: "data-language" }],
      ]);

      expect(renderCustom("```js\nlet a = 1;\n```")).toBe(
        '<pre><code class="language-js" data-language="language-js">let a = 1;\n</code></pre>',
      );
    });

    it("`prefix` で接頭辞を変えられる", () => {
      const renderCustom = renderWith([
        [remarkNonaCodeLanguage, { prefix: "lang-" }],
      ]);

      expect(renderCustom("```js\nlet a = 1;\n```")).toBe(
        '<pre><code class="language-js" data-lang="lang-js">let a = 1;\n</code></pre>',
      );
    });

    it("`types` で対象ノードを絞れる", () => {
      const renderCodeOnly = renderWith([
        [remarkNonaCodeLanguage, { types: [] }],
      ]);

      expect(renderCodeOnly("```js\nlet a = 1;\n```")).toBe(
        '<pre><code class="language-js">let a = 1;\n</code></pre>',
      );
    });
  });
});
