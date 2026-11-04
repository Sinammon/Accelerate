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

Import → Compare → Help Me Decide. Prices are CAD; compatible mileage is normalized for scoring. User choices, listings and enrichment remain in React memory. Refresh clears the shortlist. Demo prices and mileage are fictional, with separately credited model-example photographs.

## Capabilities and Constraints

React/Vite web app with Tailwind CSS, shared electric-blue/navy semantic tokens, a light/dark theme switch, and stateless import, VIN, recall and optional free-tier Gemini specification endpoints. Preserve hash routes, import validation, four-car limit, removal/replacement, async cancellation and all six decision modes. Retain factory power enrichment. Mileage prefers dedicated listing odometer fields and only explicit mileage statements as fallbacks; unrelated distances are ignored. Unitless mileage readings assume kilometres with a visible assumption label; conflicting readings require review and are excluded from mileage scoring. Other existing conflicts and condition warnings remain visible. Sourced typical-model single values can fill specification gaps with provenance. Comfort uses sourced ratings, model estimates and local baselines on shared cross-class 0-5 anchors, covering ride, quietness, cushioning and heating. Passenger and cargo space belong to Practicality. Performance uses compatible acceleration, power-to-weight and engine output. Best Value weighs capability against asking price; Balanced emphasizes overall capability. Broad sentiment and amenity counts add no refinement points; heating is a separate bounded factor. Missing comfort and energy evidence receives labeled estimates that contribute to provisional rankings; ranges and optional equipment are context only. Category scores stay separate from visible purchase warnings; seating discrepancies do not demote comfort capability. No individual-condition or vehicle-history claims, unsourced reliability claims, or invented repair/insurance costs. No paid fallback, new persistent storage or deployment in this update.

## Ownership calculator

Help Me Decide links to #ownership for every priority with a nonempty shortlist. Cash is the default; Finance is optional. Purchase funding and actual running expenses have separate comparison tables covering all cars. Salary guidance for cash uses running expenses only and always shows the separate upfront purchase amount. An optional purchase savings target is excluded from running totals and salary assessments. Finance adds fixed-rate monthly loan payments; its down payment remains separately funded.

All assumptions are editable. Insurance starts with FSRA's June 2026 Ontario population average ($2,218/year), explicitly not a quote for any listed vehicle. Purchase fees and maintenance/repair reserves are generic planning estimates, not verified fees or model-specific repair forecasts. Driving and energy assumptions are shared with Compare and Decide. The salary guide uses editable take-home and 15%/20% budget limits; it does not assess household expenses, tax liability or loan eligibility. Salary and calculator overrides stay in React memory, survive navigation and research updates, and reset when the shortlist is cleared. No new backend, storage or deployment is introduced.

## Brand Commitments

Use the Accelerate name with honest, plain product language. Style the name as a slanted typographic wordmark without a separate logo or icon. The user-approved cinematic reference uses a navy hero, atmospheric electric-blue lighting, a floating listing composer, a bright editorial content section and a matching blue horizon. Dark mode preserves the hero and changes content and workspace surfaces to navy. Retain the existing self-hosted Satoshi and Clash Grotesk fonts. Keep the real car-shopping import, comparison and decision workflow prominent. Compare starts with an overview, with specifications and sources available in tabs. Phones compare two selected contenders at a time; all four remain in the shortlist. Keep motion subtle and responsive.

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

The redesigned landing page is available at /dashboard; / remains a compatible entry. Import, Compare and Decide retain their hash routes and one shared in-memory shortlist. Only the theme preference and allowlisted model references persist. The theme defaults to the system preference when unset, can be toggled from the menu bar on every screen, and synchronizes across tabs. Source names indicate inputs to research, not commercial partnerships. Product metrics describe the real four-car limit, five primary decision modes, one shortlist and no account requirement; do not substitute the reference screenshot's unrelated creative-production claims.
