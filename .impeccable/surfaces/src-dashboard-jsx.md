---
version: 1
slug: "src-dashboard-jsx"
primary_target: "src/Dashboard.jsx"
related_targets: ["src/App.jsx", "src/ImportComposer.jsx", "src/CarManagement.jsx", "src/HeroImportComposer.jsx", "src/WorkspaceTabs.jsx", "src/VehicleComparison.jsx", "src/DecisionDashboard.jsx", "src/OwnershipCalculator.jsx", "src/compact.css", "src/app.css", "src/data/config/colors.js"]
---

# Accelerate compact workspace

Routes: / and /dashboard remain entry points; #import, #compare, #decide and #ownership remain compatible.
Mode: Operate throughout the task workspace.
Primary target: src/Dashboard.jsx. Shared shell and state: src/App.jsx; current layout/density authority: src/compact.css, imported last through src/app.css. src/workspace.css was removed.

## Direction contract

THESIS: Let shoppers operate the car comparison from a compact desktop-first workspace, with the shortlist and next task in reach. Preserve the full evidence and calculation depth behind clear tabs and disclosures.

OWN-WORLD: Retain the slanted Accelerate wordmark, self-hosted Satoshi and Clash Grotesk, the electric-blue/navy semantic palettes and white/pale light-theme surfaces. Use flat boundaries, compact Satoshi interface type, intentional 8px controls and 12px main surfaces. The compact type ramp is 12/14/16/18/22/24px; import uses 36px and 28px on phones. Replace the former cinematic landing composition and legacy fixed navy panels rather than carrying them into the workspace.

STORY: Add a real eBay.ca listing or try the fictional demo; compare essentials; choose one of five priorities; examine acquisition/running expenses and salary assumptions. The same temporary shortlist, shared scenario, view selections and private calculator edits continue across the task views. Help holds the walkthrough and source explanation.

FIRST VIEWPORT: A compact header with Compare, Recommendation, Costs, Add car and theme controls. A sticky 232px shortlist sits beside the main task, becoming 200px up to 1100px and a collapsed disclosure below 768px. The import task is a short introduction plus labeled form. Compare defaults to six rows: price, mileage, annual energy, Comfort ride/seats, Practicality passenger/cargo room and horsepower. Specifications and Sources & checks preserve full details, original location/mileage, photos and provenance. Recommendation has five priorities and one selected-car list capped at six items including overview, trade-off and consolidated warnings; full evidence stays in Compare. Costs has Summary, Purchase, Running costs and Salary guide tabs. These are implemented source rules; actual 1366x768 fit is unverified.

FORM: User-approved compact Operate replacement, implemented code-first within the retained identity, fonts and palette. Seed: none (brief-pinned). No new raster work; existing photo credits remain preserved.

FINISH: The implementation ends with an independent finish review, bounded verdict, current DESIGN.md and sidecar, and preserved provenance for every existing shipping raster.

## Constraints

Preserve the four-car limit, validation, removal/replacement, async cancellation, five visible priorities and the internal compatibility ranking modes, energy/comfort estimates, warnings, citations, configuration edits and source access. Compare preserves two selected contenders on phones with all cars in the shortlist. Costs retains cash/finance calculations and all-car tables. App memory retains selected tabs, contender and private calculator inputs across navigation/research updates; clearing the shortlist resets private inputs. Keep root, /dashboard and existing hash routes. No backend, scoring, persistent-storage or deployment changes.

## Verification evidence - 5 November 2026

- Final automated verification: npm test passed 198/198; npm run build passed with 497 modules. Existing Motion use-client and >500kB chunk advisories remain. git diff --check passed before documentation edits; documentation whitespace/JSON is checked separately.
- The detector ran once. Its 8px-radius and 36px/28px-import-heading advisories are intentional approved compact choices, recorded in DESIGN frontmatter, prose and sidecar.
- Independent finish verdict: ship for two resolved SOURCE findings only. Removed low-contrast legacy navy panels and focused the destination cost tab after programmatic switches. The reviewer also accepted the source correction preserving original listing location/mileage in Sources & checks. This is not whole-surface visual approval.
- Browser and native access hosts were unavailable. No screenshots exist. Actual desktop/1366x768 fit, phone rendering, contrast across the whole rendered surface and 200% zoom remain unverified. Source inspection and JSDOM journeys cannot certify these checks.

