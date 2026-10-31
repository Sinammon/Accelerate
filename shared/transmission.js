// Automatic is a broad seller category; CVT and automated manuals are subtypes.
export function normalizeTransmission(value) {
  const text = String(value ?? '').trim();
  if (/\b(?:e?cvt|continuously variable)\b|^AV\d*$/i.test(text)) return 'CVT';
  if (/\b(?:dual[- ]clutch|automated manual|DCT)\b|^AM\d+$/i.test(text)) return 'Dual-clutch / automated manual';
  if (/\bautomatic\b|^A(?:S)?\d+$/i.test(text)) return 'Automatic';
  if (/\bmanual\b|^M\d+$/i.test(text)) return 'Manual';
  return null;
}

export function compatibleTransmission(a, b, left = {}, right = {}) {
  if (a == null || b == null) return true;
  if (left.code && right.code && left.code !== right.code) return false;
  if (left.speeds != null && right.speeds != null && left.speeds !== right.speeds) return false;
  for (const [value, other, constraints] of [[a, b, left], [b, a, right]]) {
    const codeType = normalizeTransmission(constraints.code);
    if (codeType && [value, other].some(type => type !== 'Automatic' && type !== codeType)) return false;
    if (constraints.conventional && other !== 'Automatic') return false;
    // A stated fixed-gear automatic must not silently become a CVT.
    if (value === 'Automatic' && other === 'CVT' && constraints.speeds != null) return false;
  }
  const subtype = value => ['CVT', 'Dual-clutch / automated manual'].includes(value);
  return a === b || (a === 'Automatic' && subtype(b)) || (b === 'Automatic' && subtype(a));
}
