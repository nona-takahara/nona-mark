// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) 2020 Titus Wormer <tituswormer@gmail.com>
//
// This file is based on remark-gfm provided under The MIT License.
// It enables only the subset of GFM that the Nona dialect uses
// (strikethrough and tables); autolink literals, footnotes and task lists
// are deliberately left out.

import type { Root } from "mdast";
import type { Plugin } from "unified";

import { combineExtensions } from "micromark-util-combine-extensions";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmTable } from "micromark-extension-gfm-table";
import {
  gfmStrikethroughFromMarkdown,
  gfmStrikethroughToMarkdown,
} from "mdast-util-gfm-strikethrough";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";

/** Serialization options accepted by `gfmTableToMarkdown`. */
export type TableToMarkdownOptions = NonNullable<
  Parameters<typeof gfmTableToMarkdown>[0]
>;

export interface NonaGfmOptions {
  /**
   * Support `~~strikethrough~~`.
   *
   * @default true
   */
  strikethrough?: boolean;
  /**
   * Whether a single tilde (`~text~`) also produces strikethrough.
   * Forwarded to `micromark-extension-gfm-strikethrough`.
   */
  singleTilde?: boolean;
  /**
   * Support GFM tables.
   *
   * @default true
   */
  table?: boolean;
  /** Options forwarded to `gfmTableToMarkdown` (serialization only). */
  tableToMarkdown?: TableToMarkdownOptions;
}

/**
 * Enable the GFM subset used by the Nona dialect.
 *
 * Note for anyone porting the old `nonagfm.mjs`: every extension below has to
 * be **called**. `micromark-extension-gfm-table`, `mdast-util-gfm-table` and
 * `mdast-util-gfm-strikethrough` switched from object exports to function
 * exports in their v2 releases. Passing the bare function instead of its
 * result silently does nothing — functions carry no enumerable properties, so
 * the extension merge loops find nothing to merge and neither tables nor
 * strikethrough ever work.
 */
export const remarkNonaGfm: Plugin<[NonaGfmOptions?], Root> = function (
  options,
) {
  const settings = options ?? {};
  const strikethrough = settings.strikethrough ?? true;
  const table = settings.table ?? true;

  const data = this.data();

  const micromarkExtensions = (data.micromarkExtensions ??= []);
  const fromMarkdownExtensions = (data.fromMarkdownExtensions ??= []);
  const toMarkdownExtensions = (data.toMarkdownExtensions ??= []);

  const syntax = [];
  const fromMarkdown = [];
  const toMarkdown = [];

  if (strikethrough) {
    syntax.push(
      gfmStrikethrough(
        settings.singleTilde === undefined
          ? undefined
          : { singleTilde: settings.singleTilde },
      ),
    );
    fromMarkdown.push(gfmStrikethroughFromMarkdown());
    toMarkdown.push(gfmStrikethroughToMarkdown());
  }

  if (table) {
    syntax.push(gfmTable());
    fromMarkdown.push(gfmTableFromMarkdown());
    toMarkdown.push(gfmTableToMarkdown(settings.tableToMarkdown));
  }

  if (syntax.length === 0) return;

  micromarkExtensions.push(combineExtensions(syntax));
  fromMarkdownExtensions.push(fromMarkdown);
  toMarkdownExtensions.push({ extensions: toMarkdown });
};
