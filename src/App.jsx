import React, { useEffect, useRef, useState } from 'react';
import { readImportResponse } from './import-response.js';
import { LazyMotion, domAnimation, m, MotionConfig, useReducedMotion } from 'motion/react';
import DecisionDashboard from './DecisionDashboard.jsx';
import OwnershipCalculator from './OwnershipCalculator.jsx';
import { createOwnershipState } from './ownership-calculator.js';
import VehicleComparison from './VehicleComparison.jsx';
import Dashboard from './Dashboard.jsx';
import ImportComposer from './ImportComposer.jsx';
import ThemeSwitch from './ThemeSwitch.tsx';
import { ThemeProvider } from './ThemeProvider.jsx';
import Icon from './Icons.jsx';
import Brand from './Brand.jsx';
import CarManagement from './CarManagement.jsx';
import { enrichVehicle } from './enrichment.js';
import { mergeResearch } from '../shared/model-specs.js';
import { modelSpecCache } from './spec-cache.js';
import { makeDemoCars } from './demo-cars.js';
import { emptyComparisonView, reconcileComparisonView } from './comparison-view.js';
import { DEFAULT_SCENARIO } from '../shared/experience.js';
import { validateDetailOptions } from './vehicle-overrides.js';
import { extractVehicleSpecs } from './vehicle-specs.js';
import { matchSpecCatalog } from './spec-catalog.js';
import { referenceMarket } from './reference-market.js';

