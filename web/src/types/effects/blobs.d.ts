type PDBlobMask = ArrayLike<boolean | number>;
interface PDBlobParticipant {
  readonly character: null;
  act(): boolean;
  onAdd(): void;
  onRemove(): void;
}
interface PDBlobClock {
  spend(blob: PDBlobParticipant, elapsed: number): void;
}
interface PDBlobStoredState {
  readonly start: number;
  readonly cur: Int32Array;
}
interface PDBlobSnapshot {
  readonly volume: number;
  readonly cur: Int32Array;
  readonly off: Int32Array;
}
