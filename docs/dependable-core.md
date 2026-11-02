# Make Core dependable: specifications first, ownership costs next

## Shipped foundation

Core resolves listing evidence, compatible VIN records, government configuration references, reviewed manufacturer references and optional AI gap filling. Original seller data stays intact. Corrections and configuration confirmations live only in React memory with the temporary shortlist.

The EPA index contains 36,596 US reference configurations across 1995–2027. The existing NRCan snapshot covers Canadian fuel references. Each EPA year file retains original record IDs and a download hash; the manifest retains the source, market, retrieval timestamp and original units. Rebuild with `python scripts/update-epa.py`. This index supplies configuration and consumption data; it does not supply horsepower, torque, curb weight, trim equipment or condition. It is not a complete global vehicle catalog.

Matching starts with year/make/model, including named model subvariants, then filters compatible engine, transmission, drive, fuel, body and explicitly supplied original market. A listing location is never an original-market claim. Common values may fill gaps; different configurations require confirmation. Automatic includes CVT and automated-manual subtypes unless explicit fixed-gear/code constraints disagree. Manual remains distinct. A previous confirmation cannot override changed incompatible details.

Compare keeps the compact overview. View details opens Sources & checks, where **Edit details & confirm configuration** offers the variant question, original market, identity and supported specifications. Each numeric input states its unit. Saving cancels previous work and runs enrichment for the new configuration without importing again. Reset restores the original import. Original evidence is still visible below user-entered values. Corrections are claims, not independent verification.

Numeric research and editorial insights use separate requests; numeric updates appear first. `/api/model-specs` accepts optional `domain: "specs" | "insights"`; omitting it preserves combined behavior. AI estimates remain explicitly unverified, with assumptions. Conflicting configurations stay unresolved. CVT gear count and battery-electric cylinders/displacement are not applicable. US EPA consumption retains original US mpg or kWh/100 mi alongside converted metric units. Canadian fuel-cost scoring still requires the existing exact NRCan match; US and Canadian test procedures are not silently substituted.

Mileage prefers dedicated odometer fields, followed by explicit mileage statements. If a mileage amount has no supported unit, Core assumes kilometres and displays **km (assumed)**. Original evidence remains unitless. Missing readings stay unknown; contradictory readings/units stay unresolved. Phone numbers, maintenance intervals and unrelated marketing distances never supply an odometer reading. Explicit miles override the default assumption.

Model-cache keys include resolved configuration and the catalog version. Only allowed model data is persisted; no VINs, listing text, mileage, seller, prices or override objects. Old catalog-version entries are ignored. Useful values survive quota/outages; configuration confirmation, editing and manual completion are available recovery paths.

## Verification and limits

`npm run test:catalog` measures 53 representative confirmed US configurations: older cars, Accord, Maserati, Z3, luxury cars, SUVs, pickups, hybrids, plug-in hybrids and EVs, without VINs. `npm run test:catalog:live` adds optional free-tier estimates. Coverage, source/estimate/manual counts and numeric correctness are reported separately. Raw EPA displacement/cylinders are the independent numeric audit; this does not validate AI power, torque, weight or seating. Separate regression tests cover ambiguous engines, markets, incompatible identities/VINs, edits, reset, outages and research API selection. No manual entries are pre-filled to inflate coverage.

The first live run on 1 November 2026 populated 510/660 applicable essentials (77.3%): 370 sourced, 140 estimated, zero manual. 25 requests returned partial estimates and 28 were rate limited. The 84 raw-record numeric checks had no mismatches. **The 90% availability target was not met in this quota-limited run.** Population is not proof of correctness. Expanded source coverage and a rate-limited re-evaluation remain necessary before claiming 90%. No paid fallback is enabled.

Browser access was unavailable during implementation. Rendered interaction regressions and build checks cover behavior; a visual check at phone/tablet/desktop sizes and 200% zoom remains outstanding.

The final local catalog-only run populated 373/660 essentials (56.5%). Both reported live eBay imports still resolve without fuel/transmission mismatches: Accord CVT/Gasoline, 154,865 km with seller unit evidence; Maserati Automatic/Gasoline, 15,819 km with the requested unit assumption. Both retain a reference-configuration choice rather than silently choosing a source market. The Impeccable file detector reported no findings, but ran regex rules only; browser-based contrast/layout rules were unavailable.

## Ownership context added on 2 November 2026

Affordability now explains insurance, servicing and repairs, taxes and purchase fees, financing, parking/charging, and depreciation/resale. Each contender shows its asking price and any supported NRCan fuel scenario, including an explicitly labeled monthly average. Insurance requires a personal quote; missing costs stay unavailable. Applicable model-level ownership notes retain citations and condition limits. A direct action opens and focuses the existing editable fuel assumptions. General guidance links to FSRA (Ontario insurance), CAA and FCAC. This adds budgeting context without inventing premiums or repair forecasts or changing ranking weights.

## Next: full ownership-cost calculator (not implemented)

Start with an editable country/province, currency, ownership horizon, annual distance, purchase price and fuel/energy scenario. Keep each assumption and its date/source visible. Show low/central/high scenarios instead of false precision. Include acquisition taxes/fees, fuel or electricity, user-entered insurance or an explicitly labeled estimate, scheduled maintenance, a repair reserve and estimated resale proceeds. Do not treat an insurance estimate as a quote or a generic maintenance assumption as a model-specific failure forecast.

Calculate total cash ownership cost as purchase price + acquisition charges + running expenses − resale proceeds. Do not add depreciation again when purchase price and resale are already counted. Optional financing interest belongs in cash expenses; principal is already included in purchase price. Separate one-time acquisition charges from annual expenses. Mark unknown categories as incomplete, not zero. Compare identical horizons and distance assumptions. Model-specific maintenance and resale assumptions need independent dated sources and ranges. Preserve manual corrections and explain which assumptions change the comparison.

## Later: authorized history and risk (not implemented in this release)

Separate model/year recall campaigns from verified VIN-specific outstanding recall status. NHTSA model campaigns do not establish whether this particular car is affected or repaired. Canadian recall support needs Transport Canada manufacturer/model matching and an authorized VIN-status source where available.

Define a provider-neutral history adapter with provenance, authorization scope, retrieval date, coverage and explicit unavailable/no-record states. Use only an authorized history integration or a report the shopper supplies. Never scrape paid reports, activate a paid provider, infer no accidents from empty data, or imply a VIN decoder verifies accident history. Show reported accidents, title/registration events and seller disclosures as distinct evidence classes. Mechanical condition, repair quality, odometer accuracy and maintenance still need seller documentation and an independent inspection. Risk signals inform review; they do not certify a vehicle as safe or accident-free.
