/* Pixel Dungeon Dungeon.observe; GPL-3.0-or-later.
 * Copyright (C) 2012-2015 Oleg Dolya. Current hero visibility has one run-scoped owner.
 */
export class RunObservation {
  private readonly visibleCells: Uint8Array;
  private readonly afterObserve: () => void;

  constructor(visible: Uint8Array, afterObserve: () => void) {
    this.visibleCells = visible;
    this.afterObserve = afterObserve;
  }

  get visible(): PDObservationMask { return this.visibleCells; }
  snapshot(): Uint8Array { return this.visibleCells.slice(); }

  observe(level: PDObservationLevel | null): void {
    if (level === null) return;
    const fieldOfView = level.updateHeroFieldOfView();
    // Original System.arraycopy validates the complete range before writing any destination.
    if (fieldOfView.length < this.visibleCells.length) throw new RangeError('Java FOV arraycopy bounds');
    for (let i = 0; i < this.visibleCells.length; i++) {
      const value = fieldOfView[i];
      if (value === undefined) throw new RangeError('Java FOV[] bounds');
      this.visibleCells[i] = Number(Boolean(value));
    }
    level.rememberVisible(this.visibleCells);
    this.afterObserve();
  }
}