## User-directed restoration

The home dashboard restores the pre-compact blue hero, floating import composer, source strip, editorial metrics, walkthrough and horizon. Its Persuade composition is isolated from the retained compact Operate working screens. No left shortlist rail remains on any route: the header Cars menu provides removal and selected-car source access. Working content uses a single 1280px column. Compare shows a 144px-high contained photograph per car, 104px on phones, preserving proportions and complete silhouettes. This instruction supersedes earlier rail and short-entry composition statements in this brief. All data, evidence, tab/state and calculator constraints remain.

## Inline Compare controls

Compare has an Add car button beside its heading; the shared header Add car action opens the same inline form while on Compare. The form focuses the URL field, remains open for validation/import errors, and closes after successful import while focusing the newly added car. Cancel keeps the URL draft and returns focus to Add car. The four-car limit and loading state disable adding; a full comparison explains that a car must be removed.

Each car's comparison header has Details and Remove actions alongside its photograph; Sources & checks also provides Remove this car for the selected contender. Removal uses the existing cancellation/state cleanup and reconciles phone pairs. Focus moves to a remaining selected car's Remove action or, after the final removal, the import field. No home, sidebar, API, scoring or storage changes are introduced.

Help me decide now selects at most six category-specific information items, including overview, trade-off and consolidated warnings. Full model advice, research, recalls and supporting evidence remain in Compare > Sources & checks.

## Approved Unslop refinement — 6 November 2026

The user selected the whole app while explicitly preserving the blue homepage atmosphere. Retain the home hero, horizon, section order, fonts, palette, slanted wordmark, photos and compact workspace. Keep the atmosphere static; remove the announcement pill, italic emphasis, ornamental dots/diamond and repeated composer chips. The home headline is “Compare your eBay.ca shortlist”. Import has a visible URL label, text Add car action, one capacity/account helper and a secondary fictional-demo button. Retain the fuel/comfort action in the existing editorial section.

Character: practical, measured and candid. Existing vehicle photos and the manual fictional walkthrough carry the product detail; aligned CAD figures and explicit provenance are the signature. Use 4px spacing, 24px/600 working headings, 400/500/600 interface weights, 18px/1.5 icons, 8px controls, 12px workspace surfaces and a 16px home composer. Normal cost values use text color, while actions, selections and important totals use the accent. Preserve every state, data safeguard, tab, warning and calculation.

Source/DOM verification does not establish rendered fit. Browser/native access is unavailable; desktop, phone and 200% zoom approval remain outstanding. Method: [Unslop by Damir Sokolovsky (@heydamir)](https://github.com/heydamir/unslop/blob/main/skills/unslop/SKILL.md), CC BY 4.0. This refinement supersedes earlier conflicting visual values in this brief.

## Focused decision contract — 7 November 2026

Recommendation is now one concise result for five priorities; Balanced is hidden but retained in the engine. Count every overview, takeaway, trade-off and grouped warning in the maximum of six items. Keep photo/identity, status and navigation outside this budget. Best Value leads with the available model overview; other modes select only category-relevant data. Do not pad missing evidence or put general model advice in every priority. Full model advice and optional recall lookup live in Compare > Sources & checks. Source links select and focus the displayed car; cost/practicality links reuse the existing editable state.

This contract supersedes prior recommendation tab, complete-reason and detail-disclosure statements. The detector returned no findings; DOM journeys verify controls and retained state. Computer Use stopped browser input because the current Chrome URL could not be established confidently; no rendered desktop, phone or zoom approval is claimed.
