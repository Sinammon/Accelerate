---
name: Accelerate
description: A familiar blue home dashboard with compact, evidence-led car-shopping workspaces.
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
  import-headline:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "72px"
    fontWeight: 500
    lineHeight: 1
  import-headline-phone:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "48px"
    fontWeight: 500
    lineHeight: 1
  workspace-headline:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
  section:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "22px"
  fact:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "18px"
    fontWeight: 650
  body:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  interface:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "14px"
  evidence:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "12px"
  button:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "16px"
    fontWeight: 640
    lineHeight: 1.38
  wordmark:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "24px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.04em"
rounded:
  photo: "4px"
  control: "8px"
  surface: "12px"
  inherited-card: "16px"
  composer: "24px"
  full: "calc(infinity * 1px)"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-700}"
    textColor: "{colors.neutral-white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-dark:
    backgroundColor: "{colors.primary-400}"
    textColor: "{colors.secondary-950}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.control}"
    padding: "12px"
  hero-composer:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.composer}"
    padding: "16px"
  car-management:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.surface}"
    padding: "16px"
  source-chip:
    backgroundColor: "{colors.neutral-100}"
    textColor: "{colors.secondary-900}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "32px"
  metric-grid:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-950}"
  tab-selected:
    backgroundColor: "{colors.primary-50}"
    textColor: "{colors.primary-700}"
    typography: "{typography.interface}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  priority-selected:
    backgroundColor: "{colors.primary-700}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  recommendation:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.secondary-950}"
    rounded: "{rounded.surface}"
  disclosure:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-600}"
    typography: "{typography.interface}"
    padding: "12px 0"
---

# Design System: Accelerate

## Overview

**Creative North Star: "The Clear Shortlist"**

Accelerate pairs its restored blue home dashboard with compact task workspaces. Electric blue identifies actions and selection; deep navy anchors text and dark-theme surfaces. White and pale surfaces, fine dividers and restrained spacing keep comparisons and evidence easy to scan.

The slanted Accelerate wordmark and self-hosted Satoshi/Clash Grotesk pairing retain the identity. Brand expression comes through typography, palette and useful vehicle photographs. The user restored the previous home dashboard: navy hero with electric-blue lighting, floating composer, bright editorial section, source strip and matching horizon. Its atmosphere is isolated to the home route; Compare, Recommendation and Costs remain calm working screens without a left sidebar.

**Key Characteristics:**

- Compact hierarchy, flat surfaces and explicit selected states.
- Satoshi interface text with the retained Clash Grotesk wordmark.
- Progressive disclosure for explanation without hiding trade-offs or warnings.
- Theme-aware evidence labels and contained, credited vehicle photography.

Source authority: `src/data/config/colors.js` and `tailwind.config.js` define palettes and semantic theme roles. `src/theme.css` supplies foundations; `src/app.css` imports `src/compact.css` last in the component layer to define current density and composition. `src/workspace.css` has been removed. The [dashboard brief](.impeccable/surfaces/src-dashboard-jsx.md) owns the restored home and retained Operate flow; [PRODUCT.md](PRODUCT.md) owns product and data truth.

Verification, 5 November 2026: all 198 tests passed and the production build passed with 497 modules. The follow-up source reviewer confirmed the two narrow-layout corrections: the Cars menu anchors inside the phone viewport, and the restored landing uses its original icon-only Add car control below sm. The detector returned no findings for this refinement. Existing Motion use-client and large-chunk advisories remain. Browser/native access is unavailable, so actual image sizing, desktop/phone fit and 200% zoom remain unverified; this is not rendered approval.

## Colors

Exactly two chromatic families remain: Electric Blue (`primary-*`) and Deep Navy (`secondary-*`), supported by cool neutrals. Frontmatter records the exported palette; the source semantic roles choose the correct member for each theme.

### Primary

- **Electric Blue:** readable actions, active navigation, focus and selected priorities. Pale blue supports light-theme selection fields.

### Secondary

- **Deep Navy:** light-theme reading text and dark-theme canvas/surfaces. It frames the home hero and horizon, and supplies structure to compact working screens.

### Neutral

