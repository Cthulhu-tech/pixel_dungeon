/** Buff/flight queries from the authoritative character owner, in original short-circuit order. */
interface PDNavigationActor {
  readonly flying: boolean;
  hasAmok(): boolean;
  hasRage(): boolean;
}

/** Caller-owned world state. Iteration keeps original Actor.all character order. */
interface PDNavigationWorld {
  readonly avoid: PDGridPassability;
  hasCharacter(cell: number): boolean;
  characterPositions(): Iterable<number>;
}

/** Consumer port implemented by GridPathFinder; the mask borrow ends when the call returns. */
interface PDNavigationPathfinder {
  getStep(from: number, to: number, passable: PDGridPassability): number;
  getStepBack(current: number, threat: number, passable: PDGridPassability): number;
}
