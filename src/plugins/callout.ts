// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { matchMarkedBlockquote, retypeAsColumnBox } from "../internal/blockquote.js";

export interface CalloutVariant {
  /** Element name. Falls back to the plugin-level `hName`. */
  hName?: string;
  /** Class names placed on the element. */
  className?: string[];
  /** Value of the `data-variant` attribute. */
  dataVariant?: string;
  /**
   * Replacement text for the marker.
   *
   * When set, the marker's `strong` is kept and its text is replaced (so the
   * label stays bold). When omitted, the `strong` is removed entirely and the
   * callout starts straight at the body.
   */
  label?: string;
}

export interface CalloutOptions {
  /**
   * Default element name for callouts.
   *
   * @default "mdn-callout"
   */
  hName?: string;
  /**
   * Marker text to variant mapping. Replaces the defaults entirely; spread
   * {@link defaultCalloutVariants} to extend them instead.
   */
  variants?: Record<string, CalloutVariant>;
  /**
   * Node type the blockquote is rewritten to.
   *
   * @default "columnbox"
   */
  nodeType?: string;
}

/**
 * The variants nonasaba.net ships with.
 *
 * The asymmetry is intentional and matches the original `markparse.mjs`:
 * `Callout:` drops its marker, while `Note:` / `Warning:` keep a bold label.
 */
export const defaultCalloutVariants: Readonly<Record<string, CalloutVariant>> =
  Object.freeze({
    "Callout:": { className: ["callout"], dataVariant: "callout" },
    "Warning:": {
      className: ["callout", "warning"],
      dataVariant: "warning",
      label: "警告：",
    },
    "Note:": {
      className: ["callout", "note"],
      dataVariant: "note",
      label: "メモ：",
    },
  });

/**
 * MDN-style callouts written as `> **Note:** body`.
 */
export const remarkNonaCallout: Plugin<[CalloutOptions?], Root> = (options) => {
  const defaultHName = options?.hName ?? "mdn-callout";
  const variants = options?.variants ?? defaultCalloutVariants;
  const nodeType = options?.nodeType ?? "columnbox";

  return (tree: Root) => {
    visit(tree, "blockquote", (node) => {
      const matched = matchMarkedBlockquote(node);
      if (!matched) return;

      const variant = variants[matched.marker];
      if (!variant) return;

      retypeAsColumnBox(node, nodeType, {
        hName: variant.hName ?? defaultHName,
        hProperties: {
          className: variant.className ?? [],
          ...(variant.dataVariant === undefined
            ? {}
            : { "data-variant": variant.dataVariant }),
        },
      });

      if (variant.label === undefined) {
        matched.paragraph.children = matched.paragraph.children.slice(1);
      } else {
        matched.markerNode.value = variant.label;
      }
    });
  };
};
