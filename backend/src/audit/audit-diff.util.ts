import { FieldChange } from './schemas/audit-log.schema';

export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, FieldChange> {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: Record<string, FieldChange> = {};

  for (const key of keys) {
    const oldValue = before[key] ?? null;
    const newValue = after[key] ?? null;

    if (oldValue !== newValue) {
      diff[key] = { de: oldValue, para: newValue };
    }
  }

  return diff;
}
