# Accelerate redesign direction contract

Historical contract: the user-approved cinematic redesign supersedes this visual direction. Use [the dashboard contract](src-dashboard-jsx.md) for current work; this record is retained as history.

Pinned user-approved direction, implemented 2 November 2026. The historic filename is retained; the current product name is Accelerate. Code-led implementation; no comp artifact. The approved Aerotime reference supersedes the previous Core blue-black refinement and provisional concept seed `seed:dc39d1b894f0064b`.

## Direction contract

THESIS: Give Canadian car shoppers an open invitation to import real listings, then a clear comparison workspace with evidence and explainable priorities.

OWN-WORLD: Light editorial Swiss/SaaS rhythm, deep indigo reading text, restrained blue actions, broad pale fields and flat tonal grouping. Retain self-hosted Clash Grotesk and Satoshi. The slanted Accelerate wordmark is the identity; no separate logo or icon. [Root DESIGN.md](../../DESIGN.md) captures the adapted implementation tokens.

STORY: Import up to four eBay.ca finds, compare essentials, inspect supporting evidence and choose priorities in Decide. Keep the real car-shopping workflow prominent. Fictional examples remain explicit and secondary to import.

FIRST VIEWPORT: Centered editorial invitation and listing-import form on a full-width pale hero field, followed by the blue-tinted working-preview band. Supporting demo access stays visible. Explain three steps below and provide a concluding import action. This composition is landing-specific.

FORM: Restrained large headings, generous landing space, 1312px content cap, 32px desktop/20px mobile gutters, 8px control/card/panel corners and contained vehicle photography. Compare and Decide remain compact operational workspaces.

FINISH: Preserve functioning controls, sources, warnings, keyboard focus, reduced motion and responsive source rules. Distinguish source/test verification from rendered inspection.

## Reference authority

User-supplied extraction captured 27 May 2026: [Aerotime](https://aerotime.com/), via [Inspo](https://github.com/Nutlope/inspo), MIT / Together AI; [refetch extraction](https://inspomcp.dev/d/aerotime-com/DESIGN.md). Reference colors: `#4c4ccc`, `#b4ccfc`, `#1d1d67`, `#8f64ae`, `#ada3d2`. System type with an 80px/600 headline, 4px spacing base, 0/8px corners and 1312px cap informed the reference. Adapt its rhythm: implemented accessible colors and retained fonts take precedence. The source was supplied rather than freshly fetched.

## Modes

Import: Persuade. Compare and Decide: Operate. Photo credits: Read.

## Workspaces and continuity

Overview is the default; Specifications preserves supported fields and Sources & checks reveals selected-vehicle evidence. Compact summaries retain photos, name, price, mileage, location, status, removal and View details. Serious concerns remain visible, including a shortlist-wide count for cars outside the phone pair. Phones use two selected contenders; all four remain in the shortlist. Only the desktop or mobile decision action is displayed at its breakpoint.

Preserve keyboard tabs, focus behavior, inline import completion, pair switching, memory across navigation and reconciliation after removal. Retain configuration confirmation and editable details with save/reset and provenance. Use brief feedback, manual preview transitions and deliberate in-page smooth scrolling. Respect reduced motion; do not replay movement on every research update.

## Hard constraints

Preserve hash routes, import validation and async cancellation, four-car limit, removal/replacement, all six priorities, VIN compatibility, factory power enrichment, supported evidence and purchase warnings. Missing data stays unknown. No new backend/schema APIs, paid fallback, persistence or deployment changes. No page-level horizontal overflow, cropped vehicle photos, autoplay, invented proof or unsupported claims.

## Verification

Source review returned ship at SOURCE-ONLY scope, with no material findings. All 157 tests and the production build passed; existing Motion use-client and bundle-size advisories remain. Contrast regression covers text, actions, links and semantic state foregrounds across landing and workspace fields. Browser-host inspection and native `@oai/sky` were unavailable. No desktop/mobile screenshot approval or verified responsive rendering is claimed. Rendered checks at desktop, tablet, phone and 200% zoom remain a recapture item.
