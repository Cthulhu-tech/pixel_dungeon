/** Actor-owned behavior; scheduler owns only clocks, membership, current turn and indices. */
interface PDTurnParticipant {
  readonly character: PDTurnCharacter | null;
  act(): boolean;
  onAdd(): void;
  onRemove(): void;
}

/** Read-only position/playback view plus original attached-buff iteration order. */
interface PDTurnCharacter {
  readonly position: number;
  readonly isMoving: boolean;
  buffs(): Iterable<PDTurnParticipant>;
}

/** Mutation is reserved for the scheduler; iteration order is an explicit dependency. */
interface PDTurnMembership extends Iterable<PDTurnParticipant> {
  has(actor: PDTurnParticipant): boolean;
  add(actor: PDTurnParticipant): void;
  delete(actor: PDTurnParticipant): void;
  clear(): void;
}

interface PDTurnEnvironment {
  hero(): PDTurnParticipant | null;
  heroIsAlive(): boolean;
  addDuration(elapsed: number): void;
}

/** Snapshot boundary, not a second mutable clock owner. */
interface PDTurnClock {
  readonly time: number;
  readonly id: number;
}

/** Internal scheduler-owned state; never exposed to callers. */
interface PDTurnRecord {
  time: number;
  id: number;
}
