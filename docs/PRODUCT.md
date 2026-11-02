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

React/Vite web app with stateless import, VIN, recall and optional free-tier Gemini specification endpoints. Preserve hash routes, import validation, four-car limit, removal/replacement, async cancellation and all six decision modes. Retain factory power enrichment. Mileage prefers dedicated listing odometer fields and only explicit mileage statements as fallbacks; unrelated distances are ignored. Unitless mileage readings assume kilometres with a visible assumption label; conflicting readings require review and are excluded from mileage scoring. Other existing conflicts and condition warnings remain visible. Sourced typical-model single values can fill specification gaps with provenance. Comfort uses professional-review dimension ratings on shared cross-class 0-5 anchors. Performance uses compatible acceleration, power-to-weight and engine output. Best Value weighs capability against asking price; Balanced emphasizes overall capability. Broad sentiment and amenity counts add no comfort points. Missing evidence yields provisional rankings or unranked cars; ranges and optional equipment are context only. Category scores stay separate from visible purchase warnings; seating discrepancies do not demote comfort capability. No individual-condition or vehicle-history claims, unsourced reliability claims, or invented repair/insurance costs. No paid fallback, new persistent storage or deployment in this update.

## Brand Commitments

Use the Accelerate name with honest, plain product language. Style the name as a slanted typographic wordmark without a separate logo or icon. The user-approved Aerotime direction uses light editorial fields, deep indigo text, restrained blue actions and the existing self-hosted fonts; [the canonical design system](../DESIGN.md) records the accessible adaptation. Keep the real car-shopping import, comparison and decision workflow prominent. Compare starts with an overview, with specifications and sources available in tabs. Phones compare two selected contenders at a time; all four remain in the shortlist. Keep motion subtle and responsive.

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

Government configuration references precede AI gap filling. Compare offers a short variant-confirmation step and editable identity/specifications in Sources & checks, preserving original imported evidence. User-entered details and unverified AI estimates stay visibly attributed. CVT gear counts and EV engine displacement/cylinders are not applicable. See [the implementation and ownership-cost roadmap](dependable-core.md).
