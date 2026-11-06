---
version: 1
slug: "src-dashboard-jsx"
primary_target: "src/Dashboard.jsx"
related_targets: ["src/App.jsx", "src/ImportComposer.jsx", "src/Shortlist.jsx", "src/WorkspaceTabs.jsx", "src/VehicleComparison.jsx", "src/DecisionDashboard.jsx", "src/OwnershipCalculator.jsx", "src/compact.css", "src/app.css", "src/data/config/colors.js"]
---

# Accelerate compact workspace

Routes: / and /dashboard remain entry points; #import, #compare, #decide and #ownership remain compatible.
Mode: Operate throughout the task workspace.
Primary target: src/Dashboard.jsx. Shared shell and state: src/App.jsx; current layout/density authority: src/compact.css, imported last through src/app.css. src/workspace.css was removed.

## Direction contract

THESIS: Let shoppers operate the car comparison from a compact desktop-first workspace, with the shortlist and next task in reach. Preserve the full evidence and calculation depth behind clear tabs and disclosures.

OWN-WORLD: Retain the slanted Accelerate wordmark, self-hosted Satoshi and Clash Grotesk, the electric-blue/navy semantic palettes and white/pale light-theme surfaces. Use flat boundaries, compact Satoshi interface type, intentional 8px controls and 12px main surfaces. The compact type ramp is 12/14/16/18/22/24px; import uses 36px and 28px on phones. Replace the former cinematic landing composition and legacy fixed navy panels rather than carrying them into the workspace.

STORY: Add a real eBay.ca listing or try the fictional demo; compare essentials; choose one of six priorities; examine acquisition/running expenses and salary assumptions. The same temporary shortlist, shared scenario, view selections and private calculator edits continue across the task views. Help holds the walkthrough and source explanation.

FIRST VIEWPORT: A compact header with Compare, Recommendation, Costs, Add car and theme controls. A sticky 232px shortlist sits beside the main task, becoming 200px up to 1100px and a collapsed disclosure below 768px. The import task is a short introduction plus labeled form. Compare defaults to six rows: price, mileage, annual energy, Comfort ride/seats, Practicality passenger/cargo room and horsepower. Specifications and Sources & checks preserve full details, original location/mileage, photos and provenance. Recommendation has Summary, Ranking & evidence and Assumptions tabs with all six modes, compact reasons, full explanation disclosure, visible trade-off and separate warnings. Costs has Summary, Purchase, Running costs and Salary guide tabs. These are implemented source rules; actual 1366x768 fit is unverified.

FORM: User-approved compact Operate replacement, implemented code-first within the retained identity, fonts and palette. Seed: none (brief-pinned). No new raster work; existing photo credits remain preserved.

FINISH: The implementation ends with an independent finish review, bounded verdict, current DESIGN.md and sidecar, and preserved provenance for every existing shipping raster.

## Constraints

Preserve the four-car limit, validation, removal/replacement, async cancellation, all six ranking modes, energy/comfort estimates, warnings, citations, configuration edits and source access. Compare preserves two selected contenders on phones with all cars in the shortlist. Costs retains cash/finance calculations and all-car tables. App memory retains selected tabs, contender and private calculator inputs across navigation/research updates; clearing the shortlist resets private inputs. Keep root, /dashboard and existing hash routes. No backend, scoring, persistent-storage or deployment changes.

## Verification evidence - 5 November 2026

- Final automated verification: npm test passed 198/198; npm run build passed with 496 modules. Existing Motion use-client and >500kB chunk advisories remain. git diff --check passed before documentation edits; documentation whitespace/JSON is checked separately.
- The detector ran once. Its 8px-radius and 36px/28px-import-heading advisories are intentional approved compact choices, recorded in DESIGN frontmatter, prose and sidecar.
- Independent finish verdict: ship for two resolved SOURCE findings only. Removed low-contrast legacy navy panels and focused the destination cost tab after programmatic switches. The reviewer also accepted the source correction preserving original listing location/mileage in Sources & checks. This is not whole-surface visual approval.
- Browser and native access hosts were unavailable. No screenshots exist. Actual desktop/1366x768 fit, phone rendering, contrast across the whole rendered surface and 200% zoom remain unverified. Source inspection and JSDOM journeys cannot certify these checks.
