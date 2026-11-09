import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMileage, mileageDisplay } from '../src/mileage.js';

const aspect = (name, value) => ({ name, value });

test('listing mileage fields and explicit odometer statements support normal distance formats without mutation', () => {
  for (const [raw, amount, unit] of [
    ['2000 km', 2000, 'km'], ['2000kms', 2000, 'km'], ['2k kms', 2000, 'km'], ['2kkms', 2000, 'km'],
    ['120,000km', 120000, 'km'], ['120 000 kilometres', 120000, 'km'], ['75k miles', 75000, 'mi'],
    ['2.5K KMS', 2500, 'km'], ['2000miles', 2000, 'mi'], ['100 km', 100, 'km'], ['0 miles', 0, 'mi'],
  ]) {
    for (const car of [{ mileage: { raw } }, { description: `Odometer: ${raw}` }]) {
      const before = structuredClone(car), result = resolveMileage(car);
      assert.equal(result.status, 'known', raw);
      assert.equal(result.amount, amount, raw);
      assert.equal(result.unit, unit, raw);
      assert.equal(result.assumedUnit, false);
      assert.ok(result.evidence[0].quote);
      assert.deepEqual(car, before);
    }
  }
});

test('phone digits before the KM field cannot become the Accord odometer reading', () => {
  const description = 'Call or text on (555)010 0027\n\n\nKM: 155,000';
  const car = { mileage: { raw: '154865', unit: null }, itemSpecifics: [aspect('Mileage', '154865')], description };
  const before = structuredClone(car), result = resolveMileage(car);
  assert.equal(result.amount, 154865);
  assert.equal(result.unit, 'km');
  assert.equal(result.source, 'Original mileage');
  assert.equal(result.originalRaw, '154865');
  assert.ok(result.evidence.some(item => item.quote === 'KM: 155,000'));
  assert.doesNotMatch(mileageDisplay(car), /\b27\b/);
  assert.equal(resolveMileage({ description }).amount, 155000, 'without a listing field only the explicit KM label is used');
  assert.deepEqual(car, before);
});

test('dedicated listing fields win over description and title values; malformed fields allow explicit recovery', () => {
  const car = { mileage: { raw: '15819', unit: 'mi' }, description: 'Mileage: 15000 miles.', title: 'Vehicle 14000 miles' };
  assert.equal(resolveMileage(car).amount, 15819);
  assert.equal(resolveMileage(car).unit, 'mi');
  assert.equal(resolveMileage({ mileage: { raw: 'invalid' }, description: 'Oil changed 5000 km ago. Odometer 80000 km.' }).amount, 80000);
  assert.equal(resolveMileage({ description: 'Warranty 120000 km.', title: '2018 Honda Civic 75k miles' }).amount, 75000);
  assert.equal(resolveMileage({ description: 'Mileage: 5000 km', title: '2018 Honda Civic 2000km' }).amount, 5000);
  assert.equal(resolveMileage({ itemSpecifics: [aspect('Kilom\u00e9trage', '90k km')] }).amount, 90000);
});

test('service intervals, warranty limits, fuel economy, range, phone numbers and unrelated distances stay unknown', () => {
  for (const description of [
    'Oil changed 5000 km ago.', 'Warranty 120000 km. 80k miles.', 'Driven 2000 km since engine replacement.',
    'Electric range 400 km.', 'Shipping is 50 miles away.', 'Fuel consumption 6 L/100 km.',
    'Gas Mileage\n13 City\n20 Highway', 'Trip odometer: 500 km.', 'Warranty mileage: 120000 km.',
    'Mileage allowance: 10000 km/year.', 'Odometer: 5000 km ago.', 'No mileage 5000 km.',
    'Call (555) 010 0027\n\nKM:', '2016 MASERATI GT SPORT 15000 MILES CLEAN CARFAX', '2000 km',
  ]) assert.equal(resolveMileage({ description }).status, 'unknown', description);
  for (const title of ['Warranty 120000 km', 'Fuel economy 6 L/100 km', 'Shipping 500 miles']) assert.equal(resolveMileage({ title }).status, 'unknown', title);
});

