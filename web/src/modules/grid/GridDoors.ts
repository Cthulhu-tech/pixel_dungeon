/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / levels/features/Door.java.
 * Changes: explicit level, observation and presentation ports; no global Dungeon.
 */
export class GridDoors {
  private readonly ports: PDGridDoorPorts;

  constructor(ports: PDGridDoorPorts) { this.ports = ports; }

  enter(cell: number): void {
    this.ports.setDoor(cell, true);
    this.ports.updateMap(cell);
    this.ports.observe();
    if (this.ports.isVisible(cell)) this.ports.playOpening();
  }

  leave(cell: number): void {
    if (!this.ports.hasHeap(cell)) {
      this.ports.setDoor(cell, false);
      this.ports.updateMap(cell);
      this.ports.observe();
    }
  }
}
