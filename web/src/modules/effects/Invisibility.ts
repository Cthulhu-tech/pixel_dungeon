/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit target/world ports; source order and float/int arithmetic retained.
 */
import { FlavourBuff } from './FlavourBuff.ts';
import { statusEffectData } from './status-info.ts';
import { statusTarget } from './status-target.ts';

export class Invisibility extends FlavourBuff {
  static readonly DURATION = statusEffectData.Invisibility.duration;
  private readonly counter: PDInvisibilityPort;
  constructor(clock: PDBuffClock, counter: PDInvisibilityPort, classId = 'Invisibility') {
    super(classId, clock); this.counter = counter;
  }
  override attachTo(target: PDBuffTarget): boolean {
    if (!super.attachTo(target)) return false;
    this.counter.setInvisible(target, (this.counter.invisible(target) + 1) | 0);
    return true;
  }
  override detach(): void {
    const target = statusTarget(this.target);
    this.counter.setInvisible(target, (this.counter.invisible(target) - 1) | 0);
    super.detach();
  }
  static dispel(port: PDInvisibilityDispelPort): void {
    const buff = port.hero().findBuff('Invisibility');
    if (buff !== null && port.visibleEnemies() > 0) buff.detach();
  }
}

export class Shadows extends Invisibility {
  private left = 0;
  private readonly world: PDShadowsPort;
  constructor(clock: PDBuffClock, world: PDShadowsPort) { super(clock, world, 'Shadows'); this.world = world; }
  override attachTo(target: PDBuffTarget): boolean {
    if (!super.attachTo(target)) return false;
    this.world.meldSound();
    this.world.observe();
    return true;
  }
  override detach(): void { super.detach(); this.world.observe(); }
  override act(): boolean {
    if (this.world.isAlive(statusTarget(this.target))) {
      this.spend(2);
      this.left = Math.fround(this.left - 1);
      if (this.left <= 0 || this.world.visibleEnemies() > 0) this.detach();
    } else this.detach();
    return true;
  }
  prolong(): void { this.left = 2; }
  /** Original own Bundle field. Base clock/id serialization belongs to turns. */
  ownState(): PDShadowsState { return { left: this.left }; }
  restoreOwnState(state: PDShadowsState): void { this.left = Math.fround(state.left); }
}
