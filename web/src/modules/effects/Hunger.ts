/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit state owners and side-effect ports, original arithmetic/order.
 */
import { Buff } from './Buff.ts';
import { statusEffectData } from './status-info.ts';
import { statusTarget } from './status-target.ts';

export class Hunger extends Buff {
  static readonly HUNGRY = statusEffectData.Hunger.hungry;
  static readonly STARVING = statusEffectData.Hunger.starving;
  private level = 0;
  private readonly port: PDHungerPort;
  constructor(clock: PDBuffClock, port: PDHungerPort) { super('Hunger', clock); this.port = port; }
  override act(): boolean {
    if (!this.port.isAlive(statusTarget(this.target))) return super.act();
    const hero = statusTarget(this.target);
    this.port.requireHero(hero);
    if (this.isStarving()) {
      if (this.port.float() < Math.fround(0.3) &&
        (this.port.hp(statusTarget(this.target)) > 1 || !this.port.paralysed(statusTarget(this.target)))) {
        this.port.hungerMessage('starving');
        this.port.damage(hero, 1, this);
        this.port.interrupt(hero);
      }
    } else {
      let bonus = 0;
      for (const level of this.port.satietyLevels(statusTarget(this.target))) bonus = (bonus + level) | 0;
      const next = Math.fround(Math.fround(this.level + 10) - Math.fround(bonus));
      let updated = false;
      if (next >= Hunger.STARVING) {
        this.port.hungerMessage('starving'); updated = true; this.port.interrupt(hero);
      } else if (next >= Hunger.HUNGRY && this.level < Hunger.HUNGRY) {
        this.port.hungerMessage('hungry'); updated = true;
      }
      this.level = next;
      if (updated) this.port.refreshHero();
    }
    // The original reads target again after damage/interrupt callbacks.
    this.port.requireHero(statusTarget(this.target));
    const step = this.port.isRogue(statusTarget(this.target)) ? Math.fround(10 * Math.fround(1.2)) : 10;
    this.spend(statusTarget(this.target).findBuff('Shadows') === null ? step : Math.fround(step * 1.5));
    return true;
  }
  satisfy(energy: number): void {
    this.level = Math.fround(this.level - Math.fround(energy));
    if (this.level < 0) this.level = 0;
    else if (this.level > Hunger.STARVING) this.level = Hunger.STARVING;
    this.port.refreshHero();
  }
  isStarving(): boolean { return this.level >= Hunger.STARVING; }
  icon(): number { return this.level < Hunger.HUNGRY ? -1 : this.level < Hunger.STARVING ? 5 : 6; }
  titleKey(): 'Hungry' | 'Starving' { return this.level < Hunger.STARVING ? 'Hungry' : 'Starving'; }
  onDeath(): void { this.port.badge('Hunger'); this.port.fail('Hunger'); this.port.deathMessage('Hunger'); }
  ownState(): PDEffectLevelState { return { level: this.level }; }
  restoreOwnState(state: PDEffectLevelState): void { this.level = Math.fround(state.level); }
}
