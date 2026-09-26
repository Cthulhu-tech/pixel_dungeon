/** A source dereference boundary, not a fallback for an unattached effect. */
export function statusTarget(target: PDBuffTarget | null): PDBuffTarget {
  if (target === null) throw new TypeError('Original status effect requires an attached target');
  return target;
}
export function resistanceDuration(target: PDBuffTarget, duration: number,
  port: PDStatusResistancePort): number {
  const resistance = port.resistance(target);
  return resistance === null ? Math.fround(duration) :
    Math.fround(Math.fround(resistance.durationFactor()) * Math.fround(duration));
}
