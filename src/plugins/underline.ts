// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import type { Root } from "mdast";
import type { Plugin } from "unified";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";

export interface UnderlineOptions {
  /**
   * Element name emitted for the underline marker.
   *
   * @default "u"
   */
  tagName?: string;
  /**
   * Source marker that selects underline instead of strong emphasis.
   *
   * @default "__"
   */
  marker?: string;
}

/**
 * Discord-flavoured underline: `__text__` becomes `<u>`, while `**text**`
 * stays `<strong>`.
 *
 * CommonMark parses both spellings into the same `strong` node, so the only
 * way to tell them apart is to look back at the source text. The marker is
 * read from the `strong` node's own start offset rather than its first
 * child's, so nesting (`___both___`, `**a __b__ c**`) cannot shift it.
 */
export const remarkNonaUnderline: Plugin<[UnderlineOptions?], Root> = (
  options,
) => {
  const tagName = options?.tagName ?? "u";
  const marker = options?.marker ?? "__";

  return (tree: Root, file: VFile) => {
    const source = String(file);

    visit(tree, "strong", (node) => {
      const offset = node.position?.start.offset;
      if (offset === undefined) return;
      if (source.slice(offset, offset + marker.length) !== marker) return;

      node.data = { ...node.data, hName: tagName };
    });
  };
};
