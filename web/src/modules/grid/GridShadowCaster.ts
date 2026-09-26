/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / mechanics/ShadowCaster.java.
 * Changes: instance scratch storage, caller-owned visibility and explicit float32 steps.
 */
import { readGridFlag } from './mask.ts';

// Original algorithm bound, not a new quality setting or gameplay balance knob.
const MAX_DISTANCE = 8;

export class GridShadowCaster {
  private readonly width: number;
  private readonly height: number;
  private readonly rounding: readonly (Int32Array | null)[];
  private readonly obstacles = new ShadowObstacles();

  constructor(width: number, height: number) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new RangeError('ShadowCaster requires positive integer dimensions');
    }
    this.width = width;
    this.height = height;
    // Derived once by the original algorithm, not an authored configuration table.
    const rounding: (Int32Array | null)[] = [null];
    for (let i = 1; i <= MAX_DISTANCE; i++) {
      const row = new Int32Array(i + 1);
      for (let j = 1; j <= i; j++) row[j] = Math.min(j, Math.round(i * Math.cos(Math.asin(j / (i + 0.5)))));
      rounding.push(row);
    }
    this.rounding = rounding;
  }

  castShadow(x: number, y: number, fieldOfView: Uint8Array, distance: number, losBlocking: PDGridPassability): void {
    const limits = this.rounding[distance];
    // Original invalid-radius lookup fails before clearing the supplied output.
    if (limits === undefined) throw new RangeError('Java rounding bounds');
    fieldOfView.fill(0);
    this.markVisible(fieldOfView, y * this.width + x);
    if (limits === null) {
      this.obstacles.reset();
      return;
    }
    const sector: PDShadowSector = { x, y, fieldOfView, distance, losBlocking, limits };
    this.scanSector(sector, 1, 1, 0, 0);
    this.scanSector(sector, -1, 1, 0, 0);
    this.scanSector(sector, 1, -1, 0, 0);
    this.scanSector(sector, -1, -1, 0, 0);
    this.scanSector(sector, 0, 0, 1, 1);
    this.scanSector(sector, 0, 0, -1, 1);
    this.scanSector(sector, 0, 0, 1, -1);
    this.scanSector(sector, 0, 0, -1, -1);
  }

  private scanSector(sector: PDShadowSector, m1: number, m2: number, m3: number, m4: number): void {
    const obstacles = this.obstacles;
    obstacles.reset();
    for (let p = 1; p <= sector.distance; p++) {
      const half = Math.fround(0.5 / p);
      const limit = sector.limits[p];
      if (limit === undefined) throw new RangeError('Java limits bounds');
      for (let q = 0; q <= limit; q++) {
        const x = sector.x + q * m1 + p * m3;
        const y = sector.y + p * m2 + q * m4;
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          const center = Math.fround(q / p);
          const lower = Math.fround(center - half);
          const upper = Math.fround(center + half);
          const cell = y * this.width + x;
          if (!(obstacles.isBlocked(center) && obstacles.isBlocked(lower) && obstacles.isBlocked(upper))) {
            this.markVisible(sector.fieldOfView, cell);
          }
          // Even an already hidden blocking cell contributes its interval.
          if (readGridFlag(sector.losBlocking, cell)) obstacles.add(lower, upper);
        }
      }
      obstacles.nextRow();
    }
  }

  private markVisible(output: Uint8Array, cell: number): void {
    if (cell < 0 || cell >= output.length) throw new RangeError('Java fieldOfView bounds');
    output[cell] = 1;
  }
}

/** Source obstacle intervals: merge only the current row; test only completed rows. */
class ShadowObstacles {
  private readonly lower = new Float32Array(Math.trunc((MAX_DISTANCE + 1) ** 2 / 2));
  private readonly upper = new Float32Array(this.lower.length);
  private length = 0;
  private limit = 0;

  reset(): void {
    this.length = 0;
    this.limit = 0;
  }

  add(lower: number, upper: number): void {
    if (this.length > this.limit && lower <= this.at(this.upper, this.length - 1)) {
      this.upper[this.length - 1] = upper;
    } else {
      if (this.length >= this.lower.length) throw new RangeError('Java obstacle bounds');
      this.lower[this.length] = lower;
      this.upper[this.length++] = upper;
    }
  }

  isBlocked(angle: number): boolean {
    for (let i = 0; i < this.limit; i++) {
      if (angle >= this.at(this.lower, i) && angle <= this.at(this.upper, i)) return true;
    }
    return false;
  }

  nextRow(): void {
    this.limit = this.length;
  }

  private at(values: Float32Array, index: number): number {
    const value = values[index];
    if (value === undefined) throw new RangeError('Java obstacle bounds');
    return value;
  }
}
