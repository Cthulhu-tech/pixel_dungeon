/** A caller-owned stream of original double draws in [0, 1). No global RNG. */
interface PDRandomSource {
  nextDouble(): number;
}

/** Snapshot in the original HashMap key iteration order; keys may be null. */
interface PDRandomWeightedEntry<T> {
  readonly key: T;
  readonly weight: number;
}
