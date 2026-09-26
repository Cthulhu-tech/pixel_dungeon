/*
 * Derived from Pixel Dungeon / PD-classes Random.java.
 * Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later; see LICENSE.txt.
 * Source: watabou/PD-classes@c0b690a4163020963e70a58a7d4f27965dc8f134
 * Changes: instance-owned injected draws; TypeScript; explicit JVM number semantics.
 */
import { toJavaInt } from './numbers.ts';

/** Ports scalar overloads and float-array chances, not a new PRNG algorithm. */
export class JavaRandom {
  private readonly source: PDRandomSource;

  constructor(source: PDRandomSource) {
    this.source = source;
  }

  float(): number {
    return Math.fround(this.source.nextDouble());
  }

  floatTo(max: number): number {
    return Math.fround(this.source.nextDouble() * Math.fround(max));
  }

  floatBetween(min: number, max: number): number {
    const lower = Math.fround(min);
    const width = Math.fround(Math.fround(max) - lower);
    return Math.fround(lower + this.source.nextDouble() * width);
  }

  /** max must be a Java int. Non-positive max consumes NO draw in the original. */
  intTo(max: number): number {
    return max > 0 ? toJavaInt(this.source.nextDouble() * max) : 0;
  }

  /** min/max are signed 32-bit integers; both original int operations can wrap. */
  intBetween(min: number, max: number): number {
    const width = (max - min) | 0;
    return (min + toJavaInt(this.source.nextDouble() * width)) | 0;
  }

  intRange(min: number, max: number): number {
    const width = (max - min + 1) | 0;
    return (min + toJavaInt(this.source.nextDouble() * width)) | 0;
  }

  normalIntRange(min: number, max: number): number {
    const width = (max - min + 1) | 0;
    const value = (this.source.nextDouble() + this.source.nextDouble()) * width / 2;
    return (min + toJavaInt(value)) | 0;
  }

  /** Preserves float accumulation, strict comparison and the source bounds error. */
  weightedIndex(weights: readonly number[]): number {
    let sum = this.floatAt(weights, 0);
    for (let i = 1; i < weights.length; i++) {
      sum = Math.fround(sum + this.floatAt(weights, i));
    }
    const value = this.floatTo(sum);
    sum = this.floatAt(weights, 0);
    for (let i = 0; i < weights.length; i++) {
      if (value < sum) return i;
      // The Java source reads i + 1 even on the last iteration. Do not "fix" it.
      sum = Math.fround(sum + this.floatAt(weights, i + 1));
    }
    return 0;
  }

  private floatAt(values: readonly number[], index: number): number {
    const value = values[index];
    if (value === undefined) throw new RangeError(`Java float[] index ${index} outside length ${values.length}`);
    return Math.fround(value);
  }
}
