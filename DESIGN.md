---
name: Accelerate
description: Cinematic electric-blue atmosphere around a clear, evidence-led car-shopping workspace.
colors:
  primary-50: "#EFF7FF"
  primary-100: "#DCEFFF"
  primary-200: "#B9DFFF"
  primary-300: "#85C5FF"
  primary-400: "#4BA9FF"
  primary-500: "#168BFF"
  primary-600: "#0872E6"
  primary-700: "#0759B8"
  primary-800: "#0A438B"
  primary-900: "#102F61"
  primary-950: "#081B3C"
  secondary-50: "#F0F5FA"
  secondary-100: "#DAE6F1"
  secondary-200: "#B5CADE"
  secondary-300: "#89ACC9"
  secondary-400: "#5989B2"
  secondary-500: "#386C98"
  secondary-600: "#285478"
  secondary-700: "#1A3C59"
  secondary-800: "#102C47"
  secondary-900: "#081D33"
  secondary-950: "#041222"
  neutral-white: "#FFFFFF"
  neutral-50: "#F8FBFD"
  neutral-100: "#F0F6FA"
  neutral-200: "#E3EBF1"
  neutral-300: "#CBD7E0"
  neutral-400: "#94A8B8"
  neutral-500: "#64798C"
  neutral-600: "#46596C"
  neutral-700: "#304255"
  neutral-800: "#1D2D3C"
  neutral-900: "#111D29"
  neutral-950: "#07111B"
  neutral-black: "#000000"
typography:
  display:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  metric:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333333
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  evidence:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.333333
  button:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "1rem"
    fontWeight: 640
    lineHeight: 1.38
  wordmark:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  workspace-headline:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "clamp(32px, 3vw, 40px)"
    fontWeight: 540
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  workspace-section:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "clamp(24px, 2.5vw, 32px)"
    fontWeight: 540
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  workspace-subsection:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "22px"
    fontWeight: 540
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  workspace-fact:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "18px"
    fontWeight: 700
rounded:
  photo: "4px"
  badge: "6px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "calc(infinity * 1px)"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "7": "28px"
  "8": "32px"
  "10": "40px"
  "11": "44px"
  "12": "48px"
  "16": "64px"
  "20": "80px"
  "24": "96px"
  "28": "112px"
  "32": "128px"
  "36": "144px"
components:
  button-primary:
    backgroundColor: "{colors.primary-700}"
    textColor: "{colors.neutral-white}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: "12px 20px"
  button-primary-dark:
    backgroundColor: "{colors.primary-400}"
    textColor: "{colors.secondary-950}"
  button-primary-dark-hover:
    backgroundColor: "{colors.primary-300}"
    textColor: "{colors.secondary-950}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.full}"
    padding: "12px 20px"
  input:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.secondary-950}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "12px"
  hero-composer:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.3xl}"
    padding: "16px"
  hero-composer-dark:
    backgroundColor: "{colors.secondary-800}"
    textColor: "{colors.neutral-50}"
  import-submit:
    backgroundColor: "{colors.primary-600}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.full}"
    padding: "0"
    height: "44px"
    width: "44px"
  import-submit-hover:
    backgroundColor: "{colors.primary-700}"
  source-chip:
    backgroundColor: "{colors.neutral-100}"
    textColor: "{colors.secondary-900}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "32px"
  surface-card:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  priority-selected:
    backgroundColor: "{colors.primary-700}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.xl}"
    padding: "20px"
  disclosure:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-600}"
    padding: "16px 0"
  navigation:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-950}"
  theme-switch:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.full}"
    padding: "0"
    height: "44px"
    width: "44px"
  metric-grid:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-950}"
---

# Design System: Accelerate

## Overview

**Creative North Star: "The Blue Horizon"**

Accelerate places a clear car-shopping task inside a cinematic electric-blue and deep-navy world. Soft light fields give the public landing page atmosphere; open editorial spacing and thin dividers keep its facts legible. Light mode carries that atmosphere into a bright lower body, while dark mode continues into navy surfaces with the same content and structure.

