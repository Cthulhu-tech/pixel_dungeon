/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit state owners and side-effect ports, original arithmetic/order.
 */
import { FlavourBuff } from './FlavourBuff.ts';
import { statusEffectData } from './status-info.ts';
import { resistanceFactor, resistanceDuration, statusTarget } from './status-target.ts';

class TargetedStatus extends FlavourBuff {
  object = 0;
  ownState(): PDEffectObjectState { return { object: this.object }; }
  restoreOwnState(state: PDEffectObjectState): void { this.object = state.object | 0; }
}
export class SnipersMark extends TargetedStatus {
  constructor(clock: PDBuffClock) { super('SnipersMark', clock); }
}
export class Charm extends TargetedStatus {
  constructor(clock: PDBuffClock) { super('Charm', clock); }
  static durationFactor(target: PDBuffTarget, port: PDStatusResistancePort): number { return resistanceFactor(target, port); }
}
export class Terror extends TargetedStatus {
  static readonly DURATION = statusEffectData.Terror.duration;
  constructor(clock: PDBuffClock) { super('Terror', clock); }
  static recover(target: PDBuffTarget, port: PDTerrorRecoveryPort): void {
    const terror = target.findBuff('Terror');
    if (terror !== null && port.cooldown(terror) < Terror.DURATION) target.removeBuff(terror);
  }
}
export class GasesImmunity extends FlavourBuff {
  static readonly DURATION = statusEffectData.GasesImmunity.duration;
  static readonly IMMUNITIES: readonly string[] = statusEffectData.GasesImmunity.immunities;
  constructor(clock: PDBuffClock) { super('GasesImmunity', clock); }
}
export class Weakness extends FlavourBuff {
  private readonly port: PDWeaknessPort;
  constructor(clock: PDBuffClock, port: PDWeaknessPort) { super('Weakness', clock); this.port = port; }
  override attachTo(target: PDBuffTarget): boolean {
    if (!super.attachTo(target)) return false;
    this.port.requireHero(target); this.port.setWeakened(target, true); this.port.discharge(target);
    return true;
  }
  override detach(): void {
    super.detach();
    this.port.requireHero(statusTarget(this.target));
    this.port.setWeakened(statusTarget(this.target), false);
  }
  static duration(target: PDBuffTarget, port: PDStatusResistancePort): number {
    return resistanceDuration(target, statusEffectData.Weakness.duration, port);
  }
}
