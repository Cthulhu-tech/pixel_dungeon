/** A caller-owned stream of original double draws in [0, 1). No global RNG. */
interface PDRandomSource {
  nextDouble(): number;
}