The slanted Accelerate wordmark remains the identity. Self-hosted Satoshi supplies the geometric page headlines, selective sans-serif italics and interface text; Clash Grotesk supplies the wordmark, source names and workspace section headings. Working controls, contained vehicle photography and explicit evidence labels carry the experience into Compare and Decide.

**Key Characteristics:**

- Electric-blue lighting, deep-navy framing and neutral supporting surfaces.
- Airy Satoshi editorial type with selective italic emphasis and the retained Clash Grotesk wordmark.
- A floating composer, rounded controls, flat workspaces and fine metric dividers.
- Identical light/dark structure, visible uncertainty and credited, contained vehicle photographs.

This is a source-derived record of the replacement world, superseding the former Aerotime/indigo documentation. Palette and semantic-role authority is `src/data/config/colors.js`, exported through `tailwind.config.js`; base rules live in `src/theme.css`, with this surface in `src/Dashboard.jsx`, `src/ImportComposer.jsx` and `src/dashboard.css`. The [surface brief](.impeccable/surfaces/src-dashboard-jsx.md) owns composition and mode; [PRODUCT.md](PRODUCT.md) owns product facts.

Verification boundary: the production build, theme workflow, compiled-token checks and both-mode contrast checks passed. The finish review returned **ship for its resolved source findings only**. The browser host was unavailable: no desktop, mobile or 200%-zoom screenshots exist, and neither visual fidelity nor responsive rendering has been approved. Existing Motion `use client` and bundle-chunk advisories remain. Documentation and snippets below do not imply a rendered review.

Retained drift, not system guidance: the separate legacy photo-credits HTML still hardcodes the former indigo palette. Its photographs, credits and licenses remain preserved; this documentation pass does not expand that page's scope or promote its old colors into the new system.

## Colors

There are exactly two chromatic families: Electric Blue (`primary-*`) and Deep Navy (`secondary-*`). Cool neutrals support reading, boundaries and photography. The frontmatter captures the exported palettes; semantic CSS variables select from these palettes by theme.

### Primary

- **Electric Blue:** bright middle tones create atmospheric light and the hero's circular import action. Darker tones carry readable actions and links in light mode; lighter tones carry actions and focus in dark mode.
- **Pale Blue Light:** the lightest primary tones support gradients, hover fields and selected tabs. They are supporting fields, not small-text substitutes.

### Secondary

- **Deep Navy:** the deepest tones frame the hero, horizon and dark canvas; middle tones separate dark panels and boundaries. The deepest tone also supplies light-mode reading text and dark-mode action ink.
- **Quiet Navy:** mid-light secondary tones give source names a quieter voice without introducing another hue family.

### Neutral

- **White and Cool Paper:** bright lower body, light-mode form and workspace surfaces.
- **Reading Slate:** secondary prose, placeholders and evidence, with lighter neutral counterparts in dark mode.
- **Neutral Dividers and Photo Mats:** content structure and letterboxing for contained vehicle photographs. Neutral black is a shadow ingredient.

These are the implemented theme-alias mappings; values are frontmatter token names, not a second palette.

| CSS role | Light | Dark |
| --- | --- | --- |
| `--background` | `neutral-50` | `secondary-950` |
| `--surface` | `neutral-white` | `secondary-900` |
| `--surface-raised` | `neutral-100` | `secondary-800` |
| `--surface-hover` | `primary-50` | `secondary-700` |
| `--border` / `--border-subtle` | `neutral-500` / `neutral-200` | `secondary-400` / `secondary-700` |
| `--text` / `--text-secondary` | `secondary-950` / `neutral-600` | `neutral-50` / `neutral-300` |
| `--action` / `--accent` / `--ink` | `primary-700` / `primary-700` / `neutral-white` | `primary-400` / `primary-300` / `secondary-950` |
| `--warning` / `--warning-surface` | `secondary-700` / `neutral-100` | `neutral-200` / `secondary-800` |
| `--error` / `--error-surface` | `primary-800` / `primary-50` | `primary-200` / `secondary-800` |
| `--success` / `--success-surface` | `primary-700` / `primary-50` | `primary-300` / `secondary-800` |
| `--hero-field` / `--preview-field` | `primary-50` / `neutral-100` | `secondary-900` / `secondary-900` |
| `--support-blue` / `--support-purple` | `primary-300` / `primary-700` | `primary-400` / `primary-300` |
| `--muted` / `--photo-mat` | `neutral-500` / `neutral-100` | `neutral-400` / `secondary-800` |

