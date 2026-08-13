// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import type { PluggableList } from "unified";
import remarkMath from "remark-math";

import { remarkNonaGfm, type NonaGfmOptions } from "./plugins/gfm.js";
import { remarkNonaUnderline, type UnderlineOptions } from "./plugins/underline.js";
import { remarkNonaCallout, type CalloutOptions } from "./plugins/callout.js";
import {
  remarkNonaCodeLanguage,
  type CodeLanguageOptions,
} from "./plugins/code-language.js";

export interface NonaMarkPresetOptions {
  /** GFM subset (strikethrough, tables). Pass `false` to drop it. */
  gfm?: NonaGfmOptions | false;
  /**
   * `remark-math` for `$inline$` and `$$display$$`.
   *
   * Kept inside the preset because {@link remarkNonaCodeLanguage} annotates
   * math nodes and therefore has to run after it.
   *
   * @default true
   */
  math?: boolean;
  /** `__underline__`. Pass `false` to drop it. */
  underline?: UnderlineOptions | false;
  /** `> **Note:** …` callouts. Pass `false` to drop them. */
  callout?: CalloutOptions | false;
  /** `data-lang` annotation. Pass `false` to drop it. */
  codeLanguage?: CodeLanguageOptions | false;
}

/**
 * The Nona dialect as a ready-made plugin list.
 *
 * The order matters — `remarkNonaCodeLanguage` reads class names that
 * `remark-math` produces — so the list is assembled here rather than left to
 * the caller.
 *
 * ```js
 * import { nonaMarkPreset } from "@nona-takahara/nona-mark";
 *
 * markdown: { remarkPlugins: [...nonaMarkPreset()] }
 * ```
 *
 * The result is a plain array so it can be spread straight into Astro's
 * `remarkPlugins`, which does not accept unified preset objects.
 */
export function nonaMarkPreset(
  options: NonaMarkPresetOptions = {},
): PluggableList {
  const plugins: PluggableList = [];

  if (options.gfm !== false) {
    plugins.push([remarkNonaGfm, options.gfm ?? {}]);
  }

  if (options.math !== false) {
    plugins.push(remarkMath);
  }

  if (options.underline !== false) {
    plugins.push([remarkNonaUnderline, options.underline ?? {}]);
  }

  if (options.callout !== false) {
    plugins.push([remarkNonaCallout, options.callout ?? {}]);
  }

  if (options.codeLanguage !== false) {
    plugins.push([remarkNonaCodeLanguage, options.codeLanguage ?? {}]);
  }

  return plugins;
}
