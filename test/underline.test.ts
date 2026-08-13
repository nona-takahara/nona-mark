// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import { describe, expect, it } from "vitest";

import { remarkNonaUnderline } from "../src/index.js";
import { renderWith } from "./helpers.js";

const render = renderWith([remarkNonaUnderline]);

describe("下線", () => {
  it("`__` で囲むと下線になる", () => {
    expect(render("__下線__")).toBe("<p><u>下線</u></p>");
  });

  it("`**` で囲むと従来どおり強調になる", () => {
    expect(render("**強調**")).toBe("<p><strong>強調</strong></p>");
  });

  it("同じ段落に両方あってもそれぞれ区別される", () => {
    expect(render("__下線__ と **強調**")).toBe(
      "<p><u>下線</u> と <strong>強調</strong></p>",
    );
  });

  // CommonMark は `__x__` と `**x**` を同じ strong ノードに落とすため、
  // 区別できるのはソース上のマーカーだけ。以下 2 件は、入れ子があっても
  // マーカーの位置を取り違えないことの仕様。
  it("`___x___` は強調の内側が下線になる", () => {
    expect(render("___両方___")).toBe("<p><em><u>両方</u></em></p>");
  });

  it("強調の中に下線を入れられる", () => {
    expect(render("**外 __内__ 側**")).toBe(
      "<p><strong>外 <u>内</u> 側</strong></p>",
    );
  });

  describe("オプション", () => {
    it("`tagName` で出力する要素を変えられる", () => {
      const renderIns = renderWith([[remarkNonaUnderline, { tagName: "ins" }]]);

      expect(renderIns("__下線__")).toBe("<p><ins>下線</ins></p>");
    });

    it("`marker` で下線と判定するマーカーを入れ替えられる", () => {
      const renderSwapped = renderWith([
        [remarkNonaUnderline, { marker: "**" }],
      ]);

      expect(renderSwapped("**これが下線**")).toBe("<p><u>これが下線</u></p>");
      expect(renderSwapped("__これが強調__")).toBe(
        "<p><strong>これが強調</strong></p>",
      );
    });
  });
});
