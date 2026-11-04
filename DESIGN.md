---
name: Accelerate
description: Light editorial car comparison with visible evidence and explainable priorities.
colors:
  background: "#fdfdff"
  surface: "#f4f4fc"
  surface-raised: "#eaeafa"
  surface-hover: "#e0e0f5"
  border: "#9494b8"
  border-subtle: "#dcdcee"
  text: "#1d1d67"
  text-secondary: "#585878"
  action: "#4c4ccc"
  accent: "#4545ba"
  ink: "#ffffff"
  warning: "#795009"
  warning-surface: "#fff5dc"
  error: "#b12f48"
  error-surface: "#fff0f3"
  success: "#21674e"
  success-surface: "#eaf6ef"
  hero-field: "#efeffb"
  preview-field: "#dfe7fc"
  support-blue: "#b4ccfc"
  support-purple: "#8f64ae"
  muted: "#ada3d2"
  photo-mat: "#e5ebf2"
typography:
  display:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "clamp(44px, 6.1vw, 80px)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "clamp(32px, 3vw, 40px)"
    fontWeight: 540
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "clamp(24px, 2.5vw, 32px)"
    fontWeight: 540
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "16px"
    fontWeight: 640
    lineHeight: 1.38
  evidence:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
  wordmark:
    fontFamily: "Clash Grotesk, sans-serif"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  card-title:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "20px"
    fontWeight: 540
    lineHeight: 1.25
  price:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "28px"
    fontWeight: 700
rounded:
  control: "8px"
  card: "8px"
  panel: "8px"
  badge: "6px"
  photo: "4px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
  "24": "96px"
  "32": "128px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px"
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "20px"
  evidence-badge:
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.badge}"
    padding: "4px 8px"
  priority-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  disclosure:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: Accelerate

## Overview

**Creative North Star: "The Open Comparison Desk"**

Accelerate pairs open editorial space with a practical car-shopping workspace. The approved Aerotime reference supplies the light, restrained rhythm; the implementation adapts that direction to real listing import, comparison and evidence. Deep indigo text and compact blue actions sit on near-white and pale fields.

The name itself is the identity: a slanted typographic wordmark, with no separate logo or symbol. Self-hosted Clash Grotesk headings and Satoshi interface text preserve continuity while flat surfaces, contained photographs and explicit source labels make the product approachable and useful.

**Key Characteristics:**

- Light editorial fields with deep indigo reading text and a clear action hierarchy.
- Self-hosted Clash Grotesk headings, Satoshi controls and a slanted Accelerate wordmark.
- Flat tonal grouping, restrained borders and gently curved controls.
- Contained car photography, manual preview controls and visible evidence.

This records the implemented system. `src/theme.css` is the implementation authority; its current values are captured in the normative frontmatter. Component application lives in the homepage, landing, styles, comparison, decision and evidence stylesheets and `public/brand.css`. See the [pinned surface contract](.impeccable/surfaces/dilemma.md) and [product truth](docs/PRODUCT.md).

