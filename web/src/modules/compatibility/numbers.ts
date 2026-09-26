/** Java narrowing double/float -> int: truncation, saturation and NaN -> 0. */
export function toJavaInt(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value >= 2147483647) return 2147483647;
  if (value <= -2147483648) return -2147483648;
  // Java int has no negative zero; JS Math.trunc does.
  return Math.trunc(value) + 0;
}
