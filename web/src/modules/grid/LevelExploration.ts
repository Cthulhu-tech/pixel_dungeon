/* Pixel Dungeon Level.visited/mapped and BArray.or; GPL-3.0-or-later.
 * Copyright (C) 2012-2015 Oleg Dolya. Runtime buffers transfer to this per-level owner.
 */
import { readGridFlag } from './mask.ts';

export class LevelExploration {
  private readonly visitedCells: Uint8Array;
  private readonly mappedCells: Uint8Array;

  constructor(visited: Uint8Array, mapped: Uint8Array) {
    this.visitedCells = visited;
    this.mappedCells = mapped;
  }

  get visited(): PDGridPassability { return this.visitedCells; }
  get mapped(): PDGridPassability { return this.mappedCells; }

  /** Exact BArray.or(visited, visible, visited): loop length and short circuit are significant. */
  remember(visible: PDGridPassability): void {
    for (let i = 0; i < this.visitedCells.length; i++) {
      this.visitedCells[i] = Number(readGridFlag(this.visitedCells, i) || readGridFlag(visible, i));
    }
  }

  /** Original mapped[cell] assignment for an owning spell/item operation, without observation. */
  mapCell(cell: number): void {
    if (cell < 0 || cell >= this.mappedCells.length) throw new RangeError('Java mapped[] bounds');
    this.mappedCells[cell] = 1;
  }

  snapshot(): PDLevelExplorationSnapshot {
    return { visited: this.visitedCells.slice(), mapped: this.mappedCells.slice() };
  }
}
