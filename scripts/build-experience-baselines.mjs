// Reproducible offline medians; no network or AI needed by this generator.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const buckets = new Map();
const bodyClass = value => /pickup/i.test(value) ? 'pickup' : /van/i.test(value) ? 'van' : /sport utility|SUV/i.test(value) ? 'suv' : 'car';
function add(year, body, type, fuel, litres, electricity) {
  for (const band of ['all', String(Math.floor(year / 10) * 10)]) for (const shape of ['all', body]) {
    const key = [type, fuel, shape, band].join('|');
    const bucket = buckets.get(key) || { litres: [], electricity: [] };
    if (litres > 0 && litres <= 60) bucket.litres.push(litres);
    if (electricity > 0 && electricity <= 100) bucket.electricity.push(electricity);
    buckets.set(key, bucket);
  }
}
for (const folder of ['fuel', 'catalog']) for (const name of readdirSync(new URL(`public/data/${folder}/`, root)).filter(n => /^\d{4}\.json$/.test(n))) {
  const data = JSON.parse(readFileSync(new URL(`public/data/${folder}/${name}`, root), 'utf8'));
  for (const values of data.rows) {
    const row = Object.fromEntries(data.columns.map((key, i) => [key, values[i]]));
    if (folder === 'fuel') {
      const fuel = ({ X: 'gasoline', Z: 'gasoline', D: 'diesel', E: 'ethanol' })[row.fuel];
      if (fuel) add(Number(row.year), bodyClass(row.vehicleClass), 'liquid', fuel, Number(row.combined), 0);
    } else {
      const type = row.atvType === 'EV' ? 'electric' : /plug-in/i.test(row.atvType) ? 'phev' : /hybrid/i.test(row.atvType) ? 'hybrid' : 'liquid';
      const fuel = type === 'electric' ? 'electricity' : /gasoline/i.test(row.fuelType1) ? 'gasoline' : /diesel/i.test(row.fuelType1) ? 'diesel' : /ethanol/i.test(row.fuelType1) ? 'ethanol' : null;
      if (fuel) add(Number(row.year), bodyClass(row.VClass), type, fuel, type !== 'electric' && Number(row.comb08) > 0 ? 235.214583 / Number(row.comb08) : 0, ['electric', 'phev'].includes(type) ? Number(row.combE) / 1.609344 : 0);
    }
  }
}
const median = numbers => {
  if (!numbers.length) return null;
  numbers.sort((a, b) => a - b);
  const i = Math.floor(numbers.length / 2);
  return Math.round((numbers.length % 2 ? numbers[i] : (numbers[i - 1] + numbers[i]) / 2) * 100) / 100;
};
const result = Object.fromEntries([...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => [key, { litres: median(values.litres), electricity: median(values.electricity), count: Math.max(values.litres.length, values.electricity.length) }]));
const target = new URL('src/experience-baselines.json', root);
writeFileSync(target, JSON.stringify(result) + '\n');
console.log(`Generated ${Object.keys(result).length} offline consumption groups in ${fileURLToPath(target)}`);
