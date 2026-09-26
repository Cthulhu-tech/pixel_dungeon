/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit state owners and side-effect ports, original arithmetic/order.
 */
import { FlavourBuff } from './FlavourBuff.ts';
import { Paralysis } from './ControlStatuses.ts';
import { statusEffectData } from './status-info.ts';
import { statusTarget, resistanceDuration } from './status-target.ts';

export class Frost extends FlavourBuff {
  private readonly port: PDFrostPort;
  constructor(clock: PDBuffClock, port: PDFrostPort) { super('Frost', clock); this.port = port; }
  override attachTo(target: PDBuffTarget): boolean {
    if (!super.attachTo(target)) return false;
    this.port.setParalysed(target, true);
    target.findBuff('Burning')?.detach();
    if (this.port.isHero(target)) {
      const item = this.port.randomUnequipped(target);
      if (this.port.isMysteryMeat(item)) {
        this.port.detachOne(target, item);
        const food = this.port.createFood('FrozenCarpaccio');
        if (!this.port.collectFood(target, food)) this.port.dropFood(target, food).playDrop();
      }
    }
    return true;
  }
  override detach(): void { super.detach(); Paralysis.unfreeze(statusTarget(this.target), this.port); }
  static duration(target: PDBuffTarget, port: PDStatusResistancePort): number {
    return resistanceDuration(target, statusEffectData.Frost.duration, port);
  }
}
