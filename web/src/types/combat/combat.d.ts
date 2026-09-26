/** Public ports for the original Char.attack/hit rules; no renderer or live store. */
interface PDCombatRandom {
  floatTo(max: number): number;
  floatBetween(min: number, max: number): number;
  intRange(min: number, max: number): number;
}
interface PDCombatant {
  readonly key: string;
  readonly position: number;
  readonly maximumHealth: number;
  attackSkill(target: PDCombatant): number;
  defenseSkill(attacker: PDCombatant): number;
  isRangedSniper(): boolean;
  damageReduction(): number;
  damageRoll(): number;
  attackProc(target: PDCombatant, damage: number): number;
  defenseProc(attacker: PDCombatant, damage: number): number;
  damage(amount: number, source: PDCombatant): void;
  isAlive(): boolean;
  defenseVerb(): string;
}
type PDCombatEvent =
  | { readonly kind: 'hit'; readonly attacker: string; readonly defender: string }
  | { readonly kind: 'hit-sound'; readonly pitch: number }
  | { readonly kind: 'shake'; readonly intensity: number; readonly duration: number }
  | { readonly kind: 'blood'; readonly attacker: string; readonly defender: string; readonly damage: number }
  | { readonly kind: 'flash'; readonly defender: string }
  | { readonly kind: 'hero-killed'; readonly attacker: string }
  | { readonly kind: 'defeated'; readonly attacker: string; readonly defender: string }
  | { readonly kind: 'defense-status'; readonly defender: string; readonly verb: string }
  | { readonly kind: 'miss'; readonly attacker: string; readonly defender: string; readonly verb: string; readonly playerAttack: boolean }
  | { readonly kind: 'miss-sound' };
interface PDCombatWorld {
  readonly hero: PDCombatant | null;
  isVisible(position: number): boolean;
  interruptHero(): void;
  heroHasKillerGlyph(): boolean;
  isBoss(attacker: PDCombatant): boolean;
  fail(reason: 'boss' | 'mob', attacker: PDCombatant): void;
  /** Synchronous ordered effects port, NOT a mutable global event bus. */
  emit(event: PDCombatEvent): void;
}
