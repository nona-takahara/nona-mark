// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import type { ElementContent } from "hast";
import type { Root } from "mdast";
import type { Plugin } from "unified";
import { is } from "unist-util-is";
import { visit } from "unist-util-visit";

import { matchMarkedBlockquote, retypeAsColumnBox } from "../internal/blockquote.js";

export interface PetitcomKeyOptions {
  /**
   * Marker that introduces a public key block.
   *
   * @default "Key:"
   */
  marker?: string;
  /**
   * Element name emitted for the block.
   *
   * @default "petitcom-public-key"
   */
  hName?: string;
  /**
   * Class names placed on the element.
   *
   * @default ["petitcom-key"]
   */
  className?: string[];
  /**
   * Class name for the label span.
   *
   * @default "key-target"
   */
  targetClassName?: string;
  /**
   * Class name for the key span.
   *
   * @default "key"
   */
  keyClassName?: string;
  /**
   * Node type the blockquote is rewritten to.
   *
   * @default "columnbox"
   */
  nodeType?: string;
}

const keyPattern = /\((.+)\)/;

function span(className: string, value: string): ElementContent {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [className] },
    children: [{ type: "text", value }],
  };
}

/**
 * Petitcom public key blocks, written as:
 *
 * ```markdown
 * > **Key:**(プチコン 4 公開キー) 4N443KXX3
 * ```
 *
 * This is specific to nonasaba.net's software pages, so it is not part of
 * {@link nonaMarkPreset} — import it from `@nona-takahara/nona-mark/petitcom`
 * and add it yourself.
 */
export const remarkPetitcomKey: Plugin<[PetitcomKeyOptions?], Root> = (
  options,
) => {
  const marker = options?.marker ?? "Key:";
  const hName = options?.hName ?? "petitcom-public-key";
  const className = options?.className ?? ["petitcom-key"];
  const targetClassName = options?.targetClassName ?? "key-target";
  const keyClassName = options?.keyClassName ?? "key";
  const nodeType = options?.nodeType ?? "columnbox";

  return (tree: Root) => {
    visit(tree, "blockquote", (node) => {
      const matched = matchMarkedBlockquote(node);
      if (matched?.marker !== marker) return;

      // `> **Key:**(label) VALUE` — the label and the key live in the text
      // node that follows the marker. A block that does not match the shape
      // is left as an ordinary blockquote instead of throwing.
      const valueNode = matched.paragraph.children[1];
      if (!is(valueNode, "text")) return;

      const parts = valueNode.value.split(keyPattern);
      const keyTarget = parts[1];
      const keyValue = parts[2];
      if (keyTarget === undefined || keyValue === undefined) return;

      retypeAsColumnBox(node, nodeType, {
        hName,
        hProperties: { className },
        hChildren: [
          span(targetClassName, keyTarget),
          span(keyClassName, keyValue),
        ],
      });

      node.children = [];
    });
  };
};
