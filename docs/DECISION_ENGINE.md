# Core decision engine

The shared experience resolver supplies running costs and comfort before research completes. Applicable sourced information takes precedence over model estimates and general baselines. Estimates contribute to provisional rankings; the selected priority never switches to a different category. See [ENRICHMENT.md](ENRICHMENT.md) for request, cache and fallback behavior.

The current architecture, source limitations, deterministic worked example, beginner-friendly Java comparisons, four-minute demonstration outline and review checklist are documented in [REVIEW.md](REVIEW.md).

`src/decision-engine.js` exposes pure `rankCars` and `rankDecisionMode` functions. Relative purchase/performance factors and absolute comfort/space ratings are weighted and added. Comfort and energy gaps receive labeled estimates; other missing factors are excluded and remaining weights are renormalized. Ties share the recommendation. Coverage measures sourced scoring weight, not availability or accuracy. Estimates keep a result provisional even when all factors have values.

The six mode IDs (`value`, `cost`, `practical`, `performance`, `comfort`, `balanced`) remain. Affordability weighs asking price 80% and annual fuel/charging cost 20%, including mixed powertrains under the displayed scenario. Comfort weighs ride 35%, quietness 30%, seat cushioning 25% and heating 10%. Front/rear cushioning count equally when rear seats exist; unresolved heating receives a neutral 2.5/5 allowance. Passenger and cargo space belong to Practicality, alongside seating needs, body preference and daily-use notes. Brand, price and gadget counts do not establish ride refinement. Mechanical warnings remain separate from capability scores; genuine identity/configuration conflicts remain excluded from rankings.

See `tests/vehicle-evidence.test.mjs`, `tests/decision-engine.test.mjs` and `tests/decision-dashboard.test.mjs` for executable examples. Run `npm test` and `npm run build` before review. No API key, source dataset or scoring logic makes an accident, ownership, repair-cost or insurance claim.
