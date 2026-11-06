---
version: 1
slug: "ownership"
primary_target: "src/OwnershipCalculator.jsx"
related_targets: ["src/compact.css", "src/ownership.css", "src/ownership-calculator.js", "src/WorkspaceTabs.jsx", "src/App.jsx", "src/DecisionDashboard.jsx"]
---

# Ownership calculator

Mode: Operate. Route: #ownership, labeled Costs in the shared header and linked from the Affordability explanation.

## Direction contract

THESIS: Separate purchase funding and actual running expenses, then explain a salary-based budget without treating purchase savings as bills. Keep the default view compact with editable detail one tab away.

OWN-WORLD: Extend the compact electric-blue/navy semantic workspace, retained self-hosted fonts, flat tables, labeled inputs and explicit evidence wording. Satoshi carries compact headings; the shared slanted Clash Grotesk wordmark remains. No new identity or imagery. src/compact.css defines current density over src/ownership.css; removed src/workspace.css is not current authority.

STORY: Open Costs from the header or Affordability. Start with Cash, read the Summary, then edit Purchase or Running costs and use Salary guide. Finance is optional. Shared driving/energy assumptions stay available in a disclosure; purchase savings remain a separate optional disclosure.

FIRST VIEWPORT: Shared header and sticky shortlist beside a compact heading, Cash/Finance controls and Summary, Purchase, Running costs and Salary guide tabs. Summary separates upfront money, running expenses and the applicable monthly total, with shortcuts to editable sections. The other tabs retain all-car comparisons and the salary guide. Tables overflow locally with sticky row labels. On phones the shortlist collapses above the task; the source rules do not establish verified screen fit.

FORM: User-approved tabbed costs inside the compact Operate replacement. Intentional 8px controls and 12px primary surfaces; compact type roles from DESIGN.md. Seed: none (brief-pinned).

FINISH: The implementation ends with an independent finish review, bounded verdict, DESIGN.md and sidecar, with existing raster provenance preserved. No new raster is produced.

## Constraints

Cash remains the default. Its salary guide covers running costs and separately identifies the upfront purchase amount. Finance adds fixed-rate loan payments with a separately funded down payment. Purchase savings never enter expense/salary totals. All assumptions remain editable planning estimates. Insurance begins with the dated FSRA June 2026 Ontario average ($2,218 annually), explicitly not a personal vehicle quote. No model-specific repair forecast, lending or tax assessment is implied.

Valid driving and energy edits update the shared Compare/Recommendation scenario. Salary, per-car overrides and invalid drafts remain private React-memory state owned by App. They survive navigation and research updates, reset when the shortlist is cleared, and disappear on refresh. Selected cost tab and recommendation contender persist across navigation. Summary shortcuts change the active cost tab and focus its destination. Preserve calculations, rankings, source disclosures and all-car tables; no backend, storage or deployment changes.

## Verification evidence - 5 November 2026

- Source authority: src/OwnershipCalculator.jsx, src/ownership-calculator.js, src/ownership.css, src/compact.css, src/WorkspaceTabs.jsx, route/state ownership in src/App.jsx, and Affordability entry in src/DecisionDashboard.jsx.
- Final full suite: npm test passed 198/198; npm run build passed with 496 modules. Existing Motion use-client and >500kB chunk advisories remain. These supersede the historical 4 November totals; no old test count is a current gate.
- The detector ran once for the compact implementation. Its 8px-corner and 36px/28px-heading advisories are intentional approved system choices captured in DESIGN.md and the sidecar.
- Independent finish verdict: ship for two resolved source findings only, covering the removed legacy low-contrast navy panels and programmatic cost-tab destination focus. It is not a whole-surface rendered approval.
- Browser/native hosts were unavailable. No screenshots exist; actual 1366x768 fit, phone rendering, whole-surface contrast and 200% zoom remain unverified. Existing photograph credits are preserved; no new raster work was required.
