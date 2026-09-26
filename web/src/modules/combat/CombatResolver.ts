/*
 * Derived from Pixel Dungeon Char.java, Copyright (C) 2012-2015 Oleg Dolya.
 * GPL-3.0-or-later; see LICENSE.txt.
 * Source: Cthulhu-tech/pixel_dungeon@ce7f241515fd5c040fcf18b4beb5b7a49d9d535f
 * Changes: explicit actor/world/effect ports; no Phaser or global Dungeon state.
 */
export class CombatResolver {
  private readonly random: PDCombatRandom;

  constructor(random: PDCombatRandom) {
    this.random = random;
  }

  hit(attacker: PDCombatant, defender: PDCombatant, magic: boolean): boolean {
    const accuracy = this.random.floatTo(attacker.attackSkill(defender));
    const defense = this.random.floatTo(defender.defenseSkill(attacker));
    return (magic ? Math.fround(accuracy * 2) : accuracy) >= defense;
  }

  /** Resolves one already-authorized attack; does not charge time or choose a target. */
  attack(attacker: PDCombatant, defender: PDCombatant, world: PDCombatWorld): boolean {
    const visible = world.isVisible(attacker.position) || world.isVisible(defender.position);
    if (!this.hit(attacker, defender, false)) {
      if (visible) {
        const verb = defender.defenseVerb();
        world.emit({ kind: 'defense-status', defender: defender.key, verb });
        world.emit({ kind: 'miss', attacker: attacker.key, defender: defender.key,
          verb, playerAttack: attacker === world.hero });
        world.emit({ kind: 'miss-sound' });
      }
      return false;
    }
    if (visible) world.emit({ kind: 'hit', attacker: attacker.key, defender: defender.key });

    const reduction = attacker.isRangedSniper() ? 0 : this.random.intRange(0, defender.damageReduction());
    const rolled = attacker.damageRoll();
    // Java subtracts ints before Math.max; overflow must not be silently saturated.
    let effective = Math.max((rolled - reduction) | 0, 0);
    effective = attacker.attackProc(defender, effective);
    effective = defender.defenseProc(attacker, effective);
    defender.damage(effective, attacker);

    if (visible) world.emit({ kind: 'hit-sound', pitch: this.random.floatBetween(0.8, 1.25) });
    if (defender === world.hero) {
      world.interruptHero();
      if (effective > Math.trunc(defender.maximumHealth / 4)) {
        const quarter = Math.trunc(defender.maximumHealth / 4);
        // Char.attack can throw here when HT < 4. Preserve phase and partial effects.
        if (quarter === 0) throw new RangeError('Java integer division by zero');
        const intensity = Math.min(5, Math.max(1, (Math.trunc(effective / quarter)) | 0));
        world.emit({ kind: 'shake', intensity, duration: Math.fround(0.3) });
      }
    }
    world.emit({ kind: 'blood', attacker: attacker.key, defender: defender.key, damage: effective });
    world.emit({ kind: 'flash', defender: defender.key });
    // Evaluate isAlive even for an invisible fight, just as the left side of Java &&.
    if (!defender.isAlive() && visible) {
      if (defender === world.hero) {
        if (!world.heroHasKillerGlyph()) {
          world.fail(world.isBoss(attacker) ? 'boss' : 'mob', attacker);
          world.emit({ kind: 'hero-killed', attacker: attacker.key });
        }
      } else {
        world.emit({ kind: 'defeated', attacker: attacker.key, defender: defender.key });
      }
    }
    return true;
  }
}
