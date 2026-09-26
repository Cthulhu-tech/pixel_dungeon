interface PDGridDoorPorts {
  hasHeap(cell: number): boolean;
  setDoor(cell: number, open: boolean): void;
  updateMap(cell: number): void;
  observe(): void;
  isVisible(cell: number): boolean;
  playOpening(): void;
}
