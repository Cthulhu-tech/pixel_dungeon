/*
 * Derived from Pixel Dungeon / PD-classes Random.java.
 * Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later; see LICENSE.txt.
 * Source: watabou/PD-classes@c0b690a4163020963e70a58a7d4f27965dc8f134
 * Changes: instance-owned injected draws; TypeScript; explicit JVM number semantics.
 */
import { toJavaInt } from './numbers.ts';

/** Ports the original random wrapper; collection order is supplied by its owner. */
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

  /** Caller supplies the original Collection.toArray() order, not a JS Set policy. */
  collectionIndex(values: readonly unknown[]): number {
    // Unlike Int(max), the original index(empty) still consumes one draw.
    return toJavaInt(this.source.nextDouble() * values.length);
  }

  oneOf<T>(...values: T[]): T {
    return this.elementAt(values, toJavaInt(this.source.nextDouble() * values.length));
  }

  element<T>(values: readonly T[]): T {
    return this.elementWithin(values, values.length);
  }

  /** max is an original signed Java int, deliberately not clamped to array length. */
  elementWithin<T>(values: readonly T[], max: number): T {
    return this.elementAt(values, toJavaInt(this.source.nextDouble() * max));
  }

  collectionElement<T>(values: readonly T[]): T | null {
    return values.length > 0 ? this.elementAt(values, this.intTo(values.length)) : null;
  }

  /** Entries MUST follow the original map keySet().toArray() order. */
  weightedKey<T>(entries: readonly PDRandomWeightedEntry<T>[]): T | null {
    let sum = 0;
    for (let i = 0; i < entries.length; i++) {
      sum = Math.fround(sum + Math.fround(this.elementAt(entries, i).weight));
    }
    const value = this.floatTo(sum);
    // An empty HashMap fails AFTER the draw, unlike the float[] overload.
    sum = Math.fround(this.elementAt(entries, 0).weight);
    for (let i = 0; i < entries.length; i++) {
      if (value < sum) return this.elementAt(entries, i).key;
      sum = Math.fround(sum + Math.fround(this.elementAt(entries, i + 1).weight));
    }
    return null;
  }

  /** Mutates the caller-owned runtime array using the source's forward shuffle. */
  shuffle<T>(values: T[]): void {
    for (let i = 0; i < values.length - 1; i++) {
      const j = this.intBetween(i, values.length);
      if (j !== i) this.swap(values, i, j);
    }
  }

  shufflePair<U, V>(first: U[], second: V[]): void {
    for (let i = 0; i < first.length - 1; i++) {
      const j = this.intBetween(i, first.length);
      if (j !== i) {
        // Order matters: first is already mutated if second has an invalid index.
        this.swap(first, i, j);
        this.swap(second, i, j);
      }
    }
  }

  private swap<T>(values: T[], i: number, j: number): void {
    const previous = this.elementAt(values, i);
    values[i] = this.elementAt(values, j);
    values[j] = previous;
  }

  private elementAt<T>(values: readonly T[], index: number): T {
    const value = values[index];
    // Java arrays can contain null, but neither undefined nor sparse JS holes.
    if (value === undefined) throw new RangeError(`Java array index ${index} outside populated length ${values.length}`);
    return value;
  }

  private floatAt(values: readonly number[], index: number): number {
    const value = values[index];
    if (value === undefined) throw new RangeError(`Java float[] index ${index} outside length ${values.length}`);
    return Math.fround(value);
  }
}
