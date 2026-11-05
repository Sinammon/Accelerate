// Dataset preference is separate from evidence of the vehicle's original market.
export function sellerMarket(car) {
  const country = typeof car.location === 'string' ? car.location.split(',').at(-1).trim() : car.location?.country;
  if (/^(?:CA|CAN|Canada)$/i.test(country || '')) return 'CA';
  if (/^(?:US|USA|United States(?: of America)?)$/i.test(country || '')) return 'US';
  return undefined;
}

export function referenceMarket(car, specs) {
  return car.referenceMarket || specs?.market?.value || sellerMarket(car);
}
