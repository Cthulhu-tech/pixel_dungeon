/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / actors/Actor.java.
 * Changes: instance clock/membership ownership and explicit behavior/world ports.
 */
const FLOAT_MAX = Math.fround(3.4028234663852886e38);
const FLOAT_MIN = 2 ** -149;

export class TurnScheduler {
  private readonly members: PDTurnMembership;
  private readonly environment: PDTurnEnvironment;
  private readonly records = new WeakMap<PDTurnParticipant, PDTurnRecord>();
  private readonly ids = new Map<number, PDTurnParticipant>();
  private readonly occupants: (PDTurnParticipant | null)[];
  private current: PDTurnParticipant | null = null;
  private time = 0;
  private revision: object = {};

  constructor(cellCount: number, members: PDTurnMembership, environment: PDTurnEnvironment) {
    if (!Number.isInteger(cellCount) || cellCount <= 0) throw new RangeError('Positive cell count required');
    this.occupants = Array.from({ length: cellCount }, () => null);
    this.members = members;
    this.environment = environment;
  }

  get now(): number { return this.time; }
  get currentActor(): PDTurnParticipant | null { return this.current; }
  /** Ephemeral identity for the current act/scope; not gameplay time or save data. */
  get activeRevision(): object { return this.revision; }

  has(actor: PDTurnParticipant): boolean { return this.members.has(actor); }

  /** Detached membership projection in the injected original iteration order. */
  list(): readonly PDTurnParticipant[] { return Array.from(this.members); }

  clockOf(actor: PDTurnParticipant): PDTurnClock {
    const record = this.record(actor);
    return { time: record.time, id: record.id };
  }

  /** Equivalent to Actor.restoreFromBundle's fields, not a Bundle/save decoder. */
  restoreClock(actor: PDTurnParticipant, clock: PDTurnClock): void {
    this.records.set(actor, { time: Math.fround(clock.time), id: clock.id });
  }

  spend(actor: PDTurnParticipant, elapsed: number): void {
    const record = this.record(actor);
    record.time = Math.fround(record.time + Math.fround(elapsed));
  }

  postpone(actor: PDTurnParticipant, delay: number): void {
    const target = Math.fround(this.time + Math.fround(delay));
    const record = this.record(actor);
    if (record.time < target) record.time = target;
  }

  cooldown(actor: PDTurnParticipant): number {
    return Math.fround(this.record(actor).time - this.time);
  }

  deactivate(actor: PDTurnParticipant): void { this.record(actor).time = FLOAT_MAX; }

  id(actor: PDTurnParticipant): number {
    const record = this.record(actor);
    if (record.id > 0) return record.id;
    let maximum = 0;
    for (const member of this.members) {
      const id = this.record(member).id;
      if (id > maximum) maximum = id;
    }
    record.id = (maximum + 1) | 0;
    return record.id;
  }

  /** Source clear does NOT clear current or erase detached actors' clocks. */
  clear(): void {
    this.revision = {};
    this.time = 0;
    this.occupants.fill(null);
    this.members.clear();
    this.ids.clear();
  }

  fixTime(): void {
    const hero = this.environment.hero();
    if (hero !== null && this.members.has(hero)) this.environment.addDuration(this.time);
    let minimum = FLOAT_MAX;
    for (const actor of this.members) if (this.record(actor).time < minimum) minimum = this.record(actor).time;
    for (const actor of this.members) {
      const record = this.record(actor);
      record.time = Math.fround(record.time - minimum);
    }
    this.time = 0;
  }

  initialize(mobs: Iterable<PDTurnParticipant>, blobs: Iterable<PDTurnParticipant>): void {
    this.revision = {};
    const hero = this.environment.hero();
    if (hero === null) throw new TypeError('Original Actor.init requires a hero');
    this.addDelayed(hero, -FLOAT_MIN);
    for (const mob of mobs) this.add(mob);
    for (const blob of blobs) this.add(blob);
    this.current = null;
  }

  add(actor: PDTurnParticipant): void { this.addAt(actor, this.time); }

  addDelayed(actor: PDTurnParticipant, delay: number): void {
    this.addAt(actor, Math.fround(this.time + Math.fround(delay)));
  }

  remove(actor: PDTurnParticipant | null): void {
    if (actor === null) return;
    this.members.delete(actor);
    actor.onRemove();
    const id = this.record(actor).id;
    if (id > 0) this.ids.delete(id);
  }

  occupyCell(actor: PDTurnParticipant): void {
    const character = actor.character;
    if (character === null) throw new TypeError('Character required to occupy a cell');
    this.setOccupant(character.position, actor);
  }

  freeCell(cell: number): void { this.setOccupant(cell, null); }

  findChar(cell: number): PDTurnParticipant | null {
    const value = this.occupants[cell];
    if (value === undefined) throw new RangeError('Java chars[] bounds');
    return value;
  }

  findById(id: number): PDTurnParticipant | null { return this.ids.get(id) ?? null; }

  /** Domain-owned Actor.next equivalent. Never expose raw next to renderer callbacks. */
  next(actor: PDTurnParticipant): void {
    if (this.current === actor) this.current = null;
  }

  process(): void {
    if (this.current !== null) return;
    let proceed: boolean;
    do {
      this.time = FLOAT_MAX;
      this.current = null;
      this.occupants.fill(null);
      for (const actor of this.members) {
        const time = this.record(actor).time;
        if (time < this.time) {
          this.time = time;
          this.current = actor;
        }
        if (actor.character !== null) this.setOccupant(actor.character.position, actor);
      }
      const current = this.current;
      if (current === null) {
        proceed = false;
      } else {
        if (current.character !== null && current.character.isMoving) {
          this.current = null;
          break;
        }
        this.revision = {};
        proceed = current.act();
        if (proceed && !this.environment.heroIsAlive()) {
          proceed = false;
          this.current = null;
        }
      }
    } while (proceed);
  }

  private addAt(actor: PDTurnParticipant, time: number): void {
    if (this.members.has(actor)) return;
    const record = this.record(actor);
    if (record.id > 0) this.ids.set(record.id, actor);
    this.members.add(actor);
    record.time = Math.fround(record.time + time);
    actor.onAdd();
    const character = actor.character;
    if (character !== null) {
      this.setOccupant(character.position, actor);
      for (const buff of character.buffs()) {
        this.members.add(buff);
        // Direct source registration: no buff time shift/id registration, even if present.
        buff.onAdd();
      }
    }
  }

  private record(actor: PDTurnParticipant): PDTurnRecord {
    let record = this.records.get(actor);
    if (record === undefined) {
      record = { time: 0, id: 0 };
      this.records.set(actor, record);
    }
    return record;
  }

  private setOccupant(cell: number, actor: PDTurnParticipant | null): void {
    if (cell < 0 || cell >= this.occupants.length) throw new RangeError('Java chars[] bounds');
    this.occupants[cell] = actor;
  }
}
