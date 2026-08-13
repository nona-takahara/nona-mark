// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import { describe, expect, it } from "vitest";

import { nonaMarkPreset } from "../src/index.js";
import { remarkPetitcomKey } from "../src/petitcom/index.js";
import { renderWith } from "./helpers.js";

const render = renderWith(nonaMarkPreset());

describe("プリセット", () => {
  it("方言一式がまとめて有効になる", () => {
    const input = [
      "__下線__ と **強調**",
      "",
      "> **Note:** 覚えておくとよいこと",
      "",
      "~~削除~~ テキスト",
      "",
      "```js",
      "let a = 1;",
      "```",
    ].join("\n");

    expect(render(input)).toBe(
      [
        "<p><u>下線</u> と <strong>強調</strong></p>",
        '<mdn-callout class="callout note" data-variant="note"><p><strong>メモ：</strong> 覚えておくとよいこと</p></mdn-callout>',
        "<p><del>削除</del> テキスト</p>",
        '<pre><code class="language-js" data-lang="language-js">let a = 1;\n</code></pre>',
      ].join("\n"),
    );
  });

  // 言語属性の付与は数式ノードのクラス名を読むため、`remark-math` より
  // 後に走る必要がある。この順序をプリセットが保証していることの仕様。
  it("数式に言語属性が付く（`remark-math` との順序が保たれている）", () => {
    expect(render("foo $x^2$ bar")).toBe(
      '<p>foo <code class="language-math math-inline" data-lang="language-math">x^2</code> bar</p>',
    );
  });

  it("プラグインの配列を返すので展開して使える", () => {
    const plugins = nonaMarkPreset();

    expect(Array.isArray(plugins)).toBe(true);
    // gfm・math・下線・callout・言語属性の 5 つ。
    expect(plugins).toHaveLength(5);
  });

  it("公開キーを足すとプリセットと併用できる", () => {
    const renderWithKey = renderWith([
      ...nonaMarkPreset(),
      remarkPetitcomKey,
    ]);

    expect(renderWithKey("> **Key:**(ラベル) ABC123")).toBe(
      '<petitcom-public-key class="petitcom-key">' +
        '<span class="key-target">ラベル</span>' +
        '<span class="key"> ABC123</span>' +
        "</petitcom-public-key>",
    );
  });

  describe("個別に外す", () => {
    it("`gfm: false`", () => {
      const r = renderWith(nonaMarkPreset({ gfm: false }));

      expect(r("~~削除~~")).toBe("<p>~~削除~~</p>");
      expect(r("__下線__")).toBe("<p><u>下線</u></p>");
    });

    it("`math: false`", () => {
      const r = renderWith(nonaMarkPreset({ math: false }));

      expect(r("foo $x^2$ bar")).toBe("<p>foo $x^2$ bar</p>");
    });

    it("`underline: false`", () => {
      const r = renderWith(nonaMarkPreset({ underline: false }));

      expect(r("__下線__")).toBe("<p><strong>下線</strong></p>");
    });

    it("`callout: false`", () => {
      const r = renderWith(nonaMarkPreset({ callout: false }));

      expect(r("> **Note:** 本文")).toBe(
        "<blockquote>\n<p><strong>Note:</strong> 本文</p>\n</blockquote>",
      );
    });

    it("`codeLanguage: false`", () => {
      const r = renderWith(nonaMarkPreset({ codeLanguage: false }));

      expect(r("```js\nlet a = 1;\n```")).toBe(
        '<pre><code class="language-js">let a = 1;\n</code></pre>',
      );
    });
  });

  describe("個別に設定する", () => {
    it("各プラグインへオプションを渡せる", () => {
      const r = renderWith(
        nonaMarkPreset({
          underline: { tagName: "ins" },
          codeLanguage: { emitForMissingLang: false },
        }),
      );

      expect(r("__下線__")).toBe("<p><ins>下線</ins></p>");
      expect(r("```\nplain\n```")).toBe("<pre><code>plain\n</code></pre>");
    });
  });
});
