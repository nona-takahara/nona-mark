// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

import type { PluggableList } from "unified";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

/**
 * Build a `markdown -> html` function for the given plugins.
 *
 * Every spec in this suite states an input and the exact HTML it produces, so
 * the pipeline around the plugin under test is deliberately minimal: parse,
 * the plugin, and serialize. Nothing else is allowed to shape the output.
 */
export function renderWith(plugins: PluggableList): (markdown: string) => string {
  const processor = unified()
    .use(remarkParse)
    .use(plugins)
    .use(remarkRehype)
    .use(rehypeStringify)
    .freeze();

  return (markdown) => String(processor.processSync(markdown)).trim();
}
