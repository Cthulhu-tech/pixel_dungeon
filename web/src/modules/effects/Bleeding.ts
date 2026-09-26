/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit state owners and side-effect ports, original arithmetic/order.
 */
import { Buff } from './Buff.ts';
import { statusEffectData } from './status-info.ts';
import { statusTarget } from './status-target.ts';

export class Bleeding extends Buff {
  protected level = 0;
  private readonly port: PDBleedingPort;
  constructor(clock: PDBuffClock, port: PDBleedingPort) { super('Bleeding', clock); this.port = port; }
  set(level: number): void { this.level = level | 0; }
  override act(): boolean {
    if (this.port.isAlive(statusTarget(this.target))) {
      this.level = this.port.intBetween(Math.trunc(this.level / 2), this.level);
      if (this.level > 0) {
        this.port.damage(statusTarget(this.target), this.level, this);
        if (this.port.spriteVisible(statusTarget(this.target))) {
          // Argument evaluation precedes the integer division, including center/blood queries.
          const center = this.port.spriteCenter(statusTarget(this.target));
          const pi = Math.fround(statusEffectData.Bleeding.pi);
          const direction = Math.fround(-pi / 2), cone = Math.fround(pi / 6);
          const color = this.port.bloodColor(statusTarget(this.target));
          const product = Math.imul(10, this.level);
          const health = this.port.ht(statusTarget(this.target));
          if (health === 0) throw new RangeError('Java integer division by zero');
          const count = Math.min(Math.trunc(product / health) | 0, 10);
          this.port.splash(center, direction, cone, color, count);
        }
        if (this.port.isHero(statusTarget(this.target)) && !this.port.isAlive(statusTarget(this.target))) {
          this.port.fail('Bleeding'); this.port.deathMessage('Bleeding');
        }
        this.spend(1);
      } else this.detach();
    } else this.detach();
    return true;
  }
  ownState(): PDEffectLevelState { return { level: this.level }; }
  restoreOwnState(state: PDEffectLevelState): void { this.level = state.level | 0; }
}
