/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / actors/Char.java.
 * Changes: one membership owner; explicit original collection order and effect ports.
 */
export class CharacterBuffs<T extends PDCharacterBuff> {
  private readonly members: PDCharacterBuffMembership<T>;
  private readonly selection: () => PDCharacterBuffMembership<T>;
  private readonly kinds: PDCharacterBuffKinds<T>;
  private readonly actors: PDCharacterBuffActors<T>;
  private readonly state: PDCharacterBuffState;
  private readonly presentation: PDCharacterBuffPresentation;

  constructor(members: PDCharacterBuffMembership<T>, selection: () => PDCharacterBuffMembership<T>,
    kinds: PDCharacterBuffKinds<T>, actors: PDCharacterBuffActors<T>,
    state: PDCharacterBuffState, presentation: PDCharacterBuffPresentation) {
    this.members = members;
    this.selection = selection;
    this.kinds = kinds;
    this.actors = actors;
    this.state = state;
    this.presentation = presentation;
  }

  /** Detached membership projection, not permission to mutate the owning set. */
  all(): readonly T[] { return Array.from(this.members); }

  matching(classId: string): readonly T[] {
    // Original creates a NEW HashSet: filtered iteration need not equal source order.
    const selected = this.selection();
    for (const buff of this.members) if (this.kinds.isInstance(buff, classId)) selected.add(buff);
    return Array.from(selected);
  }

  find(classId: string): T | null {
    for (const buff of this.members) if (this.kinds.isInstance(buff, classId)) return buff;
    return null;
  }

  isCharmedBy(otherId: () => number): boolean {
    const id = otherId(); // The original allocates/queries this even with no Charm attached.
    for (const buff of this.members) {
      if (this.kinds.isInstance(buff, 'Charm') && this.kinds.charmObject(buff) === id) return true;
    }
    return false;
  }

  add(buff: T): void {
    this.members.add(buff);
    this.actors.add(buff);
    // Adding an already present buff still emits the original presentation effects.
    if (!this.presentation.available()) return;
    const is = (kind: string): boolean => this.kinds.isInstance(buff, kind);
    const p = this.presentation;
    if (is('Poison')) {
      p.poisonSplash(this.state.position(), 5);
      p.status('negative', 'poisoned');
    } else if (is('Amok')) p.status('negative', 'amok');
    else if (is('Slow')) p.status('negative', 'slowed');
    else if (is('MindVision')) {
      p.status('positive', 'mind');
      p.status('positive', 'vision');
    } else if (is('Paralysis')) {
      p.addState('paralysed');
      p.status('negative', 'paralysed');
    } else if (is('Terror')) p.status('negative', 'frightened');
    else if (is('Roots')) p.status('negative', 'rooted');
    else if (is('Cripple')) p.status('negative', 'crippled');
    else if (is('Bleeding')) p.status('negative', 'bleeding');
    else if (is('Vertigo')) p.status('negative', 'dizzy');
    else if (is('Sleep')) p.idle();
    else if (is('Burning')) p.addState('burning');
    else if (is('Levitation')) p.addState('levitating');
    else if (is('Frost')) p.addState('frozen');
    else if (is('Invisibility')) {
      if (!is('Shadows')) p.status('positive', 'invisible');
      p.addState('invisible');
    }
  }

  remove(buff: T): void {
    this.members.delete(buff);
    this.actors.remove(buff);
    const is = (kind: string): boolean => this.kinds.isInstance(buff, kind);
    // There is deliberately no sprite-null guard here in the original.
    if (is('Burning')) this.presentation.removeState('burning');
    else if (is('Levitation')) this.presentation.removeState('levitating');
    else if (is('Invisibility') && this.state.invisibleCount() <= 0) this.presentation.removeState('invisible');
    else if (is('Paralysis')) this.presentation.removeState('paralysed');
    else if (is('Frost')) this.presentation.removeState('frozen');
  }

  removeMatching(classId: string): void {
    for (const buff of this.matching(classId)) this.remove(buff);
  }

  /** Char.onRemove snapshots before callbacks that can mutate the collection. */
  detachAll(): void {
    for (const buff of Array.from(this.members)) buff.detach();
  }

  updateSpriteState(): void {
    for (const buff of this.members) {
      const is = (kind: string): boolean => this.kinds.isInstance(buff, kind);
      if (is('Burning')) this.presentation.addState('burning');
      else if (is('Levitation')) this.presentation.addState('levitating');
      else if (is('Invisibility')) this.presentation.addState('invisible');
      else if (is('Paralysis')) this.presentation.addState('paralysed');
      else if (is('Frost')) this.presentation.addState('frozen');
      else if (is('Light')) this.presentation.addState('illuminated');
    }
  }
}
