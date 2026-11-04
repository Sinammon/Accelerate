---
version: 1
slug: "ownership"
primary_target: "src/OwnershipCalculator.jsx"
related_targets: ["src/ownership.css", "src/ownership-calculator.js", "src/App.jsx", "src/DecisionDashboard.jsx"]
---

# Ownership calculator

Mode: Operate. Route: #ownership, a continuation of Help Me Decide for the existing shortlist.

## Direction contract

THESIS: Compare purchase funding and actual running expenses separately, then explain a salary-based budget without confusing savings targets with bills.

OWN-WORLD: Extend the existing electric-blue/navy workspace, self-hosted fonts, semantic theme roles, flat tables, labeled inputs and explicit evidence wording. No new identity or imagery.

STORY: Open from Decide, start with Cash, edit the acquisition and running assumptions for every contender, then enter a salary. Finance is optional; savings goals are a separate disclosure.

FIRST VIEWPORT: Shared compact workspace heading and back link, Cash/Finance controls, a collapsed assumptions panel, and the start of the purchase comparison. The running comparison and salary guide follow in reading order. On phones each table scrolls locally while cost labels stay fixed.

FORM: User-approved two-table comparison and salary guide inside the established visual system, implemented code-first. Seed: none (brief-pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints

Cash is the default. Cash salary guidance covers running costs only and always identifies separately required purchase savings. All assumptions are editable estimates; insurance starts with a dated Ontario average, never a vehicle quote. Inputs remain in React memory. Preserve all existing rankings and evidence. No deployment changes.

## Verification evidence — 4 November 2026

- Source record: `src/OwnershipCalculator.jsx`, `src/ownership-calculator.js`, `src/ownership.css`, the route/state owner in `src/App.jsx` and the Decide action in `src/DecisionDashboard.jsx` support the direction contract. `PRODUCT.md` and the ownership section of `docs/dependable-core.md` agree with the implementation. The FSRA June 2026 date is the visible insurance attribution; the $2,218 annual starting value is in the calculator defaults. This records source behavior, not independent verification of external financial guidance.
- Design continuity: checked `src/theme.css`, `src/workspace.css`, `src/WorkspaceHeading.jsx`, `src/data/config/colors.js` and `tailwind.config.js`. The section appended under Components in `DESIGN.md` documents the existing theme/font roles, all-car tables, fixed cost labels, estimate wording, salary assumptions and in-memory lifecycle. Token frontmatter and `.impeccable/design.json` are preserved. No new raster or raster-provenance work is involved.
- Automated verification: all seven ownership tests passed. After the finish correction, `npm test` passed 188/188 and `npm run build` passed with 492 modules. Existing Motion directive and >500kB bundle-chunk advisories remain. The detector ran once and reported two 20px type advisories; both were corrected to the existing 18px role.
- Independent finish review: the only finding was the Decide ownership action's missing flex layout. `display: flex` and `justify-content: space-between` resolve it in `src/ownership.css`; the reviewer confirmed pass with the bounded verdict **Ship for reviewed source findings**.
- Verification limits: browser and native access hosts were unavailable. No screenshots exist. Desktop/phone rendering, ownership contrast, 200% zoom and whole-surface visual approval remain unverified; source review and JSDOM tests do not certify those checks. The previously documented legacy photo-credits palette drift remains outside this extension.
