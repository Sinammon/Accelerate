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

React/Vite web app with Tailwind CSS, shared electric-blue/navy semantic tokens, a light/dark theme switch, and stateless import, VIN, recall and optional free-tier Gemini specification endpoints. Preserve hash routes, import validation, four-car limit, removal/replacement, async cancellation and all six decision modes. Retain factory power enrichment. Mileage prefers dedicated listing odometer fields and only explicit mileage statements as fallbacks; unrelated distances are ignored. Unitless mileage readings assume kilometres with a visible assumption label; conflicting readings require review and are excluded from mileage scoring. Other existing conflicts and condition warnings remain visible. Sourced typical-model single values can fill specification gaps with provenance. Comfort uses sourced ratings, model estimates and local baselines on shared cross-class 0-5 anchors, covering ride, quietness, cushioning and heating. Passenger and cargo space belong to Practicality. Performance uses compatible acceleration, power-to-weight and engine output. Best Value weighs capability against asking price; Balanced emphasizes overall capability. Broad sentiment and amenity counts add no refinement points; heating is a separate bounded factor. Missing comfort and energy evidence receives labeled estimates that contribute to provisional rankings; ranges and optional equipment are context only. Category scores stay separate from visible purchase warnings; seating discrepancies do not demote comfort capability. No verified individual-condition or vehicle-history assertions, unlabeled reliability guidance, fabricated citations or ownership estimates presented as quotes or repair forecasts. Explicit seller history claims remain labeled as unverified. No paid fallback, new persistent storage or deployment in this update.

## Ownership calculator

Costs is available from the shared header; Affordability also links to #ownership beside the match explanation when the shortlist is nonempty. Cash is the default; Finance is optional. Summary separates upfront funding and monthly expenses; Purchase and Running costs have separate editable comparison tables covering all cars, and Salary guide has its own tab. Salary guidance for cash uses running expenses only and always shows the separate upfront purchase amount. An optional purchase savings target is excluded from running totals and salary assessments. Finance adds fixed-rate monthly loan payments; its down payment remains separately funded.

All assumptions are editable. Valid model insurance and maintenance estimates supply untouched fields; otherwise insurance uses FSRA's generic June 2026 Ontario population average ($2,218/year) and maintenance uses the generic $0.10/km allowance. These are planning estimates, not personal quotes or repair forecasts. Purchase fees remain an editable generic allowance. Driving and energy assumptions are shared with Compare and Decide. The salary guide uses editable take-home and 15%/20% budget limits; it does not assess household expenses, tax liability or loan eligibility. Salary and calculator overrides stay in React memory, survive navigation and research updates, and reset when the shortlist is cleared. Ownership planning extends the existing model-specs endpoint and allowlisted model cache; private inputs are not sent or persisted. Deployment settings are unchanged.

## Brand Commitments

Use the Accelerate name with honest, plain product language. Style the name as a slanted typographic wordmark without a separate logo or icon. Retain the existing self-hosted Satoshi and Clash Grotesk fonts and electric-blue/navy semantic palettes with white/pale light-theme working surfaces. The home dashboard restores the user-preferred navy/electric-blue hero, floating listing composer, bright editorial section, source strip and blue horizon. Compare, Recommendation and Costs retain their compact, desktop-first Operate layout. The shared header exposes Compare, Recommendation and Costs, plus Add car and theme controls. There is no left shortlist sidebar. Working screens use the full content width, with car removal and selected-car source access in the header Cars menu. The home dashboard retains its original fictional walkthrough disclosure. Keep motion subtle and responsive.

Compare shows a contained, proportionally scaled photo above each car column and opens with six essential rows: price, mileage, annual fuel/charging cost, Comfort ride/seats, Practicality passenger/cargo room and horsepower. Full Specifications and Sources & checks remain available in tabs, including original listing location/mileage, photos and evidence. Phones compare two selected contenders at a time; all four remain in the shortlist. Recommendation exposes all six modes and Summary, Ranking & evidence and Assumptions tabs. Complete reasons and model context appear once in the main card; trade-offs and purchase warnings stay visible. Costs separates Summary, Purchase, Running costs and Salary guide. Tab choices and the selected recommendation contender survive navigation in React memory.

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

