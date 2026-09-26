/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit target/world ports; source order and float/int arithmetic retained.
 */
import { FlavourBuff } from './FlavourBuff.ts';
import { statusEffectData } from './status-info.ts';
import { resistanceDuration } from './status-target.ts';

export class Cripple extends FlavourBuff {
  static readonly DURATION = statusEffectData.Cripple.duration;
  constructor(clock: PDBuffClock) { super('Cripple', clock); }
}
export class Slow extends FlavourBuff {
  constructor(clock: PDBuffClock) { super('Slow', clock); }
  static duration(target: PDBuffTarget, port: PDStatusResistancePort): number {
    return resistanceDuration(target, statusEffectData.Slow.duration, port);
  }
}
export class Speed extends FlavourBuff {
  static readonly DURATION = statusEffectData.Speed.duration;
  constructor(clock: PDBuffClock) { super('Speed', clock); }
}
export class Vertigo extends FlavourBuff {
  static readonly DURATION = statusEffectData.Vertigo.duration;
  constructor(clock: PDBuffClock) { super('Vertigo', clock); }
  static duration(target: PDBuffTarget, port: PDStatusResistancePort): number {
    return resistanceDuration(target, Vertigo.DURATION, port);
  }
}
export class Amok extends FlavourBuff {
  constructor(clock: PDBuffClock) { super('Amok', clock); }
}
export class Rage extends FlavourBuff {
  constructor(clock: PDBuffClock) { super('Rage', clock); }
}
export class Sleep extends FlavourBuff {
  static readonly SWS = statusEffectData.Sleep.soundSleep;
  constructor(clock: PDBuffClock) { super('Sleep', clock); }
}
