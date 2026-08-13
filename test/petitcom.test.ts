// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import { describe, expect, it } from "vitest";

import { nonaMarkPreset } from "../src/index.js";
import { remarkPetitcomKey } from "../src/petitcom/index.js";
import { renderWith } from "./helpers.js";

const render = renderWith([remarkPetitcomKey]);

describe("プチコン公開キー", () => {
  it("`(ラベル) キー` の形を専用要素にする", () => {
    expect(render("> **Key:**(プチコン 4 公開キー) 4N443KXX3")).toBe(
      '<petitcom-public-key class="petitcom-key">' +
        '<span class="key-target">プチコン 4 公開キー</span>' +
        '<span class="key"> 4N443KXX3</span>' +
        "</petitcom-public-key>",
    );
  });

  it("キー側の先頭の空白はそのまま残る", () => {
    // 閉じ括弧の直後の半角空白はキーの text ノードに含まれるため残る。
    // 見た目には出ないが出力には現れる。
    expect(render("> **Key:**(ラベル) ABC123")).toContain(
      '<span class="key"> ABC123</span>',
    );
  });

  describe("公開キーにならないもの", () => {
    it("括弧がなければそのまま", () => {
      // 書式が合わないときは例外にせず、ふつうの引用として残す。
      expect(render("> **Key:** 4N443KXX3")).toBe(
        "<blockquote>\n<p><strong>Key:</strong> 4N443KXX3</p>\n</blockquote>",
      );
    });

    it("マーカーだけで本文がなければそのまま", () => {
      expect(render("> **Key:**")).toBe(
        "<blockquote>\n<p><strong>Key:</strong></p>\n</blockquote>",
      );
    });

    it("知らないマーカーはそのまま", () => {
      expect(render("> **Note:**(ラベル) 値")).toBe(
        "<blockquote>\n<p><strong>Note:</strong>(ラベル) 値</p>\n</blockquote>",
      );
    });
  });

  it("プリセットには含まれない", () => {
    // ドメイン固有の機能なので、`./petitcom` から明示的に読み込ませる。
    const renderPreset = renderWith(nonaMarkPreset());

    expect(renderPreset("> **Key:**(ラベル) ABC123")).toBe(
      "<blockquote>\n<p><strong>Key:</strong>(ラベル) ABC123</p>\n</blockquote>",
    );
  });

  describe("オプション", () => {
    it("`marker` でマーカーを変えられる", () => {
      const renderCustom = renderWith([
        [remarkPetitcomKey, { marker: "公開キー:" }],
      ]);

      expect(renderCustom("> **公開キー:**(ラベル) ABC123")).toContain(
        "<petitcom-public-key",
      );
    });

    it("要素名とクラス名を変えられる", () => {
      const renderCustom = renderWith([
        [
          remarkPetitcomKey,
          {
            hName: "public-key",
            className: ["pk"],
            targetClassName: "pk-label",
            keyClassName: "pk-value",
          },
        ],
      ]);

      expect(renderCustom("> **Key:**(ラベル) ABC123")).toBe(
        '<public-key class="pk">' +
          '<span class="pk-label">ラベル</span>' +
          '<span class="pk-value"> ABC123</span>' +
          "</public-key>",
      );
    });
  });
});
