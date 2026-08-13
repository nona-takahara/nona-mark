// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (C) 2023 Nona Takahara

// These packages augment interfaces this library writes to but never imports
// at runtime: `remark-parse` / `remark-stringify` add the extension lists on
// unified's `Data`, and `mdast-util-to-hast` adds `hName` / `hProperties` /
// `hChildren` on mdast's `Data`. They are development-only type references
// and are not part of the published API.

/// <reference types="remark-parse" />
/// <reference types="remark-stringify" />
/// <reference types="mdast-util-to-hast" />
