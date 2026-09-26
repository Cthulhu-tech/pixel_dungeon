/** One bounded barrier for the current source Actor.next; no timer or gameplay mutations. */
export class TurnContinuationGate {
  private readonly host: PDTurnContinuationHost;
  private pending: PDTurnPendingContinuation | null = null;
  private serial = 0n;
  private disposed = false;

  constructor(host: PDTurnContinuationHost) { this.host = host; }

  /** Called by the action owner, never inferred from visual position or elapsed frames. */
  capture(actor: PDTurnParticipant): PDTurnContinuation {
    if (this.disposed) throw new Error('Turn continuation gate is disposed');
    if (this.host.currentActor !== actor) throw new Error('Only the current actor can await completion');
    const revision = this.host.activeRevision;
    const pending = this.pending;
    if (pending !== null && pending.actor === actor && pending.revision === revision) return pending.token;
    const token: PDTurnContinuation = { serial: ++this.serial };
    this.pending = { actor, revision, token };
    return token;
  }

  /** Returns false for duplicate/stale/foreign tokens; it never processes the next turn. */
  acknowledge(token: PDTurnContinuation): boolean {
    const pending = this.pending;
    if (this.disposed || pending === null || pending.token !== token) return false;
    this.pending = null;
    if (this.host.currentActor !== pending.actor || this.host.activeRevision !== pending.revision) return false;
    this.host.next(pending.actor);
    return true;
  }

  /** Cancellation is NOT successful animation completion and must not spend/advance a turn. */
  cancel(): void { this.pending = null; }

  dispose(): void {
    this.cancel();
    this.disposed = true;
  }
}
