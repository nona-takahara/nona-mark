// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import { describe, expect, it } from "vitest";

import { defaultCalloutVariants, remarkNonaCallout } from "../src/index.js";
import { renderWith } from "./helpers.js";

const render = renderWith([remarkNonaCallout]);

describe("callout", () => {
  // `Callout:` はマーカーごと消え、`Note:` / `Warning:` はマーカーが
  // 日本語ラベルに置き換わって太字のまま残る。この非対称は仕様。
  it("`Callout:` はマーカーごと消える", () => {
    expect(render("> **Callout:** 補足です")).toBe(
      '<mdn-callout class="callout" data-variant="callout"><p> 補足です</p></mdn-callout>',
    );
  });

  it("`Note:` はマーカーが「メモ：」に置き換わり太字のまま残る", () => {
    expect(render("> **Note:** 覚えておくとよいこと")).toBe(
      '<mdn-callout class="callout note" data-variant="note"><p><strong>メモ：</strong> 覚えておくとよいこと</p></mdn-callout>',
    );
  });

  it("`Warning:` はマーカーが「警告：」に置き換わり太字のまま残る", () => {
    expect(render("> **Warning:** 注意")).toBe(
      '<mdn-callout class="callout warning" data-variant="warning"><p><strong>警告：</strong> 注意</p></mdn-callout>',
    );
  });

  it("マーカーを消したあとの空白はそのまま残る", () => {
    // `Callout:` の直後の半角空白は本文側の text ノードに属するため、
    // マーカーを削除しても残る。見た目には出ないが出力には現れる。
    expect(render("> **Callout:** 本文")).toContain("<p> 本文</p>");
  });

  it("複数段落を含められる", () => {
    // callout は mdast の標準ノードではないため、子要素のあいだに
    // 改行が入らない。ふつうの引用（下記）とは整形が異なる。
    expect(render("> **Note:** 一段落目\n>\n> 二段落目")).toBe(
      '<mdn-callout class="callout note" data-variant="note"><p><strong>メモ：</strong> 一段落目</p><p>二段落目</p></mdn-callout>',
    );
  });

  describe("callout にならないもの", () => {
    it("マーカーのない引用はそのまま", () => {
      expect(render("> ふつうの引用")).toBe(
        "<blockquote>\n<p>ふつうの引用</p>\n</blockquote>",
      );
    });

    it("知らないマーカーはそのまま", () => {
      expect(render("> **Hint:** 未定義のマーカー")).toBe(
        "<blockquote>\n<p><strong>Hint:</strong> 未定義のマーカー</p>\n</blockquote>",
      );
    });

    // マーカーが text ノードのときだけ callout として扱う。
    // そうしないとラベルの置換先が `code` などになり、
    // `<strong><code>メモ：</code></strong>` のような出力になってしまう。
    it("マーカーがインラインコードならそのまま", () => {
      expect(render("> **`Note:`** 本文")).toBe(
        "<blockquote>\n<p><strong><code>Note:</code></strong> 本文</p>\n</blockquote>",
      );
    });

    it("マーカーが太字でなければそのまま", () => {
      expect(render("> Note: 本文")).toBe(
        "<blockquote>\n<p>Note: 本文</p>\n</blockquote>",
      );
    });

    it("引用の先頭が段落でなければそのまま", () => {
      expect(render("> # **Note:** 見出し")).toBe(
        '<blockquote>\n<h1><strong>Note:</strong> 見出し</h1>\n</blockquote>',
      );
    });
  });

  describe("オプション", () => {
    it("`hName` で既定の要素名を変えられる", () => {
      const renderAside = renderWith([
        [remarkNonaCallout, { hName: "my-callout" }],
      ]);

      expect(renderAside("> **Note:** 本文")).toBe(
        '<my-callout class="callout note" data-variant="note"><p><strong>メモ：</strong> 本文</p></my-callout>',
      );
    });

    it("`variants` は既定を置き換える", () => {
      const renderOnlyTip = renderWith([
        [
          remarkNonaCallout,
          {
            variants: {
              "Tip:": { className: ["tip"], dataVariant: "tip", label: "ヒント：" },
            },
          },
        ],
      ]);

      expect(renderOnlyTip("> **Tip:** 助言")).toBe(
        '<mdn-callout class="tip" data-variant="tip"><p><strong>ヒント：</strong> 助言</p></mdn-callout>',
      );
      // 既定は置き換えられているので `Note:` はもう callout にならない。
      expect(renderOnlyTip("> **Note:** 本文")).toBe(
        "<blockquote>\n<p><strong>Note:</strong> 本文</p>\n</blockquote>",
      );
    });

    it("`defaultCalloutVariants` を展開すれば既定に追加できる", () => {
      const renderExtended = renderWith([
        [
          remarkNonaCallout,
          {
            variants: {
              ...defaultCalloutVariants,
              "Tip:": { className: ["tip"], dataVariant: "tip", label: "ヒント：" },
            },
          },
        ],
      ]);

      expect(renderExtended("> **Tip:** 助言")).toContain('data-variant="tip"');
      expect(renderExtended("> **Note:** 本文")).toContain('data-variant="note"');
    });

    it("バリアントの `label` を省略するとマーカーごと消える", () => {
      const renderStrip = renderWith([
        [remarkNonaCallout, { variants: { "Aside:": { className: ["aside"] } } }],
      ]);

      expect(renderStrip("> **Aside:** 余談")).toBe(
        '<mdn-callout class="aside"><p> 余談</p></mdn-callout>',
      );
    });

    it("バリアント個別に `hName` を指定できる", () => {
      const renderPerVariant = renderWith([
        [
          remarkNonaCallout,
          { variants: { "Box:": { hName: "my-box", className: ["box"] } } },
        ],
      ]);

      expect(renderPerVariant("> **Box:** 中身")).toBe(
        '<my-box class="box"><p> 中身</p></my-box>',
      );
    });
  });
});
