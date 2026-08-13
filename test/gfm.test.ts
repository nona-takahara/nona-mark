// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import { describe, expect, it } from "vitest";

import { remarkNonaGfm } from "../src/index.js";
import { renderWith } from "./helpers.js";

const render = renderWith([remarkNonaGfm]);

describe("GFM のサブセット", () => {
  it("`~~` で打ち消し線になる", () => {
    expect(render("~~削除~~ テキスト")).toBe(
      "<p><del>削除</del> テキスト</p>",
    );
  });

  it("テーブルが使える", () => {
    expect(render("| a | b |\n| - | - |\n| 1 | 2 |")).toBe(
      [
        "<table>",
        "<thead>",
        "<tr>",
        "<th>a</th>",
        "<th>b</th>",
        "</tr>",
        "</thead>",
        "<tbody>",
        "<tr>",
        "<td>1</td>",
        "<td>2</td>",
        "</tr>",
        "</tbody>",
        "</table>",
      ].join("\n"),
    );
  });

  it("テーブルの寄せ指定が反映される", () => {
    expect(render("| a | b |\n| :- | -: |\n| 1 | 2 |")).toContain(
      '<th align="left">a</th>',
    );
  });

  // ここから下は「有効にしていない」ことの仕様。GFM のうち方言が
  // 採用しているのは打ち消し線とテーブルだけで、残りは意図的に外している。
  describe("有効にしていない GFM 機能", () => {
    it("裸の URL は自動リンクにならない", () => {
      expect(render("https://example.com")).toBe("<p>https://example.com</p>");
    });

    it("タスクリストはチェックボックスにならない", () => {
      expect(render("- [ ] やること")).toBe(
        "<ul>\n<li>[ ] やること</li>\n</ul>",
      );
    });

    it("脚注記法は脚注にならない", () => {
      expect(render("本文[^1]")).toBe("<p>本文[^1]</p>");
    });

    it("脚注の定義を書くと CommonMark の参照リンクとして解釈される", () => {
      // `[^1]: 注釈` はラベル `^1`・リンク先 `注釈` の参照リンク定義として
      // 読まれ、`[^1]` がその参照になる。脚注のつもりで書くと想定外の
      // リンクができるので注意。
      expect(render("本文[^1]\n\n[^1]: 注釈")).toBe(
        '<p>本文<a href="%E6%B3%A8%E9%87%88">^1</a></p>',
      );
    });
  });

  describe("オプション", () => {
    it("`strikethrough: false` で打ち消し線を外せる", () => {
      const renderNoStrike = renderWith([
        [remarkNonaGfm, { strikethrough: false }],
      ]);

      expect(renderNoStrike("~~削除~~ テキスト")).toBe(
        "<p>~~削除~~ テキスト</p>",
      );
    });

    it("`table: false` でテーブルを外せる", () => {
      const renderNoTable = renderWith([[remarkNonaGfm, { table: false }]]);

      expect(renderNoTable("| a | b |\n| - | - |\n| 1 | 2 |")).toBe(
        "<p>| a | b |\n| - | - |\n| 1 | 2 |</p>",
      );
    });

    it("`singleTilde: false` でチルダ 1 つを打ち消し線にしない", () => {
      const renderStrict = renderWith([
        [remarkNonaGfm, { singleTilde: false }],
      ]);

      expect(renderStrict("~削除~ テキスト")).toBe("<p>~削除~ テキスト</p>");
      expect(renderStrict("~~削除~~ テキスト")).toBe(
        "<p><del>削除</del> テキスト</p>",
      );
    });

    it("既定ではチルダ 1 つでも打ち消し線になる", () => {
      expect(render("~削除~ テキスト")).toBe("<p><del>削除</del> テキスト</p>");
    });

    it("両方 false なら何も登録しない", () => {
      const renderNone = renderWith([
        [remarkNonaGfm, { strikethrough: false, table: false }],
      ]);

      expect(renderNone("~~削除~~")).toBe("<p>~~削除~~</p>");
      expect(renderNone("| a |\n| - |\n| 1 |")).toBe("<p>| a |\n| - |\n| 1 |</p>");
    });
  });
});
