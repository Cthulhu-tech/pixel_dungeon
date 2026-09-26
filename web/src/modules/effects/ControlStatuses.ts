/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit target/world ports; source order and float/int arithmetic retained.
 */
import { FlavourBuff } from './FlavourBuff.ts';
import { statusEffectData } from './status-info.ts';
import { statusTarget, resistanceDuration } from './status-target.ts';

export class Paralysis extends FlavourBuff {
  private readonly port: PDParalysisPort;
  constructor(clock: PDBuffClock, port: PDParalysisPort) { super('Paralysis', clock); this.port = port; }
  override attachTo(target: PDBuffTarget): boolean {
    if (!super.attachTo(target)) return false;
    this.port.setParalysed(target, true);
    return true;
  }
  override detach(): void {
    super.detach();
    Paralysis.unfreeze(statusTarget(this.target), this.port);
  }
  static unfreeze(target: PDBuffTarget, port: PDParalysisPort): void {
    if (target.findBuff('Paralysis') === null && target.findBuff('Frost') === null) {
      port.setParalysed(target, false);
    }
  }
  static duration(target: PDBuffTarget, port: PDStatusResistancePort): number {
    return resistanceDuration(target, statusEffectData.Paralysis.duration, port);
  }
}

export class Roots extends FlavourBuff {
  private readonly port: PDRootsPort;
  constructor(clock: PDBuffClock, port: PDRootsPort) { super('Roots', clock); this.port = port; }
  override attachTo(target: PDBuffTarget): boolean {
    if (this.port.isFlying(target) || !super.attachTo(target)) return false;
    this.port.setRooted(target, true);
    return true;
  }
  override detach(): void {
    this.port.setRooted(statusTarget(this.target), false);
    super.detach();
  }
}

export class Levitation extends FlavourBuff {
  static readonly DURATION = statusEffectData.Levitation.duration;
  private readonly port: PDLevitationPort;
  constructor(clock: PDBuffClock, port: PDLevitationPort) { super('Levitation', clock); this.port = port; }
  override attachTo(target: PDBuffTarget): boolean {
    if (!super.attachTo(target)) return false;
    this.port.setFlying(target, true);
    target.findBuff('Roots')?.detach();
    return true;
  }
  override detach(): void {
    this.port.setFlying(statusTarget(this.target), false);
    // Press may trigger traps and reenter gameplay BEFORE the original buff removal.
    this.port.press(statusTarget(this.target));
    super.detach();
  }
}