test('unitless mileage readings use an explicit kilometre assumption', () => {
  for (const car of [{ mileage: { raw: '2000' } }, { description: 'Odometer: 2k.' }, { description: 'Mileage reads 2000' }]) {
    const result = resolveMileage(car);
    assert.equal(result.amount, 2000);
    assert.equal(result.unit, 'km');
    assert.equal(result.status, 'known');
    assert.equal(result.assumedUnit, true);
    assert.equal(result.evidence[0].unit, null, 'original seller evidence stays unitless');
    assert.equal(mileageDisplay(car), '2,000 km');
  }
  const maserati = resolveMileage({ mileage: { raw: '15819' }, description: '2016 MASERATI GT 15000 MILES CLEAN CARFAX' });
  assert.equal(maserati.amount, 15819);
  assert.equal(maserati.unit, 'km');
  assert.equal(maserati.assumedUnit, true, 'an unlabeled marketing number does not establish odometer units');
  assert.equal(resolveMileage({ description: 'Mileage in miles or km.', mileage: { raw: '2000' } }).assumedUnit, true);
  assert.equal(resolveMileage({ mileage: { raw: '50000' }, description: 'Odometer: 30000 miles.' }).assumedUnit, true, 'a different odometer number cannot establish the unit of the listing value');
});

test('explicit mileage-unit statements and field units can complete a supplied reading', () => {
  assert.equal(resolveMileage({ description: 'Mileage units: miles. Odometer 2k' }).unit, 'mi');
  assert.equal(resolveMileage({ mileage: { raw: '80000' }, description: 'Odometer reads 80k miles.' }).unit, 'mi');
  assert.equal(resolveMileage({ mileage: { raw: '80000' }, title: '2019 Example car 80k miles' }).unit, 'mi');
  assert.equal(resolveMileage({ itemSpecifics: [aspect('Odometer (mi)', '2k')] }).unit, 'mi');
  assert.equal(resolveMileage({ mileage: { unit: 'mi' }, description: 'Odometer: 2k' }).unit, 'mi');
  assert.equal(resolveMileage({ description: 'Mileage is in KM.', mileage: { raw: '2000' } }).unit, 'km');
  assert.equal(resolveMileage({ mileage: { raw: '90000' }, itemSpecifics: [aspect('Mileage', '90k'), aspect('Mileage unit', 'km')] }).status, 'known');
});

test('mileage displays whole kilometres for both seller readings and corrections', () => {
  assert.equal(mileageDisplay({ mileage: { raw: '75k miles' } }), '120,701 km');
  assert.equal(mileageDisplay({ mileage: { raw: '2000', unit: 'mi' } }), '3,219 km');
  assert.equal(mileageDisplay({ mileage: { raw: '2000.4 km' } }), '2,000 km');
  assert.equal(mileageDisplay({ mileage: { raw: '0 miles' } }), '0 km');
  assert.equal(mileageDisplay({ mileageOverride: { amount: 50000, unit: 'mi' } }), '80,467 km · User-entered');
});

test('conflicting structured mileage or units are not silently selected or scored', () => {
  for (const car of [
    { mileage: { raw: ['bad', '75k miles', '120000km'] } },
    { mileage: { raw: '100000' }, itemSpecifics: [aspect('Mileage', '2k kms')] },
    { itemSpecifics: [aspect('Mileage', ['2k', '3k'])] },
    { mileage: { raw: '1,000 miles', unit: 'km' } },
    { mileage: { raw: '1000', unit: ['km', 'mi'] } },
    { description: 'Odometer 80000 km. Mileage 90000 km.' },
  ]) {
    const result = resolveMileage(car);
    assert.equal(result.status, 'conflict', JSON.stringify(car));
    assert.equal(result.amount, null);
    assert.equal(result.unit, null);
    assert.equal(mileageDisplay(car), 'Conflicting mileage');
  }
  assert.equal(resolveMileage({ mileage: { raw: ['75000 miles', '120700.8 km'] } }).status, 'known', 'equivalent metric and imperial values agree');
});

test('missing and malformed readings stay unknown; hidden HTML is not evidence', () => {
  for (const description of ['No mileage supplied. Built in 2000.', 'Odometer: 1,20,000 km', 'Mileage: -2000km', 'VIN2000km', '<!--Mileage: 2000km-->', '<script>Mileage: 2000km</script>', '<template>Mileage: 2000km</template>', '<img alt="Mileage: 2000km">']) {
    assert.equal(resolveMileage({ description }).status, 'unknown', description);
  }
  assert.equal(mileageDisplay({}), 'Unknown');
  assert.equal(resolveMileage({ description: '<script>Mileage: 2000 miles</script><p>Odometer: 2k&nbsp;<b>kms</b></p>' }).unit, 'km');
});
