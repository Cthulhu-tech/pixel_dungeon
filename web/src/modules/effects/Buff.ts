/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / actors/buffs/Buff.java.
 * Changes: stable class identity, target ownership, injected original actor clock.
 */
export class Buff implements PDBuffInstance {
  readonly classId: string;
  readonly character = null;
  private attachedTarget: PDBuffTarget | null = null;
  private readonly clock: PDBuffClock;

  constructor(classId: string, clock: PDBuffClock) {
    this.classId = classId;
    this.clock = clock;
  }

  get target(): PDBuffTarget | null { return this.attachedTarget; }

  attachTo(target: PDBuffTarget): boolean {
    if (target.isImmuneTo(this.classId)) return false;
    this.attachedTarget = target;
    target.addBuff(this);
    return true;
  }

  /** Source detach retains target; repeated detach calls target.remove again. */
  detach(): void {
    if (this.attachedTarget === null) throw new TypeError('Original Buff.detach requires a target');
    this.attachedTarget.removeBuff(this);
  }

  act(): boolean { this.clock.deactivate(this); return true; }
  spend(duration: number): void { this.clock.spend(this, duration); }
  postpone(duration: number): void { this.clock.postpone(this, duration); }
  // Original Actor hooks are intentionally empty, not missing gameplay implementations.
  onAdd(): void {}
  onRemove(): void {}
}
