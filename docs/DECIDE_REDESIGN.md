# Focused Help me decide

Five priorities are visible: Best Value, Affordability, Comfort, Practicality and Performance. Balanced stays inside the ranking engine for compatibility and is not a UI choice. Unsupported presentation modes normalize to Best Value.

## Six-item contract

Each selected-car result has one list with at most six information items, counting its overview, trade-off and consolidated purchase warning. Warning labels have a reserved slot and are never dropped for optional strengths. Photo/identity, match status and navigation controls are outside the count. Provenance and uncertainty accompany the relevant item. Missing evidence produces fewer points rather than filler.

Best Value leads with validated model guidance, an applicable reviewed profile or supported configuration context, and clearly identifies unavailable overview data. It then prioritizes asking-price context, supported standouts and ownership concerns. Comfort selects ride, seat cushioning/support, cabin quietness and heating. Practicality selects passenger/cargo room, seating and everyday usability. Performance selects supported acceleration, power-to-weight and engine output. Affordability selects purchase price, annual running total, energy, insurance and maintenance. All trade-offs are category-specific. General model benefits and reliability briefs are not appended to every mode.

## Navigation and source authority

The result has no Summary/Ranking/Assumptions tabs, extra fact grid or general detail disclosure. Previous/Next preserves contender browsing. Sources & checks opens and focuses the displayed car in Compare; full model advice, citations, warnings, configuration editing, seller evidence and optional recall lookup remain there. Adjust costs opens and focuses Running costs; Adjust practical needs opens Compare Overview assumptions and focuses seating. Existing shared state preserves valid edits and private inputs.

Presentation selection and budgeting live in `src/decision-summary.js`; rendering lives in `src/DecisionDashboard.jsx`; App owns navigation and shared state. Existing category-tagged research and structured ratings/specifications supply category facts. No new provider request or keyword-based classification is added.

## Scoring and validation

The five priorities retain their existing ranking formulas, comparable-evidence rules, provisional estimates and purchase-warning safeguards. Acceleration metrics/methods are not mixed, power-to-weight does not establish a quicker car without compatible acceleration evidence, and missing costs never become zero. The internal Balanced calculation is unchanged.

Regression tests cover the inclusive cap, model overview attribution, category leakage, grouped warnings, missing data, research updates, citations, cost overrides, unchanged winners and navigation to the correct car and assumptions. Run `npm test` and `npm run build`. The design detector returned no findings. Computer Use stopped browser input because it could not confidently determine the current Chrome URL; DOM checks do not establish rendered desktop, phone or 200% zoom approval.
