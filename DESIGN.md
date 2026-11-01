---
name: Core
description: Blue-black vehicle comparison with a compact overview and progressive detail.
colors:
  background: "#080f1a"
  surface: "#101c2d"
  surface-raised: "#182a42"
  surface-hover: "#20354f"
  border: "#526f90"
  text: "#f3f7fd"
  text-secondary: "#afc1d7"
  action: "#339cfc"
  accent: "#5cb4fc"
  ink: "#080f1a"
  warning: "#f4c66c"
  warning-surface: "#332613"
  error: "#ff9ca9"
  error-surface: "#381626"
  success: "#86d9b7"
  success-surface: "#12322c"
  photo-mat: "#e5ebf2"
typography:
  display:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "clamp(40px, 5.2vw, 72px)"
    fontWeight: 540
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "clamp(32px, 3vw, 40px)"
    fontWeight: 540
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  title:
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
  section:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "22px"
    fontWeight: 540
  card:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "20px"
    fontWeight: 540
  compact-card:
    fontFamily: "Clash Grotesk, sans-serif"
    fontSize: "18px"
    fontWeight: 540
  price:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "28px"
    fontWeight: 700
  photo-caption:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  control: "8px"
  card: "12px"
  panel: "16px"
  badge: "6px"
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

# Design System: Core

## Direction

The Clear Comparison Workspace. The approved 31 October 2026 refinement replaces purple fields with blue-black surfaces and makes Compare easier for a first-time shopper. Preserve the Core identity, self-hosted Clash Grotesk headings, Satoshi interface text, honest evidence labels and contained vehicle photography.

The app name is Core. Use the original user-supplied artwork at `public/images/brand/core-logo.png` in the header, footer, product preview, photo-credit page and browser icon. The shared `public/brand.css` frames its central icon without modifying the image pixels. Brand links use the accessible name Core home; the adjacent image is decorative because Core is already visible in text.

Use navy-black ground, quieter navy surfaces and a raised blue surface for selection. Blue actions use dark ink. Near-white primary text and blue-gray secondary text meet normal-text contrast on every main surface. Amber, rose and mint retain their warning, error and success meanings. Thin boundaries establish grouping; no decorative shadows or glass panels. The shared subdued boundary is #2b405a; interactive borders use the stronger named border token.

## Compare hierarchy

A compact heading and shortlist controls precede a sticky tab toolbar. Overview is the default; Specifications and Sources & checks reveal deeper material. Help me decide remains in the desktop toolbar and a safe-area-aware mobile bottom bar. Only one of these action locations is displayed at each breakpoint.

Add car opens an inline import form and focuses its input. Empty comparisons show the form immediately. Successful additions collapse it, select Overview and reveal the new contender. Four-car shortlists explain how to make room. Clearing and saved-reference maintenance live in Comparison options. Notices remain visible when the import form is collapsed.

Compact summaries show uncropped photos, name, price, mileage, location, research status, removal and View details. Important warnings remain visible alongside selected cars. A shortlist-wide concern count also accounts for cars outside the mobile pair. Do not turn a missing value into zero, installed equipment or a verified claim.

Overview compares only available transmission, fuel, seating, body and verified fuel-consumption details. Compact source links lead to the relevant vehicle's evidence. Specifications retains complete supported fields, source labels, assumptions, estimates and context exclusions. Sources & checks selects one vehicle and exposes original evidence, model research, raw seller specifics, description and mileage reasoning, with detailed material expandable. Nested evidence does not repeat the source-status/research-control block.

## Responsive behavior

Use 32px outer gutters on desktop and 20px below 768px. The existing content cap is 1440px. All contenders appear on desktop and tablet. Phones show two selected cars side by side, with First car and Second car selectors for larger shortlists; choosing the other selected car swaps the pair. One-car lists use one column.

The table and summaries use the same selected pair. Keep table semantics explicit when rows adopt a mobile grid. Long names wrap. Horizontal overflow must stay local to a labeled region; the page itself must not scroll sideways. Preserve the existing larger photo presentation in Decide and model previews on Import.

Sticky offsets derive from the actual header height. Reserve space for the mobile action bar and device safe area. Evidence scrolling clears both the header and Compare toolbar. Keep primary controls at least 44px high and retain visible keyboard focus and usability at 200% zoom.

## Interaction and motion

Tabs support arrow keys, Home, End, roving focus, selected state and linked panels. Keep tab, evidence vehicle and mobile pair in React memory across stage navigation. Removal reconciles selected IDs to remaining contenders; clearing resets the workspace. No new browser storage is introduced.

Use the existing Motion library for short opacity transitions between tabs and on card insertion/removal. Target 150-250ms and avoid repeated animation when background data updates. The landing preview remains manual. Native smooth scrolling serves deliberate in-page navigation; route changes start immediately at the top. Reduced motion suppresses spatial movement and scrolling animation while keeping state and completion feedback visible.

## Verification record

The browser connection was unavailable. Native Chrome inspection was then stopped by the computer-use runtime because it could not determine the current URL confidently enough to enforce policy. No desktop, tablet, mobile or 200% zoom screenshot approval is claimed. Rendered React interaction checks cover the journey, tab keyboard controls, correct evidence focus, pair switching, persistence, import errors, removal and async safety. All 144 regression tests, contrast checks and the production build passed. Existing Motion bundler directive warnings remain. The Impeccable scan raised type-ramp advisories; compact sizes were consolidated and the retained roles documented. Visual verification remains a recapture item.

### Completing vehicle details

Sources & checks contains an inline Edit details & confirm configuration disclosure, opened when materially different references remain. A labeled native select presents reference market, model, engine, transmission, drive and record ID. Responsive labeled fields state numeric units and keep imported values as placeholders. Save refreshes enrichment without reimporting; Reset restores the original import. User-entered, government-reference and unverified-estimate labels retain distinct provenance. The compact overview includes supported fuel/energy use with its test source; no new dashboard panels or persistent listings are introduced. Unitless mileage displays km (assumed).
