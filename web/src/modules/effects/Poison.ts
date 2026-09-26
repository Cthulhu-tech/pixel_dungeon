/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit state owners and side-effect ports, original arithmetic/order.
 */
import { Buff } from './Buff.ts';
import { toJavaInt } from '../compatibility/index.ts';
import { statusTarget, resistanceFactor } from './status-target.ts';

export class Poison extends Buff {
  protected left = 0;
  private readonly port: PDPoisonPort;
  constructor(clock: PDBuffClock, port: PDPoisonPort) { super('Poison', clock); this.port = port; }
  set(duration: number): void { this.left = Math.fround(duration); }
  override act(): boolean {
    if (this.port.isAlive(statusTarget(this.target))) {
      this.port.damage(statusTarget(this.target), (toJavaInt(Math.fround(this.left / 3)) + 1) | 0, this);
      this.spend(1);
      this.left = Math.fround(this.left - 1);
      if (this.left <= 0) this.detach();
    } else this.detach();
    return true;
  }
  static durationFactor(target: PDBuffTarget, port: PDStatusResistancePort): number {
    return resistanceFactor(target, port);
  }
  onDeath(): void { this.port.badge('Poison'); this.port.fail('Poison'); this.port.deathMessage('Poison'); }
  ownState(): PDEffectLeftState { return { left: this.left }; }
  restoreOwnState(state: PDEffectLeftState): void { this.left = Math.fround(state.left); }
}