The legacy `--support-purple` name is a compatibility alias to blue, not authorization for a purple accent. Status roles stay inside the two-family palette and use explicit wording to communicate meaning.

**The Two Palettes Rule.** Use Electric Blue and Deep Navy for chromatic expression; supporting colors remain neutral.

**The Evidence Rule.** Express status in words as well as color, keeping provenance, warnings and unresolved values readable.

## Typography

**Display and Body Font:** self-hosted Satoshi, sans-serif fallback. **Identity and Workspace Font:** self-hosted Clash Grotesk, sans-serif fallback. Retain `/fonts/fonts.css`, the font files and licenses. Tailwind exports `--font-sans` and `--font-display`; `--font-body` aliases the former.

Page headline type is geometric and open, with normal-weight italic emphasis. The bundled variable fonts contain normal faces; `.hero-italic` deliberately enables style synthesis locally. Workspace section and evidence headings retain Clash Grotesk.

### Hierarchy

- **Display:** Satoshi medium (500), line height 1, tight tracking. The dashboard uses the standard Tailwind ramp (48px base, 60px at `sm`, 72px at `lg`); the emphasized line uses weight 400.
- **Headline:** Satoshi medium (500), leading 1.25, 36px base and 48px at `sm`, with selective blue italic emphasis.
- **Metric:** Satoshi medium (500), 48px base and 60px at `sm`, leading 1. Numbers and definitions remain real description-list content.
- **Title:** source names use Clash Grotesk semibold (600), 20px base and 24px at `sm`. The wordmark uses weight 650 and its own line height.
- **Body:** Satoshi regular (400), 16px. Base leading is 1.55; hero introduction and metric descriptions use 1.625. Hero copy caps at 32rem; longer workspace explanations retain observed 70–75ch limits.
- **Evidence and Label:** 14px evidence/helper copy, 12px compact source notes and composer chips. Evidence can use leading up to 1.7.

The new dashboard uses standard Tailwind type, spacing and radius ramps. It does not migrate every operational stylesheet: retained 18px mobile vehicle names and decision facts, 22px workspace subsections/mobile prices, 26px preview branding and 28px prices/preview headings remain contextual sizes. These are existing roles, not a new global landing scale. Compact Compare headings remain 32px desktop and 24px on phones.

The live-text wordmark uses `skewX(-9deg)` and remains the complete identity. Its current header size is 20px base and 24px at `sm`; footer and preview contexts retain their own sizes. Its home link is named “Accelerate home.”

**The Contextual Type Rule.** Satoshi leads the cinematic dashboard; Clash Grotesk retains identity, source names and established workspace headings. Preserve that implemented division when adding a surface.

## Layout

The application is full width, with content capped at 80rem and gutters of 20px base / 32px from `sm`. The header has an 80px minimum height; its measured height is exported to sticky workspace controls. It overlays the landing hero and is sticky on the workspace canvas.

The dashboard uses a 64rem hero content cap, 42rem composer, 72rem source strip and shared 80rem editorial section. Hero top padding is 128px base / 144px at `lg`, with 96px below. Other spacing uses the frontmatter's 4px-based steps. The editorial area becomes two equal columns at `lg`; its metrics retain two columns at every width with fine divider lines. The lower horizon height steps from 224px to 288px at `sm` and 320px at `lg`.

