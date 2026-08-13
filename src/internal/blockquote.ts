// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import type { Blockquote, Data, Paragraph, Strong, Text } from "mdast";
import { is } from "unist-util-is";

export interface MarkedBlockquote {
  /** First paragraph of the blockquote. */
  paragraph: Paragraph;
  /** Leading `strong` node that carries the marker. */
  strong: Strong;
  /** Text node inside the `strong`, e.g. `Note:`. */
  markerNode: Text;
  /** Marker text, e.g. `"Note:"`. */
  marker: string;
}

/**
 * Match `> **Marker:** body` and return its parts.
 *
 * The marker must be a plain `text` node. Anything else (`> **`Note:`**`)
 * is left alone rather than rewritten into a callout with a stray element
 * inside its label.
 */
export function matchMarkedBlockquote(
  node: Blockquote,
): MarkedBlockquote | undefined {
  const paragraph = node.children[0];
  if (!is(paragraph, "paragraph")) return undefined;

  const strong = paragraph.children[0];
  if (!is(strong, "strong")) return undefined;

  const markerNode = strong.children[0];
  if (!is(markerNode, "text")) return undefined;

  return { paragraph, strong, markerNode, marker: markerNode.value };
}

/**
 * Rewrite a blockquote into the dialect's non-standard `columnbox` node.
 *
 * `columnbox` is not part of mdast. `mdast-util-to-hast` falls back to its
 * unknown-node handler, which honours `data.hName` / `data.hProperties` /
 * `data.hChildren`, so the node still serializes to the intended element.
 */
export function retypeAsColumnBox(
  node: Blockquote,
  nodeType: string,
  data: Data,
): void {
  const mutable = node as unknown as { type: string; data: Data };
  mutable.type = nodeType;
  mutable.data = data;
}