- **White and Cool Paper:** light-theme working surfaces and canvas.
- **Reading Slate:** supporting text, labels and evidence.
- **Neutral Dividers and Photo Mats:** table boundaries and complete vehicle silhouettes.

| CSS role | Light token | Dark token |
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
| `--photo-mat` | `neutral-100` | `secondary-800` |

Legacy `--hero-field`, `--preview-field` and `--support-purple` aliases remain source compatibility names, not permission to restore the old hero or introduce purple. The separate photo-credits HTML retains historical indigo styling outside this change; its existing photographs, credits and licenses remain preserved.

**The Semantic Surface Rule.** Pair surface and text roles from the same theme; do not reintroduce fixed navy panels beneath theme-dependent dark text.

**The Evidence Rule.** State warnings, uncertainty and provenance in words as well as color.

## Typography

Self-hosted Satoshi is the working interface family. Clash Grotesk supplies the slanted wordmark and retained supporting contexts. Preserve `/fonts/fonts.css`, bundled font files and licenses. `--font-sans` and `--font-display` remain the source aliases; `--font-body` uses Satoshi.

### Hierarchy

The compact ramp is 12/14/16/18/22/24px. Evidence and notes use the smallest role; tables, tabs, names and concise reasons use the interface role. Body copy uses regular weight and the base line height. Cost totals use the fact role; section/match titles use the section role; page titles use the workspace headline role. The restored home uses Satoshi 48px/60px/72px display headings, 36px/48px editorial headings and 48px/60px metrics. These home roles stay separate from the compact working type ramp.

The wordmark retains `skewX(-9deg)`, tight tracking and an accessible home link. It reduces to 22px below 768px. Workspace page headings use Satoshi bold; a legacy heading stylesheet must not override that division. Supporting prose keeps observed 65-75ch reading limits where relevant. Use tabular numerals for prices, quantities and cost totals.

**The Compact Hierarchy Rule.** Use the documented compact roles; reserve larger display and metric type for the restored home dashboard.

## Layout

The home route uses the previous full-width dashboard composition, overlaid navigation, a 64rem hero content cap, a 42rem working composer, source strip and 80rem editorial section. It has no sidebar. The hero and horizon retain their existing blue atmosphere in both themes.

Compare, Recommendation and Costs use a centered single-column workspace capped at 1280px, with 24px desktop and 16px phone gutters. The compact header has a 64px minimum height, navigation, Cars menu, theme switch and Add car. Below 768px, actions and navigation wrap into labeled rows. No left shortlist rail or phone shortlist disclosure remains.

Compare retains two selected contenders on phones while preserving all four in the Cars menu. Each column starts with a 144px-high photograph, reduced to 104px on phones; centered object-fit: contain preserves complete silhouettes and intrinsic proportions. Photo cycling, missing-image fallback and source labels remain supported. Costs keeps all contenders in locally scrolling tables with sticky row labels.

These responsive source rules do not establish verified desktop, phone or zoom rendering.

## Elevation & Depth

Current workspaces are flat. Solid semantic surfaces, one-pixel boundaries, selected fields and restrained hierarchy establish grouping. The restored home retains its blue bloom, floating-composer soft shadow and horizon. These atmospheric treatments stay off the working screens. Image dialogs retain a modal backdrop (`color-mix(in srgb, var(--text) 72%, transparent)`) rather than decorative lift.

Controls transition background/border over 160ms. Route entry and comparison-panel fades use 180ms. Deliberate navigation may scroll smoothly; reduced motion disables smooth scrolling and minimizes transitions while preserving focus and state feedback. No decorative motion is required to complete a task.

**The Task Depth Rule.** Use tonal separation and boundaries for working content; reserve overlay depth for an actual dialog or menu.

## Shapes

The intentional compact system uses 8px corners for navigation, tabs, priority selectors and compact import controls, and 12px corners for the Cars menu and recommendation container. The home composer uses 24px corners and rounded chips. Vehicle thumbnails retain 4px corners. Inherited base fields, evidence containers and dialogs may retain 12px/16px source radii; do not apply a broad global reset to these retained contexts. Vehicle photographs use contain sizing and semantic mats, preserving the whole car and its credits.

## Components

### Buttons