## Inline Compare controls

Compare has an Add car button beside its heading; the shared header Add car action opens the same inline form while on Compare. The form focuses the URL field, remains open for validation/import errors, and closes after successful import while focusing the newly added car. Cancel keeps the URL draft and returns focus to Add car. The four-car limit and loading state disable adding; a full comparison explains that a car must be removed.

Each car's comparison header has Details and Remove actions alongside its photograph; Sources & checks also provides Remove this car for the selected contender. Removal uses the existing cancellation/state cleanup and reconciles phone pairs. Focus moves to a remaining selected car's Remove action or, after the final removal, the import field. The restored home, comparison photographs and sidebar-free layout remain intact; the current ownership-planning changes are described below.

Help me decide shows its complete reasons and model context once, fully visible in the main card with source labels and links. The separate repeated Full explanation & model context disclosure is removed. Trade-offs, purchase warnings and the separate detailed vehicle/estimate evidence remain available.

## Car-specific ownership planning and model advice

The quick `/api/model-specs` request with `domain: "ownership"` uses the configured Gemini provider independently of sourced specifications and vehicle import. It returns separate structured `ownershipEstimates` and `modelAdvice` fields. Ranges require matching model scope, Ontario scenario/version, current reference year, CAD units and finite ordered positive amounts; bounded advice is validated independently. A partial result can retain a useful range or advice without weakening sourced-spec checks. Failures retain useful earlier results; cancellation, scheduler limits, retry and quota handling are shared with existing research.

The fixed illustrative scenario is an experienced fully licensed Ontario driver with a clean record, personal use, collision/comprehensive coverage and $1,000 deductibles. AI estimates are not independently verified or personal quotes. Costs shows low/central/high annual insurance and maintenance/tyres/repair reserve per kilometre, their date, rationale and assumptions in **Planning range & assumptions**. Central values supply untouched fields. Shopper overrides remain in memory across research and navigation; each **Reset to estimate** removes only that override. Annual maintenance remains reserve/km × annual driving. Until valid model estimates arrive, insurance uses the clearly labeled generic FSRA June 2026 Ontario average of $2,218/year and maintenance uses the generic $0.10/km allowance.

Costs Summary includes insurance, annual maintenance reserve and **Gross salary for comfortable running costs**. Finance explicitly labels gross salary as covering loan payments plus running expenses, with upfront funding separate. Summary and Salary guide use the same assessment and editable take-home/budget limits. Missing costs or invalid inputs produce incomplete results.

Affordability retains 80% seller asking price and 20% expenses, replacing fuel-only expenses with annual fuel/charging, insurance, maintenance, parking/tolls and other running costs. Costs and ranking share running-cost arithmetic and valid overrides. Incomplete totals exclude the expense factor for every eligible contender; they are never zero. Estimates make results provisional, and the explanation and Ranking & evidence expose component amounts. Finance payments, acquisition taxes/fees and savings stay outside ranking. Best Value, Comfort, Performance, Practicality and Balanced are unchanged; Balanced retains its previous price/fuel affordability subscore.

The main recommendation includes one fully visible model brief in its existing reason list: overview, benefits, problems worth investigating and engine/reliability context. Applicable sourced observations take priority by topic and retain citations; already displayed observations and trade-offs are not repeated. General AI knowledge is labeled **AI model guidance—not independently verified** and dated, without invented citations, failure rates, guaranteed reliability or claims about the individual car's condition. Unresolved engines receive model-level guidance and an explicit variant caveat. The brief also appears in **Sources & checks**. Seller-history attribution and purchase warnings remain separate and visible; no follow-up chat is added.

Only allowlisted model data enters the existing cache, for seven days with matching configuration, scenario/version and reference year. Each range retains its own age; partial updates do not renew old results. Salary, driver identity, personal details, listing descriptions, VINs and calculator overrides are neither sent in ownership requests nor persisted. Demo imports make no AI request. Existing API routes, scoring outside Affordability, credentials and deployment settings are preserved.