Reference provenance: user-supplied [Aerotime](https://aerotime.com/) extraction captured 27 May 2026, via [Inspo](https://github.com/Nutlope/inspo) (MIT; Together AI). [Refetch the extraction](https://inspomcp.dev/d/aerotime-com/DESIGN.md). The supplied extraction describes minimal editorial Swiss/SaaS styling, five blue/lilac colors, system type with an 80px/600 headline, a 4px spacing base, 0/8px corners and a 1312px cap. It was supplied rather than freshly fetched. Adapt its rhythm: accessible implemented tokens and retained fonts take precedence over literal reference values. The approved pinned direction supersedes the earlier Core blue-black world and provisional concept seed `seed:dc39d1b894f0064b`.

## Colors

Blue actions and deep indigo text anchor cool, pale fields. The frontmatter corresponds to the CSS custom properties; do not independently recolor components.

### Primary

- **Action Indigo** (`action`): primary import/decision actions and selected preview controls, with white `ink` labels.
- **Deep Action Indigo** (`accent`): hover, links, focus rings, price emphasis and selected decision priorities. Filled selected states use white labels.
- **Reading Indigo** (`text`): headings, field values and primary content.

### Secondary

- **Sky Support** (`support-blue`) and **Preview Field** (`preview-field`): supporting atmosphere and the working-preview band.
- **Lilac Support** (`support-purple`) and **Muted Lilac** (`muted`): supporting palette roles, never substitutes for readable text or semantic status.

### Neutral

- **Near-White Ground** (`background`): page, input and disclosure ground.
- **Cool Surface**, **Raised Surface** and **Hover Surface**: grouping, striping, menus, tabs and feedback.
- **Hero Field** (`hero-field`): broad pale landing field.
- **Secondary Reading Text** (`text-secondary`): explanation, placeholders, metadata and evidence.
- **Interactive Boundary** (`border`): field/control boundaries; **Subtle Divider** (`border-subtle`): quiet grouping lines.
- **White Action Ink** (`ink`): labels on action and accent fills.
- **Photo Mat** (`photo-mat`): neutral background behind uncropped vehicle imagery.

Warning, error and success each pair a dark foreground with its pale state surface. Contrast regression checks cover foregrounds, action labels, links and semantic states on landing/workspace fields. This is source/test evidence, not screenshot approval.

**The Evidence Rule.** State is expressed in words as well as color; provenance, warnings and unresolved values remain readable.

## Typography

**Display Font:** self-hosted Clash Grotesk, sans-serif fallback. **Body Font:** self-hosted Satoshi, sans-serif fallback. Retain font credits and licenses; do not adopt the reference's system stack.

Display type is compact and geometric; interface text stays calm and readable. Landing display reaches 80px; mobile uses `clamp(36px, 7.5vw, 56px)` with line height 1.08. Compare uses 32px desktop and 24px mobile. Body text is 16px; the landing introduction is 18px desktop and 16px mobile. Evidence uses 14px with line heights up to 1.7. Longer explanations use observed 70–75ch limits where applicable.

Contextual sizes are intentional: 12px compact source/photo captions; 14px evidence, metadata, tabs and helper copy; 16px prose/controls; 18px mobile vehicle names, hero intro and facts; 20px compact vehicle/evidence headings; 22px subsections/mobile prices; 24px section/vehicle titles and compact prices; 26px preview wordmark; 28px preview titles and regular prices; 32px workspace headings/header brand; 36px mobile display minimum; 40px headline/preview maximum; 44px desktop display minimum and how-it-works maximum; 56px mobile display maximum; 80px desktop display maximum. Preserve their purposes rather than flattening editorial and data-dense type into one ramp.

The live-text wordmark uses weight 650, tight tracking and `skewX(-9deg)`. Its size depends on context: header 32px/24px mobile, footer 24px, preview 26px/24px mobile and credits 28px. Its home link has an accessible name.

**The Two Voices Rule.** Clash Grotesk carries headings and the wordmark; Satoshi carries controls, prose, labels and vehicle values.

## Layout

The shared content cap is 1312px with 32px desktop and 20px mobile gutters. Landing hero and preview are flat full-width pastel bands with aligned inner content. The centered hero caps heading at 1080px, introduction at 590px and import form at 680px. Landing sections have generous separation, including observed 80px/100px rhythms; workspaces and evidence stay compact. Token spacing uses a 4px base; component-specific values are not new global tokens.

Header height is 88px desktop and 72px mobile. Compare's toolbar sits below the actual header. At 767px and below, navigation becomes a menu, the import action moves below the field, preview vehicles use two columns and decision content stacks. Preview tightens at 1000px, workspace grids at 1100px and narrow evidence at 400px.

Compare shows all contenders on desktop/tablet and two selected contenders on phones, retaining the four-car shortlist. Summaries and table use the same pair; a single car uses one column. The fixed mobile decision bar includes safe-area padding and reserved content space. Only its desktop or mobile counterpart is visible at each breakpoint. Keep horizontal overflow local to labeled data regions, wrap long values and preserve mobile table semantics. The credits page uses a 960px reading cap.

Responsive source rules are implemented. Actual desktop/mobile rendering and 200% zoom remain unverified because browser-host and native inspection were unavailable.

## Elevation & Depth

Flat broad fields structure landing content; solid tonal surfaces and thin borders group workspaces. No decorative drop shadows. Menus and the photo dialog rely on containment, stacking and a translucent indigo backdrop rather than glass ornament.

**The Tonal Depth Rule.** Resting surfaces use solid fields and thin boundaries, without decorative drop shadows.

Controls transition background/border over 160ms. Preview movement is manual and brief. Existing Motion workspace feedback must not replay on every research update. Native smooth scrolling serves deliberate in-page navigation; route changes start at the top. Reduced motion disables smooth scrolling and suppresses nonessential animation while preserving state/completion feedback.

## Shapes

Controls, cards and panels share 8px corners; photo thumbnails use 4px, evidence badges 6px, and progress dots/workflow numbers remain circular. Hero/preview fields are rectangular bands. Use thin editorial dividers, stronger control boundaries and neutral photo mats. Vehicle photographs remain contained, not cropped to fill a decorative silhouette.

## Components

### Buttons

Primary controls use action fill, white ink, 12px × 20px padding and a 44px minimum height. Hover deepens to accent. Primary links have a 48px minimum; landing import is 52px. Secondary buttons use transparent ground, reading text and a visible border; hover uses the hover surface. Keyboard focus uses a 3px accent outline with 4px offset, adjusted within the combined URL field. Disabled controls reduce opacity; busy actions use a wait cursor.

### Inputs / Fields

Near-white fields use the interactive border, 12px padding and a 48px minimum. Placeholders use secondary text at full opacity. Invalid fields use error borders and visible wording. The URL row combines icon, field and import action within a focus-responsive boundary. Editable specifications retain labeled units, original-value placeholders and provenance.

### Navigation

Route links use secondary text, a 44px minimum target and an action underline for the active route. Mobile uses a labeled menu button. The wordmark is the entire identity; its home link is named “Accelerate home.” No separate logo or icon accompanies it.

### Chips

Evidence badges use compact text and thin boundaries. Source type and research state are spelled out. Selected preview priorities use action fill/white text; selected decision priorities use deeper accent/white text.

### Cards / Containers

Vehicle cards use flat cool surfaces and contained photographs. Compact Compare summaries reduce padding/photo height without hiding serious warnings. The decision match splits photo/explanation on desktop and stacks on phones; reasons, trade-offs, facts and evidence remain available.

### Comparison and evidence

Overview is the default tab; Specifications and Sources & checks reveal deeper material. Selected tabs use raised surfaces and accent underlines. Preserve arrow keys, Home/End, roving focus and linked panels. Add car opens/focuses the inline form; empty workspaces show it immediately. Import completion collapses it, selects Overview and reveals the contender. Notices persist while it is closed; limits/options remain explicit.

Sources & checks selects one vehicle and preserves expandable evidence, research, seller specifics, description, mileage reasoning and configuration editing. Save refreshes enrichment; Reset restores imported values. Keep user-entered, reference and unverified-estimate labels distinct. Missing data is never zero, installed equipment or a verified claim.

### Working preview

The landing preview demonstrates Import → Compare → Decide using fictional examples and credited model photos. Manual steps, progress and previous/next controls remain operable; no autoplay. Real listing import stays prominent.

## Do's and Don'ts

### Do:

- **Do** use the canonical color roles and self-hosted fonts across landing, workspace and credits.
- **Do** keep car photographs contained and source labels close to the facts they qualify.
- **Do** preserve visible keyboard focus, reduced motion and explicit state wording.
- **Do** keep comparison overflow inside labeled regions and account for sticky controls and safe areas.

### Don't:

- **Don't** add a separate logo, symbol or raster badge beside the Accelerate wordmark.
- **Don't** use pale support colors as small-text foregrounds or action-label substitutes.
- **Don't** turn missing specifications into certainty or remove visible purchase warnings.
- **Don't** crop vehicle photographs, add autoplay or invent testimonials or performance claims.

### Affordability ownership context

Affordability places a compact Beyond the asking price section after the result. Each contender shows the seller asking price, an available NRCan fuel scenario with an explicitly labeled monthly average, and the need for a personal insurance quote. Other ownership factors and model-specific sourced notes use native disclosures. Keep the score's purchase-price/fuel scope visible, and distinguish missing costs from zero. The fuel-adjustment action opens the existing assumptions and focuses its first input, respecting reduced motion. Use existing text, border and spacing roles; the vehicle list collapses to one column below 768px.


### Consistent running costs and comfort

Compare overview and each decision result expose annual fuel/charging costs and four comfort topics: ride, cushioning, heating and quietness. Space and daily usability appear under Practicality. Reuse existing surfaces, type and responsive pair selection. Show Model estimate, Catalog estimate or General baseline beside inferred information; assumptions and sources use a native disclosure. Estimates remain visible during lookup failures and may contribute to provisional rankings. The shared assumption controls cover annual distance, liquid fuel price, electricity price and plug-in electric share, retaining the last valid calculation after an invalid edit. The decision comfort summary uses two columns on desktop and one below 768px. Browser visual inspection remains unverified after the Windows URL-verification block.