Primary actions use semantic action/ink and the base button typography, with a minimum 44px target. Compact actions use the control corner role. Secondary controls use transparent or raised surfaces with readable text and tonal hover. Disabled and busy controls retain explicit wording and cursor/opacity feedback. Focus uses a visible 3px accent outline with 4px offset unless a composite provides its own treatment.

### Inputs / Fields

The listing input has a visible label, 48px minimum height, compact corners, canvas fill and interactive boundary. It sits beside an Add car button, stacking on phones. Preserve validation, full-shortlist/busy states, alert errors and live status. Cost and configuration fields retain labels, units, estimate/source hints and invalid-state messages. Missing costs read Incomplete rather than zero.

### Navigation and tabs

Selected top navigation uses `aria-current`, accent text and a semantic hover field. Comparison tabs are Overview, Specifications and Sources & checks. Recommendation tabs are Summary, Ranking & evidence and Assumptions; Costs tabs are Summary, Purchase, Running costs and Salary guide. Tab controls have a 44px minimum height, selected accent/field treatment and visible focus. Arrow keys, Home and End move selection and focus; panels have stable labels. Cost summary shortcuts focus the destination tab. Tab choices and selected recommendation contender survive route navigation in App memory.

### Cars menu

The working-screen header has a Cars count disclosure with every contender, removal controls and links to selected-car Sources & checks. Escape closes the menu and returns focus to its summary. Removal focuses another remove control or the menu summary; the last removal resets private calculator inputs. This menu replaces the left sidebar.

### Home dashboard

Dashboard.jsx and HeroImportComposer.jsx restore the previous hero, floating URL composer, research-source strip, editorial metrics, fictional walkthrough and blue horizon. Import remains functional with validation, full-list status, loading feedback, demo access and the shared shortlist. The larger display typography and atmosphere are specific to this route.

### Comparison table

Each car column begins with a contained, proportionally scaled vehicle photo and a Details action. Overview has six rows: asking price, mileage, annual fuel/charging cost, Comfort (ride/seats), Practicality (passenger/cargo room) and horsepower. Dense values use interface text with smaller explicit evidence labels. Specifications retains all supported details; Sources & checks retains photos, source selection, original listing location/mileage, configuration editing, warnings, seller specifics and safe plain-text description. Keep local overflow within a labeled keyboard-focusable data region.

### Recommendation

All six priorities are visible. The Summary card holds the vehicle photograph, match status, short explanation, two compact reasons and a full-explanation/model-context disclosure. The trade-off and purchase warnings remain separate and visible. Detailed facts and experience sources use another disclosure; Ranking & evidence retains comparison and citations; Assumptions retains scenario inputs and scoring explanation. Affordability links to Costs beside its explanation. Browsing contenders and switching tabs preserve the shopper's context without changing the ranking engine.

### Costs

Cash/Finance controls stay above the four cost tabs. Summary separates upfront funding from monthly running expenses, then links to editable Purchase, Running costs and Salary guide. Expanded assumptions share valid driving/energy changes with Compare and Recommendation. All-car tables preserve source/estimate wording, fixed row labels and editable amounts. Cash purchase savings remain separate from expenses; Finance includes loan payments with a separately funded down payment. Private salary and overrides live only in App memory across navigation and research updates, resetting when the shortlist is cleared.

## Do's and Don'ts

### Do:

- **Do** use semantic palette roles in both themes.
- **Do** keep the compact type ramp, 8px controls and 12px main surfaces intentional and consistent.
- **Do** retain complete vehicle photographs and existing attribution.
- **Do** keep trade-offs, warnings and estimate labels visible while disclosing longer explanations.
- **Do** preserve keyboard focus, source access and the shared shortlist across task views.

### Don't:

- **Don't** add a left shortlist sidebar or carry the home's atmospheric hero into the working screens.
- **Don't** replace evidence wording with color alone or imply individual condition is verified.
- **Don't** treat source checks, test passes or CSS breakpoints as rendered desktop, phone or zoom approval.
- **Don't** add new identity assets, palette families or decorative raster work to this compact system.

The home restoration and Compare-photo update passed all 198 tests and the production build. Browser/native access remains unavailable; no new screenshots or rendered approval are claimed.
