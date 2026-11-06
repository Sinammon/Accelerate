export const emptyComparisonView = () => ({ tab: 'overview', pair: [], sourceId: null, importOpen: false });

// UI state stays in memory with the shortlist, including when leaving Compare.
export function reconcileComparisonView(view, cars, addedId) {
  const ids = cars.map(car => car.legacyItemId);
  if (!ids.length) return emptyComparisonView();
  const pair = [...new Set((view.pair || []).filter(id => ids.includes(id)))];
  for (const id of ids) if (pair.length < 2 && !pair.includes(id)) pair.push(id);
  if (addedId && ids.length > 1) {
    pair[0] = pair.find(id => id !== addedId) || ids.find(id => id !== addedId);
    pair[1] = addedId;
  }
  return { ...view, tab: addedId ? 'overview' : view.tab, importOpen: addedId ? false : !!view.importOpen, pair: pair.slice(0, 2), sourceId: ids.includes(view.sourceId) ? view.sourceId : ids[0] };
}
