// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export interface CodeLanguageOptions {
  /**
   * Attribute that receives the language.
   *
   * @default "data-lang"
   */
  attribute?: string;
  /**
   * Prefix shared by the language class names.
   *
   * @default "language-"
   */
  prefix?: string;
  /**
   * Emit the attribute for fenced code blocks that declare no language,
   * producing `language-null`.
   *
   * This looks like a bug but is load-bearing for nonasaba.net: its MDX `code`
   * component tells block code from inline code by the *presence* of the
   * attribute, and its highlighter explicitly skips the `null` language. Turn
   * it off only in projects that do not rely on that convention.
   *
   * @default true
   */
  emitForMissingLang?: boolean;
  /**
   * Node types to annotate.
   *
   * @default ["code", "inlineCode", "math", "inlineMath"]
   */
  types?: string[];
}

const defaultTypes = ["code", "inlineCode", "math", "inlineMath"];

/**
 * Copy the code/math language onto an attribute so components and
 * client-side highlighters can read it without parsing class names.
 */
export const remarkNonaCodeLanguage: Plugin<[CodeLanguageOptions?], Root> = (
  options,
) => {
  const attribute = options?.attribute ?? "data-lang";
  const prefix = options?.prefix ?? "language-";
  const emitForMissingLang = options?.emitForMissingLang ?? true;
  const types = options?.types ?? defaultTypes;

  return (tree: Root) => {
    visit(tree, (node) => {
      if (!types.includes(node.type)) return;

      const data = (node.data ??= {});
      const hProperties = (data.hProperties ??= {});

      if (node.type === "code") {
        const { lang } = node;
        if (lang === null || lang === undefined) {
          if (!emitForMissingLang) return;
        }
        hProperties[attribute] = `${prefix}${String(lang)}`;
        return;
      }

      // Math and inline code carry the language as a class name, if at all.
      // `remark-math` only sets one on inline math — display math has no
      // class list, so this must tolerate its absence.
      const { className } = hProperties;
      if (!Array.isArray(className)) return;

      const found = className.find(
        (value) => typeof value === "string" && value.includes(prefix),
      );
      if (found === undefined) return;

      hProperties[attribute] = found;
    });
  };
};
