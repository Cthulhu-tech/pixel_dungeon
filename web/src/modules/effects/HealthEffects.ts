/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit state owners and side-effect ports, original arithmetic/order.
 */
import { Buff } from './Buff.ts';
import { statusEffectData } from './status-info.ts';
import { statusTarget } from './status-target.ts';

export class Barkskin extends Buff {
  private armorLevel = 0;
  private readonly port: PDBarkskinPort;
  constructor(clock: PDBuffClock, port: PDBarkskinPort) { super('Barkskin', clock); this.port = port; }
  level(): number { return this.armorLevel; }
  raiseLevel(value: number): void { if (this.armorLevel < value) this.armorLevel = value | 0; }
  override act(): boolean {
    if (this.port.isAlive(statusTarget(this.target))) {
      this.spend(1);
      this.armorLevel = (this.armorLevel - 1) | 0;
      if (this.armorLevel <= 0) this.detach();
    } else this.detach();
    return true;
  }
}
export class Fury extends Buff {
  static readonly LEVEL = Math.fround(statusEffectData.Fury.healthFraction);
  private readonly port: PDFuryPort;
  constructor(clock: PDBuffClock, port: PDFuryPort) { super('Fury', clock); this.port = port; }
  override act(): boolean {
    if (Math.fround(this.port.hp(statusTarget(this.target))) > Math.fround(Math.fround(this.port.ht(statusTarget(this.target))) * Fury.LEVEL)) this.detach();
    this.spend(1);
    return true;
  }
}
export class Ooze extends Buff {
  damage = 1;
  private readonly port: PDOozePort;
  constructor(clock: PDBuffClock, port: PDOozePort) { super('Ooze', clock); this.port = port; }
  override act(): boolean {
    if (this.port.isAlive(statusTarget(this.target))) {
      this.port.damage(statusTarget(this.target), this.damage, this);
      if (!this.port.isAlive(statusTarget(this.target)) && this.port.isHero(statusTarget(this.target))) {
        this.port.fail('Ooze'); this.port.deathMessage('Ooze');
      }
      this.spend(1);
    }
    // This check still runs on a dead target; do not invent deactivation in dry cells.
    if (this.port.isWater(statusTarget(this.target))) this.detach();
    return true;
  }
}
export class Regeneration extends Buff {
  private readonly port: PDRegenerationPort;
  constructor(clock: PDBuffClock, port: PDRegenerationPort) { super('Regeneration', clock); this.port = port; }
  override act(): boolean {
    if (!this.port.isAlive(statusTarget(this.target))) return super.act();
    if (this.port.hp(statusTarget(this.target)) < this.port.ht(statusTarget(this.target)) &&
      !this.port.heroIsStarving(statusTarget(this.target))) this.port.addHp(statusTarget(this.target), 1);
    let bonus = 0;
    for (const level of this.port.rejuvenationLevels(statusTarget(this.target))) bonus = (bonus + level) | 0;
    this.spend(Math.fround(statusEffectData.Regeneration.delay / Math.pow(1.2, bonus)));
    return true;
  }
}