New work uses standard Tailwind breakpoints: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px and `2xl` 1536px. Header navigation hides below `lg`, with a labeled menu and an expanded row; inherited narrow-screen rules stack links below 768px. The header demo action appears at `xl`. Existing workspace rules also use 767px, 1000px and 1100px thresholds; evidence tightens at 400px.

Compare shows all contenders on larger screens and two selected contenders on phones while retaining the four-car shortlist. Keep summaries and table on the same pair, overflow inside labeled data regions, long values wrapping, and space reserved for the mobile decision bar and safe area. Theme changes preserve content structure and the shortlist.

Responsive CSS and 44px primary-control targets are implemented source rules. Desktop, mobile and 200% zoom rendering still require browser captures; this document does not certify those acceptance checks.

## Elevation & Depth

The dashboard uses layered radial/linear gradients from exported blue/navy variables. A blurred hero bloom (64px) stays behind content. This is CSS decorative media, with no new raster. Workspaces remain flat, grouped by solid tonal surfaces and fine boundaries.

### Shadow Vocabulary

- **Floating composer:** extra-large shadow (`0 20px 25px -5px rgb(4 18 34 / 0.2), 0 8px 10px -6px rgb(4 18 34 / 0.2)`) lifts the light form above the atmosphere. Dark mode uses the same geometry with neutral black at 20% opacity.
- **Dialog backdrop:** a 78% deep-navy mix separates the image dialog from its workspace.

**The Task Depth Rule.** Reserve the conspicuous lift for the floating composer and keep evidence workspaces tonally grouped and flat.

The bloom drifts over 28 seconds with `ease-in-out`, alternating a small translation and scale change. Base controls transition background/border over 160ms; theme utilities use Tailwind's standard 150ms color transition. Route entry fades over 180ms. Preview steps are manual, and deliberate in-page navigation scrolls smoothly. Reduced motion disables the bloom and smooth scrolling and minimizes transitions while preserving state feedback.

## Shapes

The floating composer uses broad corners (24px); shared cards/panels use 16px, operational controls use 12px, and the dashboard's submit, theme switch, chips and editorial action use fully rounded ends. Retained photo corners (4px) and evidence badges (6px) serve dense content.

Hero and horizon bands stay rectangular. Metrics use a two-by-two divider structure rather than four boxed cards; a small decorative diamond (8px, rotated 45 degrees) sits at the divider intersection in a theme-aware palette color. Vehicle images remain contained on a token-aware photo mat; preserve complete silhouettes and existing credits instead of cropping them into decoration.

## Components

### Buttons

Base primary buttons use semantic action/ink, 12px × 20px padding, 12px corners and a 44px minimum height. Light-mode hover retains the readable dark blue; dark mode shifts to the lighter accent. The editorial secondary action uses a fine neutral border, transparent ground, full rounding, 14px medium text and tonal hover. The hero header action uses white/navy; workspace actions use semantic roles.

Focus is a visible 3px accent outline with 4px offset unless a composite supplies its own treatment. Disabled/busy states keep wording and implemented opacity/cursor feedback. Primary actions remain at least 44px.

### Inputs / Fields

Base fields use canvas color, interactive boundary, 12px padding, 12px corners and a 48px minimum height. Placeholders use secondary text at full opacity. Invalid fields combine error boundaries with visible messages. Editable details keep labels, units, original-value context and provenance.

### Floating listing composer

The hero composer is the working import form. A white/navy container holds a link icon, transparent URL field, eBay.ca chip, shortlist limit, optional fictional-demo action and 44px circular arrow submit. This distinct submit uses Electric Blue 600/white in light mode and Electric Blue 400/navy in dark mode. Retain hover, spinner, disabled/full-shortlist state, validation, errors and live status. A 2px blue focus-within ring identifies the composite; the field keeps its accessible label and description.

### Navigation and theme

The menu bar carries the wordmark, Import / Compare / Help Me Decide, shortlist count and import action. Hero navigation uses light ink; workspace navigation uses semantic roles. Preserve `aria-current`, the labeled mobile menu, Escape-to-close and keyboard focus.

