/*
 * Derived from PD-classes PathFinder.java, Copyright (C) 2012-2015 Oleg Dolya.
 * GPL-3.0-or-later; see LICENSE.txt.
 * Source: watabou/PD-classes@c0b690a4163020963e70a58a7d4f27965dc8f134.
 * Changes: instance-owned buffers, readonly queries and explicit Java array failures.
 */
import { toJavaInt } from '../compatibility/index.ts';
import { readGridFlag } from './mask.ts';

const UNREACHABLE = 2147483647;

export class GridPathFinder {
  private size = 0;
  private distances = new Int32Array(0);
  private goals = new Uint8Array(0);
  private queue = new Int32Array(0);
  private directions: readonly number[] = [];

  constructor(width: number, height: number) {
    this.setMapSize(width, height);
  }

  /** Positive integer dimensions are required by this module's public contract. */
  setMapSize(width: number, height: number): void {
    const size = width * height;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || size > 2147483647) {
      throw new RangeError('PathFinder requires positive int32 map dimensions and area');
    }
    // Deliberate source behavior: equal AREA does not recompute width-dependent dirs.
    if (this.size === size) return;
    this.size = size;
    this.distances = new Int32Array(size);
    this.goals = new Uint8Array(size);
    this.queue = new Int32Array(size);
    this.directions = [-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1];
  }

  distanceAt(cell: number): number {
    return this.readNumber(this.distances, cell);
  }

  /** Explicit detached projection; changing it cannot mutate the pathfinding owner. */
  copyDistanceMap(): Int32Array {
    return this.distances.slice();
  }

  find(from: number, to: number, passable: PDGridPassability): number[] | null {
    if (!this.buildPathMap(from, to, passable)) return null;
    const path: number[] = [];
    let cell = from;
    do {
      cell = this.nextTowards(cell);
      path.push(cell);
    } while (cell !== to);
    return path;
  }

  getStep(from: number, to: number, passable: PDGridPassability): number {
    return this.buildPathMap(from, to, passable) ? this.nextTowards(from) : -1;
  }

  getStepBack(current: number, threat: number, passable: PDGridPassability): number {
    const distance = this.buildEscapeMap(current, threat, passable);
    for (let i = 0; i < this.size; i++) this.goals[i] = this.distanceAt(i) === distance ? 1 : 0;
    if (readGridFlag(this.goals, current)) return -1;
    this.distances.fill(UNREACHABLE);
    let tail = 0;
    for (let i = 0; i < this.size; i++) {
      if (readGridFlag(this.goals, i)) {
        this.enqueue(tail++, i);
        this.writeDistance(i, 0);
      }
    }
    return this.search(current, passable, tail) ? this.nextTowards(current) : -1;
  }

  buildDistanceMap(to: number, passable: PDGridPassability, limit: number): void {
    this.distances.fill(UNREACHABLE);
    this.enqueue(0, to);
    this.writeDistance(to, 0);
    let head = 0;
    let tail = 1;
    while (head < tail) {
      const step = this.readNumber(this.queue, head++);
      const next = this.distanceAt(step) + 1;
      if (next > limit) return;
      tail = this.expand(step, next, passable, tail, null);
    }
  }

  private buildPathMap(from: number, to: number, passable: PDGridPassability): boolean {
    // Preserve the previous distance buffer when from == to, as the source does.
    if (from === to) return false;
    this.distances.fill(UNREACHABLE);
    this.enqueue(0, to);
    this.writeDistance(to, 0);
    return this.search(from, passable, 1);
  }

  private search(from: number, passable: PDGridPassability, initialTail: number): boolean {
    let head = 0;
    let tail = initialTail;
    while (head < tail) {
      const step = this.readNumber(this.queue, head++);
      if (step === from) return true;
      tail = this.expand(step, this.distanceAt(step) + 1, passable, tail, from);
    }
    return false;
  }

  private buildEscapeMap(current: number, threat: number, passable: PDGridPassability): number {
    this.distances.fill(UNREACHABLE);
    let destinationDistance = UNREACHABLE;
    this.enqueue(0, threat);
    this.writeDistance(threat, 0);
    let head = 0;
    let tail = 1;
    let distance = 0;
    while (head < tail) {
      const step = this.readNumber(this.queue, head++);
      distance = this.distanceAt(step);
      if (distance > destinationDistance) return destinationDistance;
      if (step === current) destinationDistance = (toJavaInt(Math.fround(Math.fround(distance) * 2)) + 1) | 0;
      tail = this.expand(step, distance + 1, passable, tail, null);
    }
    return distance;
  }

  private expand(step: number, next: number, passable: PDGridPassability, tail: number, from: number | null): number {
    for (const offset of this.directions) {
      const cell = step + offset;
      // Do not add an x-boundary/corner check or deduplicate `from`: not in source.
      if (cell === from || (cell >= 0 && cell < this.size && readGridFlag(passable, cell) && this.distanceAt(cell) > next)) {
        this.enqueue(tail++, cell);
        this.writeDistance(cell, next);
      }
    }
    return tail;
  }

  private nextTowards(cell: number): number {
    let minimum = this.distanceAt(cell);
    let best = cell;
    for (const offset of this.directions) {
      const neighbor = cell + offset;
      const distance = this.distanceAt(neighbor);
      if (distance < minimum) {
        minimum = distance;
        best = neighbor;
      }
    }
    return best;
  }

  private enqueue(index: number, cell: number): void {
    // JS typed arrays silently discard out-of-bounds writes; Java throws instead.
    if (index < 0 || index >= this.queue.length) throw new RangeError('Java path queue bounds');
    this.queue[index] = cell;
  }

  private writeDistance(cell: number, distance: number): void {
    if (cell < 0 || cell >= this.size) throw new RangeError('Java distance bounds');
    this.distances[cell] = distance;
  }

  private readNumber(values: Int32Array, index: number): number {
    const value = values[index];
    if (value === undefined) throw new RangeError('Java int[] bounds');
    return value;
  }

}
