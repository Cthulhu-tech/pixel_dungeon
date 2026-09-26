/* Pixel Dungeon actors/blobs/Blob.java; GPL-3.0-or-later.
 * Copyright (C) 2012-2015 Oleg Dolya. Buffers/volume belong to this field; time belongs to turns.
 */
export class BlobField implements PDBlobParticipant {
  readonly character = null;
  protected current: Int32Array;
  protected next: Int32Array;
  protected total = 0;
  protected readonly width: number;
  protected readonly height: number;
  private readonly solid: () => PDBlobMask;
  private readonly clock: PDBlobClock;

  constructor(width: number, height: number, solid: () => PDBlobMask, clock: PDBlobClock) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width * height > 2147483647) {
      throw new RangeError('Positive int32 blob dimensions required');
    }
    this.width = width;
    this.height = height;
    this.current = new Int32Array(width * height);
    this.next = new Int32Array(width * height);
    this.solid = solid;
    this.clock = clock;
  }

  get volume(): number { return this.total; }
  concentration(cell: number): number { return this.at(this.current, cell); }

  seed(cell: number, amount: number): void {
    this.current[cell] = (this.at(this.current, cell) + amount) | 0;
    this.total = (this.total + amount) | 0;
  }

  clear(cell: number): void {
    this.total = (this.total - this.at(this.current, cell)) | 0;
    this.current[cell] = 0;
  }

  act(): boolean {
    this.clock.spend(this, 1); // Original Actor.TICK, not frame time.
    if (this.total > 0) {
      this.total = 0;
      this.evolve();
      const previous = this.next;
      this.next = this.current;
      this.current = previous;
    }
    return true;
  }

  // The inherited source Actor hooks intentionally do nothing.
  onAdd(): void {}
  onRemove(): void {}

  /** Null means Blob.storeInBundle emits neither own field; actor clocks are stored elsewhere. */
  storeOwnState(): PDBlobStoredState | null {
    if (this.total <= 0) return null;
    const length = this.width * this.height;
    let start = 0;
    for (; start < length; start++) if (this.at(this.current, start) > 0) break;
    let end = length - 1;
    for (; end > start; end--) if (this.at(this.current, end) > 0) break;
    const copy = new Int32Array(end + 1 - start);
    this.copyRange(this.current, start, copy, 0, copy.length);
    return { start, cur: copy };
  }

  /** Decoded source fields, NOT untrusted save parsing. Repeated restore is additive in the source. */
  restoreOwnState(state: PDBlobStoredState | null, loadedMapSize: number | null): void {
    if (state !== null) {
      for (let i = 0; i < state.cur.length; i++) {
        const cell = (i + state.start) | 0;
        const value = this.at(state.cur, i);
        if (cell < 0 || cell >= this.current.length) throw new RangeError('Java blob.cur bounds');
        this.current[cell] = value;
        this.total = (this.total + value) | 0;
      }
    }
    if (loadedMapSize !== null) {
      const resized = new Int32Array(this.width * this.height);
      for (let i = 0; i < loadedMapSize; i++) {
        this.copyRange(this.current, Math.imul(i, loadedMapSize), resized, Math.imul(i, this.width), loadedMapSize);
      }
      this.current = resized;
    }
  }

  snapshot(): PDBlobSnapshot { return { volume: this.total, cur: this.current.slice(), off: this.next.slice() }; }

  /** Subclasses run their source post-processing before act swaps these buffers. */
  protected evolve(): void {
    const solid = this.solid();
    const open = new Uint8Array(solid.length);
    for (let i = 0; i < solid.length; i++) {
      const value = solid[i];
      if (value === undefined) throw new RangeError('Java solid[] bounds');
      open[i] = Number(!value);
    }
    for (let y = 1; y < this.height - 1; y++) {
      const from = y * this.width + 1;
      const to = from + this.width - 2;
      for (let cell = from; cell < to; cell++) {
        if (this.at(open, cell) !== 0) {
          let count = 1;
          let sum = this.at(this.current, cell);
          for (const offset of [-1, 1, -this.width, this.width]) {
            if (this.at(open, cell + offset) !== 0) {
              sum = (sum + this.at(this.current, cell + offset)) | 0;
              count++;
            }
          }
          const value = sum >= count ? (Math.trunc(sum / count) - 1) | 0 : 0;
          this.next[cell] = value;
          this.total = (this.total + value) | 0;
        } else this.next[cell] = 0;
      }
    }
  }

  protected at(values: ArrayLike<number>, cell: number): number {
    const value = values[cell];
    if (value === undefined) throw new RangeError('Java blob array bounds');
    return value;
  }

  private copyRange(source: Int32Array, from: number, target: Int32Array, to: number, count: number): void {
    if (from < 0 || to < 0 || count < 0 || from + count > source.length || to + count > target.length) {
      throw new RangeError('Java blob arraycopy bounds');
    }
    target.set(source.subarray(from, from + count), to);
  }
}
