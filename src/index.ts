// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

export { nonaMarkPreset, type NonaMarkPresetOptions } from "./preset.js";

export {
  remarkNonaGfm,
  type NonaGfmOptions,
  type TableToMarkdownOptions,
} from "./plugins/gfm.js";
export { remarkNonaUnderline, type UnderlineOptions } from "./plugins/underline.js";
export {
  remarkNonaCallout,
  defaultCalloutVariants,
  type CalloutOptions,
  type CalloutVariant,
} from "./plugins/callout.js";
export {
  remarkNonaCodeLanguage,
  type CodeLanguageOptions,
} from "./plugins/code-language.js";
