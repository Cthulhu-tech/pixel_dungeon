/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit state owners and side-effect ports, original arithmetic/order.
 */
import { Buff } from './Buff.ts';
import { statusEffectData } from './status-info.ts';
import { statusTarget, resistanceDuration } from './status-target.ts';

export class Burning extends Buff {
  private left = 0;
  private readonly port: PDBurningPort;
  constructor(clock: PDBuffClock, port: PDBurningPort) { super('Burning', clock); this.port = port; }
  override act(): boolean {
    if (this.port.isAlive(statusTarget(this.target))) {
      if (this.port.isHero(statusTarget(this.target))) this.port.prolongLight(statusTarget(this.target), Math.fround(1.01));
      this.port.damage(statusTarget(this.target), this.port.intBetween(1, 5), this);
      if (this.port.isHero(statusTarget(this.target))) {
        const item = this.port.randomUnequipped(statusTarget(this.target));
        if (this.port.isScroll(item)) {
          const detached = this.port.detachOne(statusTarget(this.target), item);
          this.port.burnsMessage(this.port.itemName(detached));
          this.port.burnFx(statusTarget(this.target));
        } else if (this.port.isMysteryMeat(item)) {
          const detached = this.port.detachOne(statusTarget(this.target), item);
          const food = this.port.createFood('ChargrilledMeat');
          if (!this.port.collectFood(statusTarget(this.target), food)) this.port.dropFood(statusTarget(this.target), food).playDrop();
          this.port.burnsMessage(this.port.itemName(detached));
          this.port.burnFx(statusTarget(this.target));
        }
      } else if (this.port.isThief(statusTarget(this.target)) && this.port.isScroll(this.port.thiefItem(statusTarget(this.target)))) {
        this.port.clearThiefItem(statusTarget(this.target));
        this.port.stolenScrollBurst(statusTarget(this.target), 6);
      }
    } else this.detach();
    // Source keeps processing after the dead-target detach, including fire and time.
    if (this.port.isFlammable(statusTarget(this.target))) this.port.spreadFire(statusTarget(this.target), 4);
    this.spend(1); this.left = Math.fround(this.left - 1);
    if (this.left <= 0 || this.port.float() > Math.fround(Math.fround(2 + Math.fround(
      Math.fround(this.port.hp(statusTarget(this.target))) / Math.fround(this.port.ht(statusTarget(this.target))))) / 3) ||
      (this.port.isWater(statusTarget(this.target)) && !this.port.isFlying(statusTarget(this.target)))) this.detach();
    return true;
  }
  reignite(target: PDBuffTarget, resistance: PDStatusResistancePort): void { this.left = Burning.duration(target, resistance); }
  static duration(target: PDBuffTarget, port: PDStatusResistancePort): number {
    return resistanceDuration(target, statusEffectData.Burning.duration, port);
  }
  onDeath(): void { this.port.badge('Burning'); this.port.fail('Burning'); this.port.deathMessage('Burning'); }
  ownState(): PDEffectLeftState { return { left: this.left }; }
  restoreOwnState(state: PDEffectLeftState): void { this.left = Math.fround(state.left); }
}
