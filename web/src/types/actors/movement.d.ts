interface PDPositionReader {
  readonly position: number;
}
interface PDMovementGeometry {
  adjacent(first: number, second: number): boolean;
  distance(first: number, second: number): number;
  neighbourOffset(index: number): number;
}
interface PDMovementActor {
  readonly flying: boolean;
  readonly isHero: boolean;
  hasVertigo(): boolean;
}
interface PDMovementWorld {
  isPassable(cell: number): boolean;
  isAvoid(cell: number): boolean;
  hasCharacter(cell: number): boolean;
  isOpenDoor(cell: number): boolean;
  isClosedDoor(cell: number): boolean;
  leaveDoor(cell: number): void;
  enterDoor(cell: number): void;
  isVisible(cell: number): boolean;
}
interface PDMovementPresentation {
  setVisible(visible: boolean): void;
}
interface PDMovementRandom {
  intTo(max: number): number;
}
