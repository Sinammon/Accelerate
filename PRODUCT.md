# Accelerate

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Canadian used-car shoppers comparing a shortlist of eBay.ca listings. The primary action is importing a real listing; the fictional demo is secondary. Confirmed by the user on 30 October 2026.

## Product Purpose

Help shoppers compare available seller details and choose according to their priorities, with transparent evidence and trade-offs.

## Positioning

Turn up to four eBay.ca listing links into a temporary comparison and explainable preference ranking. Distinguish seller claims, VIN records, exact factory references and qualitative model research.

## Operating Context

Add car -> Compare -> Recommendation -> Costs. Prices are CAD; compatible mileage is normalized for scoring. User choices, listings and enrichment remain in React memory. Refresh clears the shortlist. Demo prices and mileage are fictional, with separately credited model-example photographs.

## Capabilities and Constraints

React/Vite web app with Tailwind CSS, shared electric-blue/navy semantic tokens, a light/dark theme switch, and stateless import, VIN, recall and optional free-tier Gemini specification endpoints. Preserve hash routes, import validation, four-car limit, removal/replacement, async cancellation and all six decision modes. Retain factory power enrichment. Mileage prefers dedicated listing odometer fields and only explicit mileage statements as fallbacks; unrelated distances are ignored. Unitless mileage readings assume kilometres with a visible assumption label; conflicting readings require review and are excluded from mileage scoring. Other existing conflicts and condition warnings remain visible. Sourced typical-model single values can fill specification gaps with provenance. Comfort uses sourced ratings, model estimates and local baselines on shared cross-class 0-5 anchors, covering ride, quietness, cushioning and heating. Passenger and cargo space belong to Practicality. Performance uses compatible acceleration, power-to-weight and engine output. Best Value weighs capability against asking price; Balanced emphasizes overall capability. Broad sentiment and amenity counts add no refinement points; heating is a separate bounded factor. Missing comfort and energy evidence receives labeled estimates that contribute to provisional rankings; ranges and optional equipment are context only. Category scores stay separate from visible purchase warnings; seating discrepancies do not demote comfort capability. No verified individual-condition or vehicle-history assertions, unsourced reliability claims, or invented repair/insurance costs. Explicit seller history claims remain labeled as unverified. No paid fallback, new persistent storage or deployment in this update.

## Ownership calculator

Costs is available from the shared header; Affordability also links to #ownership beside the match explanation when the shortlist is nonempty. Cash is the default; Finance is optional. Summary separates upfront funding and monthly expenses; Purchase and Running costs have separate editable comparison tables covering all cars, and Salary guide has its own tab. Salary guidance for cash uses running expenses only and always shows the separate upfront purchase amount. An optional purchase savings target is excluded from running totals and salary assessments. Finance adds fixed-rate monthly loan payments; its down payment remains separately funded.

All assumptions are editable. Insurance starts with FSRA's June 2026 Ontario population average ($2,218/year), explicitly not a quote for any listed vehicle. Purchase fees and maintenance/repair reserves are generic planning estimates, not verified fees or model-specific repair forecasts. Driving and energy assumptions are shared with Compare and Decide. The salary guide uses editable take-home and 15%/20% budget limits; it does not assess household expenses, tax liability or loan eligibility. Salary and calculator overrides stay in React memory, survive navigation and research updates, and reset when the shortlist is cleared. No new backend, storage or deployment is introduced.

## Brand Commitments

Use the Accelerate name with honest, plain product language. Style the name as a slanted typographic wordmark without a separate logo or icon. Retain the existing self-hosted Satoshi and Clash Grotesk fonts and electric-blue/navy semantic palettes with white/pale light-theme working surfaces. The approved direction is a compact, desktop-first Operate workspace. The shared header exposes Compare, Recommendation and Costs, plus Add car and theme controls. A sticky shortlist stays beside the task on desktop and collapses above it on phones. The short import screen places walkthrough and source explanation inside Help. Keep motion subtle and responsive.

Compare opens with six essential rows: price, mileage, annual fuel/charging cost, Comfort ride/seats, Practicality passenger/cargo room and horsepower. Full Specifications and Sources & checks remain available in tabs, including original listing location/mileage, photos and evidence. Phones compare two selected contenders at a time; all four remain in the shortlist. Recommendation exposes all six modes and Summary, Ranking & evidence and Assumptions tabs. Short reasons disclose the full explanation; trade-offs and purchase warnings stay visible. Costs separates Summary, Purchase, Running costs and Salary guide. Tab choices and the selected recommendation contender survive navigation in React memory.

## Evidence on Hand

Bundled fictional demo, four credited model photographs, reviewed model-research profiles, manufacturer power references, NRCan fuel data and optional NHTSA VIN/recall records. No testimonials, endorsements, customer counts or performance benchmarks are supplied; do not invent them.

## Product Principles

- Prioritize the shopper's import and comparison task.
- Explain recommendations using supported facts and visible trade-offs.
- Keep uncertainty and source provenance legible.
- Preserve the shopper's shortlist as they move between screens.

## Accessibility & Inclusion

Keyboard access, visible focus, reduced motion, readable contrast on light fields and semantic states, responsive layouts, 44px primary touch targets and usable content at 200% zoom are acceptance requirements.

## Dependable specifications

Government configuration references precede AI gap filling. Compare offers a short variant-confirmation step and editable identity/specifications in Sources & checks, preserving original imported evidence. User-entered details and unverified AI estimates stay visibly attributed. CVT gear counts and EV engine displacement/cylinders are not applicable. See [the implementation and ownership-cost roadmap](docs/dependable-core.md).

## Routes and theme

Both / and /dashboard enter the compact workspace. Existing #import, #compare, #decide and #ownership links remain compatible; Recommendation and Costs are the visible navigation labels for the existing decide and ownership routes. One shared in-memory shortlist, scenarios, tab selections and private calculator inputs continue across views. Only the theme preference and allowlisted model references persist. The theme defaults to the system preference when unset, can be toggled from the menu bar on every screen, and synchronizes across tabs. Source names identify research inputs, not commercial partnerships. The app supports four cars, all six decision modes, one shortlist and no account requirement; do not invent customer counts or performance claims.


## Configuration and decision guidance

Reference market is a dataset preference, separate from Original market evidence. Automatic uses an explicit original market when supplied, otherwise the seller country (CA or US). Unknown seller countries retain both datasets. A shopper can override the preference; explicit original-market incompatibilities remain blocked, and unavailable references never silently switch countries. Configuration changes preserve compatible selections and clear incompatible ones before restarting enrichment.

Confirm Configuration includes an editable odometer amount and km/miles selector. Corrections require a finite nonnegative amount and explicit unit, remain labeled User-entered, and preserve original imported evidence in Sources. All mileage displays and rankings use the correction; scoring normalizes miles to kilometres. Reset restores the import and automatic reference preference. Edits remain in memory; superseded enrichment cannot overwrite them.

Recommendation keeps the full comfort block in its vehicle-details disclosure for Comfort. Affordability retains annual fuel/charging evidence and scenario assumptions in the tabbed/disclosed details, with its ownership-calculator action beside the match explanation. Detailed energy information remains available. Best Value and Affordability can include sourced reliability/maintenance context and explicit seller Carfax claims in their explanations, without adding ranking points. Engine reputation requires cited exact-configuration applicability and named-engine evidence. Seller history claims are explicitly unverified; negation and conflicting disclosures never become a clean-history endorsement. Mechanical warnings remain visible. Performance explains a lower-horsepower car's higher hp/tonne advantage using compatible weight/power and names the compared car; quicker acceleration requires the same metric and measurement method.