The 44px circular theme control names its destination and exposes the dark state with `aria-pressed`. Theme defaults to the system preference, persists its allowlisted preference and synchronizes across tabs. Both modes retain the navy hero; lower body and workspace surfaces change between bright neutrals and navy.

### Chips and evidence

Composer chips use neutral/navy tonal fills, full rounding and 12px text; the noninteractive eBay.ca chip is 32px tall. Workspace evidence badges retain their compact form and explicit source/state wording. Warnings, estimates and seller claims remain distinguishable in words; blue color alone carries no verification claim.

### Cards / Containers

Vehicle cards, summaries and decision matches use flat semantic surfaces, fine boundaries and 16px corners. Compact comparison cards retain their dense spacing; decision copy uses 24px base / 40px at `sm`. Selected priorities use readable dark blue/white in light mode and bright blue/navy in dark mode. Keep contained photographs and serious warnings visible.

### Compare and Decide color treatment

`WorkspaceHeading` gives both working pages a compact navy field with soft electric-blue corner lighting, Satoshi page titles and pale-blue italic emphasis. This is the dashboard atmosphere scaled to a task heading, with the existing comparison management and back action intact. On small screens actions wrap; the options menu aligns right and stays within the page gutters.

Blue identifies active workflow steps, selected comparison tabs and the selected decision priority. A check icon and `aria-pressed` also identify the priority. Comparison tables use pale-blue column headings, a quieter label column and an emphasized annual-cost or asking-price row. Vehicle prices and detail actions share the same blue ramp. All source and estimate labels stay visible.

The recommendation pairs a contained vehicle photograph with a navy explanation area in both themes. Light-blue text, source links and explicit purchase warnings remain readable on that field. Key facts use a calm blue strip; annual costs, comfort and expandable assumptions continue on the theme's reading surface below. Dark mode maps those lower surfaces to navy without changing structure. The styling is in `src/workspace.css`, imported after the dashboard styles; no new color families, imagery, motion or scoring behavior are introduced.

Verification for this extension: the existing 181-test suite, production build, shared-token checks and static UI detector pass. Source-level contrast checks cover the new navy panels and selected states. Browser and native preview hosts were unavailable, so rendered desktop, mobile and zoom checks remain unverified.

### Sources, metrics and working preview

Source names have explanatory notes. eBay.ca, NRCan, US EPA, NHTSA and Gemini are listing/reference/research inputs, not partnerships or endorsements. Metrics describe actual product facts, not invented performance claims.

The native preview disclosure retains manual Import → Compare → Decide controls, explicit fictional labels, existing credited model photographs and a real-import exit. Overview remains the default workspace tab, with Specifications and Sources & checks available through accessible tabs. Preserve tab keyboard behavior and shortlist continuity.

## Do's and Don'ts

### Do:

- **Do** use the exported electric-blue/navy palette and theme-aware semantic roles across new surfaces.
- **Do** keep the slanted Accelerate wordmark and the self-hosted Satoshi / Clash Grotesk fonts.
- **Do** keep the real listing composer, visible keyboard focus, reduced motion and explicit state wording operable.
- **Do** preserve source context, truthful product facts and credited, contained vehicle imagery on theme-aware photo mats.
- **Do** retain the same content structure in both themes and keep mobile comparison overflow local to labeled regions.
- **Do** distinguish source verification from rendered review until desktop, mobile and 200% zoom captures exist.

### Don't:

- **Don't** introduce a third chromatic family or revive the discarded indigo/lilac visual world.
- **Don't** add a separate symbol, logo badge or new raster asset beside the Accelerate wordmark.
- **Don't** represent research sources as partners or invent testimonials, customer counts or performance benchmarks.
- **Don't** hide uncertainty, convert missing data into verified facts or remove visible purchase warnings.
- **Don't** replace the working import with a static form, crop model photographs or add autoplay to the preview.
- **Don't** claim visual fidelity, responsive rendering or 200% zoom approval from source and contrast checks alone.
