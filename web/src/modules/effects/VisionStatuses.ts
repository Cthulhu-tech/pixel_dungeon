/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit target/world ports; source order and float/int arithmetic retained.
 */
import { FlavourBuff } from './FlavourBuff.ts';
import { statusEffectData } from './status-info.ts';
import { statusTarget } from './status-target.ts';

class ObservedExpiry extends FlavourBuff {
  private readonly observation: PDObservePort;
  constructor(classId: string, clock: PDBuffClock, observation: PDObservePort) {
    super(classId, clock); this.observation = observation;
  }
  override detach(): void { super.detach(); this.observation.observe(); }
}
export class MindVision extends ObservedExpiry {
  static readonly DURATION = statusEffectData.MindVision.duration;
  // Source field is NOT saved by MindVision; don't invent an extra persisted field.
  distance = 2;
  constructor(clock: PDBuffClock, observation: PDObservePort) { super('MindVision', clock, observation); }
}
export class Awareness extends ObservedExpiry {
  static readonly DURATION = statusEffectData.Awareness.duration;
  constructor(clock: PDBuffClock, observation: PDObservePort) { super('Awareness', clock, observation); }
}
export class Blindness extends ObservedExpiry {
  constructor(clock: PDBuffClock, observation: PDObservePort) { super('Blindness', clock, observation); }
}
export class Light extends FlavourBuff {
  static readonly DURATION = statusEffectData.Light.duration;
  static readonly DISTANCE = statusEffectData.Light.distance;
  private readonly port: PDLightPort;
  constructor(clock: PDBuffClock, port: PDLightPort) { super('Light', clock); this.port = port; }
  override attachTo(target: PDBuffTarget): boolean {
    if (!super.attachTo(target)) return false;
    const distance = this.port.levelViewDistance();
    if (distance !== null) {
      this.port.setViewDistance(target, Math.max(distance, Light.DISTANCE));
      this.port.observe();
    }
    return true;
  }
  override detach(): void {
    const distance = this.port.levelViewDistance();
    if (distance === null) throw new TypeError('Original Light.detach requires Dungeon.level');
    this.port.setViewDistance(statusTarget(this.target), distance);
    this.port.observe();
    super.detach();
  }
}
