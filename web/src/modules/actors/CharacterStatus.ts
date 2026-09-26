/* Pixel Dungeon Char fields; Oleg Dolya (C) 2012-2015, GPL-3.0-or-later.
 * Sole owner of mutable status flags. Membership and HP have different owners.
 */
export class CharacterStatus {
  private paralysis = false;
  private roots = false;
  private flight = false;
  private invisibility = 0;
  private sight = 8;

  get paralysed(): boolean { return this.paralysis; }
  get rooted(): boolean { return this.roots; }
  get flying(): boolean { return this.flight; }
  get invisible(): number { return this.invisibility; }
  get viewDistance(): number { return this.sight; }

  setParalysed(value: boolean): void { this.paralysis = value; }
  setRooted(value: boolean): void { this.roots = value; }
  setFlying(value: boolean): void { this.flight = value; }
  setInvisible(value: number): void { this.invisibility = value | 0; }
  setViewDistance(value: number): void { this.sight = value | 0; }

  /** Inspection/replay snapshot, NOT extra fields to add to original Char saves. */
  snapshot(): PDCharacterStatusSnapshot {
    return { paralysed: this.paralysis, rooted: this.roots, flying: this.flight,
      invisible: this.invisibility, viewDistance: this.sight };
  }
}
