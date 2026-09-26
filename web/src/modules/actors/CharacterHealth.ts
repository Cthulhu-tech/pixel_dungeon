/*
 * Derived from Pixel Dungeon Char.java, Copyright (C) 2012-2015 Oleg Dolya.
 * GPL-3.0-or-later; see LICENSE.txt. Source commit ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: one instance owns HP/HT, explicit buff/random/lifecycle presentation ports.
 */
export class CharacterHealth {
  protected hp: number;
  protected ht: number;
  private readonly ports: PDCharacterHealthPorts;

  /** Input is a canonical owner checkpoint, not an untrusted save-file parser. */
  constructor(initial: PDCharacterHealthSnapshot, ports: PDCharacterHealthPorts) {
    this.hp = initial.HP;
    this.ht = initial.HT;
    this.ports = ports;
  }

  get current(): number { return this.hp; }
  get maximum(): number { return this.ht; }
  snapshot(): PDCharacterHealthSnapshot { return { HP: this.hp, HT: this.ht }; }
  isAlive(): boolean { return this.hp > 0; }

  /** Source direct HP += amount, distinct from damage/healing effects; no clamp or buff callbacks. */
  addCurrent(amount: number): void { this.hp = (this.hp + amount) | 0; }

  damage(amount: number, source: PDCharacterDamageSource): void {
    if (this.hp <= 0) return;
    this.ports.detachFrost();
    const sourceClass = source.classId;
    if (this.ports.isImmune(sourceClass)) {
      amount = 0;
    } else if (this.ports.isResistant(sourceClass)) {
      amount = this.ports.intRange(0, amount);
    }
    if (this.ports.hasParalysis()) {
      if (this.ports.intTo(amount) >= this.ports.intTo(this.hp)) {
        this.ports.detachParalysis();
        if (this.ports.isVisible()) this.ports.paralysisBroken();
      }
    }
    // Negative damage and signed int overflow are observable in the original.
    this.hp = (this.hp - amount) | 0;
    if (amount > 0 || source.isCharacter) {
      this.ports.showDamage(amount, this.hp > Math.trunc(this.ht / 2) ? 'warning' : 'negative');
    }
    if (this.hp <= 0) this.die(source);
  }

  /** Order matters: HP=0 -> Actor.remove (including hooks) -> freeCell. */
  destroy(): void {
    this.hp = 0;
    this.ports.removeActor();
    this.ports.freeCell();
  }

  /** Virtual death dispatch is intentional: Hero/Mob specialize it in the source. */
  die(_source: PDCharacterDamageSource): void {
    this.destroy();
    this.ports.showDeath();
  }
}
