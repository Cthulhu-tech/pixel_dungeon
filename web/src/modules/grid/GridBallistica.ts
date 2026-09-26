/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / mechanics/Ballistica.java.
 * Changes: instance-owned trace and injected query-only world view; no global Actor/Level.
 */
import { readGridFlag } from './mask.ts';

export class GridBallistica {
  private readonly width: number;
  private readonly trace: Int32Array;
  private traceDistance = 0;

  constructor(width: number, height: number) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new RangeError('Ballistica requires positive integer dimensions');
    }
    this.width = width;
    this.trace = new Int32Array(Math.max(width, height));
  }

  get distance(): number {
    return this.traceDistance;
  }

  traceAt(index: number): number {
    const cell = this.trace[index];
    if (cell === undefined) throw new RangeError('Java trace bounds');
    return cell;
  }

  /** Full detached buffer, including the source's stale tail; distance marks active data. */
  copyTrace(): Int32Array {
    return this.trace.slice();
  }

  cast(from: number, to: number, magic: boolean, hitChars: boolean, world: PDBallisticaWorld): number {
    const width = this.width;
    const x0 = from % width;
    const x1 = to % width;
    const y0 = Math.trunc(from / width);
    const y1 = Math.trunc(to / width);
    let dx = x1 - x0;
    let dy = y1 - y0;
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    dx = Math.abs(dx);
    dy = Math.abs(dy);
    const stepA = dx > dy ? stepX : stepY * width;
    const stepB = dx > dy ? stepY * width : stepX;
    const dA = dx > dy ? dx : dy;
    const dB = dx > dy ? dy : dx;

    this.traceDistance = 1;
    this.writeTrace(0, from);
    let cell = from;
    let error = Math.trunc(dA / 2);
    while (cell !== to || magic) {
      cell += stepA;
      error += dB;
      if (error >= dA) {
        error -= dA;
        cell += stepB;
      }
      // Java post-increment happens even if the subsequent array write throws.
      this.writeTrace(this.traceDistance++, cell);
      if (!readGridFlag(world.passable, cell) && !readGridFlag(world.avoid, cell)) {
        return this.traceAt(--this.traceDistance - 1);
      }
      if (readGridFlag(world.losBlocking, cell) || (hitChars && world.hasCharacter(cell))) return cell;
    }
    // Deliberate source behavior: a normally reached destination is recorded twice.
    this.writeTrace(this.traceDistance++, cell);
    return to;
  }

  private writeTrace(index: number, cell: number): void {
    if (index < 0 || index >= this.trace.length) throw new RangeError('Java trace bounds');
    this.trace[index] = cell;
  }
}
