/** Ephemeral in-process token. Identity is scoped to one gate, never persisted as game state. */
interface PDTurnContinuation {
  readonly serial: bigint;
}

interface PDTurnContinuationHost {
  readonly currentActor: PDTurnParticipant | null;
  readonly activeRevision: object;
  next(actor: PDTurnParticipant): void;
}

/** Internal bounded pending barrier, not a second turn scheduler. */
interface PDTurnPendingContinuation {
  readonly actor: PDTurnParticipant;
  readonly revision: object;
  readonly token: PDTurnContinuation;
}
