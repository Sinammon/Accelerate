import { CONFIG_FIELDS, MODEL_SPEC_FIELDS, modelSpecsInput, modelFieldValue } from '../shared/model-specs.js';

export function validateOverrides(raw, identity) {
  const result = {};
  for (const [field, value] of Object.entries(raw || {})) {
    if (value === '' || value == null) continue;
    if (!CONFIG_FIELDS.includes(field) && !MODEL_SPEC_FIELDS.includes(field)) throw new Error('Unsupported vehicle detail.');
    if (MODEL_SPEC_FIELDS.includes(field)) {
      result[field] = modelFieldValue(field, value);
      if (result[field] == null) throw new Error(`Check the value and unit for ${field}.`);
    } else result[field] = typeof value === 'string' ? value.trim() : value;
  }
  if (!modelSpecsInput({ ...identity, ...result, fields: [] })) throw new Error('Enter a valid year, make and model.');
  if (result.year != null) result.year = Number(result.year);
  return result;
}