const route = () => ['compare', 'decide', 'ownership'].includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'import';
function Application() {
  const reduced = useReducedMotion();
  // One owner keeps the shortlist and private calculator inputs in memory across pages.
  const [cars, setCars] = useState([]);
  const [comparisonView, setComparisonView] = useState(emptyComparisonView);
  const [page, setPage] = useState(route);
  const [mode, setMode] = useState('value');
  const [decisionView, setDecisionView] = useState({ tab: 'summary', selectedId: null });
  const [ownershipTab, setOwnershipTab] = useState('summary');
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [ownership, setOwnership] = useState(createOwnershipState);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef(null);
  const enrichmentTasks = useRef(new Set());
  useEffect(() => {
    const ids = new Set(cars.map(car => car.legacyItemId));
    setOwnership(previous => {
      const entries = Object.entries(previous.vehicles).filter(([id]) => ids.has(id));
      return entries.length === Object.keys(previous.vehicles).length ? previous : { ...previous, vehicles: Object.fromEntries(entries) };
    });
  }, [cars]);
  useEffect(() => () => { for (const controller of enrichmentTasks.current) controller.abort(); }, []);
  useEffect(() => {
    const onHashChange = () => setPage(route());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    setMenuOpen(false);
    document.querySelector('main h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);
  useEffect(() => {
    const header = document.querySelector('.site-header');
    const update = () => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    update();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(header);
    return () => observer?.disconnect();
  }, []);
  function navigate(next) { window.location.hash = next; setPage(next); }
  function startImport() {
    if (page === 'compare') setComparisonView(previous => ({ ...previous, importOpen: true }));
    else navigate('import');
    requestAnimationFrame(() => {
      document.getElementById('listing-url')?.focus({ preventScroll: true });
      document.getElementById('listing-url')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' });
    });
  }
  function removeCar(id, focusInComparison = false) {
    for (const controller of enrichmentTasks.current) if (controller.vehicleId === id) controller.abort();
    const remaining = cars.filter(car => car.legacyItemId !== id);
    setCars(remaining);
    setComparisonView(previous => reconcileComparisonView(previous, remaining));
    setDecisionView(previous => previous.selectedId === id ? { ...previous, selectedId: null } : previous);
    setNotice('Car removed. You can add a replacement.');
    if (!remaining.length) {
      setOwnership(createOwnershipState());
      setOwnershipTab('summary');
      setDecisionView({ tab: 'summary', selectedId: null });
    }
    requestAnimationFrame(() => {
      const target = focusInComparison
        ? document.querySelector('.car-card.pair-visible .compare-remove') || document.querySelector('.compare-remove') || document.getElementById('listing-url') || document.querySelector('.compare-add')
        : document.querySelector('.car-management[open] .managed-car-remove') || document.querySelector('.car-management > summary') || document.querySelector('.nav-button');
      target?.focus();
    });
  }
  function clearCars() {
    for (const controller of enrichmentTasks.current) controller.abort();
    setCars([]); setOwnership(createOwnershipState()); setOwnershipTab('summary');
    setDecisionView({ tab: 'summary', selectedId: null }); setComparisonView(emptyComparisonView());
    setNotice('Comparison cleared.');
    requestAnimationFrame(() => document.getElementById('listing-url')?.focus());
  }
  function showSources(car) {
    setComparisonView(previous => ({ ...previous, tab: 'sources', sourceId: car.legacyItemId }));
    navigate('compare');
    requestAnimationFrame(() => document.querySelector('.vehicle-summary')?.focus());
  }
  function enrichImported(imported) {
    const controller = new AbortController();
    controller.vehicleId = imported.legacyItemId;
    controller.researchController = new AbortController();
    enrichmentTasks.current.add(controller);
    const apply = (enrichment, { domain = 'complete' } = {}) => {
      if (controller.signal.aborted) return;
      setCars(current => current.map(item => {
        if (item !== imported && item.enrichmentToken !== controller) return item;
        const previous = item.enrichment || {};
        const update = domain === 'vin' || domain === 'catalog' || domain === 'complete' ? { vin: enrichment.vin, fuel: enrichment.fuel, factorySpecs: enrichment.factorySpecs, catalog: enrichment.catalog, catalogRows: enrichment.catalogRows }
          : { modelSpecs: mergeResearch(previous.modelSpecs, enrichment.modelSpecs), specsStatus: enrichment.specsStatus };
        if (domain === 'initial') { update.factorySpecs = enrichment.factorySpecs; update.vin = enrichment.vin; update.catalog = enrichment.catalog; }
        if (domain !== 'vin' && domain !== 'complete' && controller.researchController.signal.aborted) return item;
        return { ...item, enrichmentToken: controller, enrichment: { ...previous, ...update, status: domain === 'complete' ? 'complete' : 'loading-model' } };
      }));
    };
    void enrichVehicle(imported, { signal: controller.signal, researchSignal: controller.researchController.signal, onUpdate: apply }).then(value => apply(value, { domain: 'complete' })).catch(() => {}).finally(() => enrichmentTasks.current.delete(controller));
  }
  function retryResearch(car) {
    for (const previous of enrichmentTasks.current) if (previous.vehicleId === car.legacyItemId) {
      if (previous.kind === 'research') previous.abort(); else previous.researchController?.abort();
    }
    const controller = new AbortController();
    controller.kind = 'research'; controller.vehicleId = car.legacyItemId;
    const owner = car.enrichmentToken;
    enrichmentTasks.current.add(controller);
    const apply = (enrichment, { domain = 'specs' } = {}) => {
      if (controller.signal.aborted || domain === 'vin') return;
      setCars(current => current.map(item => (item === car || owner && item.enrichmentToken === owner) ? { ...item, enrichment: { ...item.enrichment, modelSpecs: mergeResearch(item.enrichment?.modelSpecs, enrichment.modelSpecs), specsStatus: enrichment.specsStatus, status: enrichment.specsStatus === 'verifying' || enrichment.specsStatus === 'loading-quick' ? 'loading-model' : 'complete' } } : item));
    };
    void enrichVehicle(car, { signal: controller.signal, onUpdate: apply, skipVin: true, force: true }).then(apply).catch(() => {}).finally(() => enrichmentTasks.current.delete(controller));
  }
  function saveVehicleDetails(car, specOverrides, catalogSelection, detailOptions) {
    const choices = validateDetailOptions(detailOptions);
    const source = { ...car, specOverrides, ...choices, enrichment: { vin: car.enrichment?.vin } };
    const specs = extractVehicleSpecs(source).specs;
    const candidates = car.enrichment?.catalogRows || car.enrichment?.catalog?.candidates || [];
    if (catalogSelection && !matchSpecCatalog(specs, candidates, catalogSelection, referenceMarket(source, specs)).selectedId) catalogSelection = undefined;
    for (const controller of enrichmentTasks.current) if (controller.vehicleId === car.legacyItemId) controller.abort();
    const edited = { ...source, catalogSelection, enrichmentToken: undefined, enrichment: { vin: car.enrichment?.vin, status: 'loading-model' } };
    setCars(current => current.map(item => item.legacyItemId === car.legacyItemId ? edited : item));
    setNotice('Details saved. Specifications are being checked for this configuration.');
    enrichImported(edited);
  }
  function loadDemo() {
    if (cars.length || loading) return;
    const demo = makeDemoCars().map(car => ({ ...car, enrichment: { status: 'loading' } }));
    setCars(demo);
    setComparisonView(reconcileComparisonView(emptyComparisonView(), demo));
    demo.forEach(enrichImported);
    setError(''); setNotice('Fictional demo loaded. No eBay request was made.');
    navigate('compare');
  }
  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || cars.length >= 4) return;
    setError(''); setNotice('');
    let id;
    try {
      const parsed = new URL(url.trim());
      if (!['ebay.ca', 'www.ebay.ca', 'm.ebay.ca'].includes(parsed.hostname)) throw new Error();
      id = parsed.pathname.match(/\/(\d{9,15})\/?$/)?.[1];
    } catch { setError('Paste a full eBay.ca vehicle listing URL.'); return; }
    if (id && cars.some(car => car.legacyItemId === id)) { setError('That car is already in your comparison.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim() }), cache: 'no-store', signal: AbortSignal.timeout(70000) });
      const data = await readImportResponse(response);
      const imported = { ...data.vehicle, enrichment: { status: 'loading' } };
      setCars(previous => previous.some(car => car.legacyItemId === imported.legacyItemId) ? previous : [...previous, imported].slice(0, 4));
      setComparisonView(previous => reconcileComparisonView(previous, [...cars, imported].slice(0, 4), imported.legacyItemId));
      enrichImported(imported);
      setUrl(''); setNotice('Listing imported. Compare the available seller details below.');
      navigate('compare');
    } catch (err) { setError(err.name === 'TimeoutError' ? 'eBay took too long to respond. Please try again.' : err instanceof TypeError ? 'Could not connect to Accelerate. Please check your connection and try again.' : err.message); }
    finally { setLoading(false); }
  }
  const importForm = <ImportComposer cars={cars} page={page} url={url} setUrl={setUrl} loading={loading} error={error} notice={notice} onSubmit={handleSubmit} onDemo={loadDemo} />;
  const enter = { initial: { opacity: reduced ? 1 : 0 }, animate: { opacity: 1 }, transition: { duration: reduced ? 0 : 0.18 } };
  return <LazyMotion features={domAnimation} strict><MotionConfig reducedMotion="user"><div className={`site-shell app-shell ${page === 'import' ? 'landing-shell' : 'compact-workspace'}`}>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <header className="site-header" onKeyDown={event => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuToggle.current?.focus(); } }}>
      <Brand />
      <nav id="primary-navigation" className={menuOpen ? 'is-open' : ''} aria-label="Main navigation">{[['compare', 'Compare'], ['decide', 'Recommendation'], ['ownership', 'Costs']].map(([id, label]) => <a className="nav-link" key={id} href={`#${id}`} aria-current={page === id ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav>
      <div className="header-actions">{page !== 'import' && <CarManagement cars={cars} onRemove={removeCar} onDetails={showSources} />}<ThemeSwitch overHero={page === 'import'} /><button className={page === 'import' ? 'nav-button size-11 p-0 sm:h-auto sm:w-auto sm:px-4' : 'nav-button'} aria-label="Add car" type="button" disabled={cars.length >= 4 || loading} onClick={() => { setMenuOpen(false); startImport(); }}><span className={page === 'import' ? 'hidden sm:inline' : undefined}>Add car</span><Icon name="link" size={16} /></button><button className="nav-menu-toggle" type="button" ref={menuToggle} aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(open => !open)}><Icon name={menuOpen ? 'close' : 'menu'} size={20} /></button></div>
    </header>
    <div className={page === 'import' ? 'dashboard-layout' : 'workspace-layout'}>
    <main id="main-content" tabIndex={-1}><m.div key={page} className="page-transition" {...enter}>
      {page === 'import' && <Dashboard importForm={importForm} onStart={startImport} onShowCosts={() => { if (cars.length) { setMode('cost'); navigate('decide'); } else requestAnimationFrame(() => document.getElementById('how-it-works')?.scrollIntoView({ block: 'center', behavior: reduced ? 'instant' : 'smooth' })); }} />}
      {page === 'compare' && <VehicleComparison importLoading={loading} scenario={scenario} setScenario={setScenario} onSaveDetails={saveVehicleDetails} cars={cars} view={comparisonView} onViewChange={setComparisonView} notice={notice} retryResearch={retryResearch} clearSavedSpecs={() => { modelSpecCache.clear(); setNotice('Saved model specifications cleared. Your current comparison is unchanged.'); }} importForm={importForm} navigate={navigate} removeCar={removeCar} clearCars={clearCars} />}
      {page === 'decide' && <DecisionDashboard ownership={ownership} scenario={scenario} setScenario={setScenario} cars={cars} retryResearch={retryResearch} mode={mode} setMode={next => { setMode(next); setDecisionView(previous => ({ ...previous, selectedId: null })); }} view={decisionView} onViewChange={setDecisionView} />}
      {page === 'ownership' && <OwnershipCalculator cars={cars} scenario={scenario} setScenario={setScenario} state={ownership} setState={setOwnership} tab={ownershipTab} onTabChange={setOwnershipTab} />}
    </m.div></main>
    </div>
    {page === 'import' && <footer><Brand className="footer-brand" /><span>A clearer road to your next car.</span><span>Temporary comparison · Refresh clears your cars</span></footer>}
  </div></MotionConfig></LazyMotion>;
}

export default function App() {
  return <ThemeProvider><Application /></ThemeProvider>;
}
