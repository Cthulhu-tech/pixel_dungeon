/** Preserve Java boolean[] failure instead of silently treating missing cells as false. */
export function readGridFlag(values: PDGridPassability, index: number): boolean {
  const value = values[index];
  if (value === undefined) throw new RangeError('Java boolean[] bounds');
  return Boolean(value);
}
