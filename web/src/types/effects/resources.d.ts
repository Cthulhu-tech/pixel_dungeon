interface PDEffectVitals {
  isAlive(target: PDBuffTarget): boolean;
  hp(target: PDBuffTarget): number;
  ht(target: PDBuffTarget): number;
  damage(target: PDBuffTarget, amount: number, source: PDBuffInstance): void;
}
type PDEffectDeath = 'Poison' | 'Bleeding' | 'Hunger' | 'Ooze' | 'Burning';
interface PDEffectDeathPort {
  badge(cause: 'Poison' | 'Hunger' | 'Burning'): void;
  fail(cause: PDEffectDeath): void;
  deathMessage(cause: PDEffectDeath): void;
}
interface PDPoisonPort extends PDEffectDeathPort {
  isAlive(target: PDBuffTarget): boolean;
  damage(target: PDBuffTarget, amount: number, source: PDBuffInstance): void;
}
interface PDEffectPoint { readonly x: number; readonly y: number; }
interface PDBleedingPort extends PDEffectVitals, PDEffectDeathPort {
  intBetween(min: number, max: number): number;
  spriteVisible(target: PDBuffTarget): boolean;
  spriteCenter(target: PDBuffTarget): PDEffectPoint;
  bloodColor(target: PDBuffTarget): number;
  splash(center: PDEffectPoint, direction: number, cone: number, color: number, count: number): void;
  isHero(target: PDBuffTarget): boolean;
}
interface PDOozePort extends PDEffectVitals, PDEffectDeathPort {
  isHero(target: PDBuffTarget): boolean;
  isWater(target: PDBuffTarget): boolean;
}
interface PDBarkskinPort { isAlive(target: PDBuffTarget): boolean; }
interface PDFuryPort {
  hp(target: PDBuffTarget): number;
  ht(target: PDBuffTarget): number;
}
interface PDHungerPort extends PDEffectVitals, PDEffectDeathPort {
  requireHero(target: PDBuffTarget): void;
  isRogue(target: PDBuffTarget): boolean;
  paralysed(target: PDBuffTarget): boolean;
  satietyLevels(target: PDBuffTarget): Iterable<number>;
  float(): number;
  hungerMessage(state: 'hungry' | 'starving'): void;
  interrupt(target: PDBuffTarget): void;
  refreshHero(): void;
}
interface PDRegenerationPort {
  isAlive(target: PDBuffTarget): boolean;
  hp(target: PDBuffTarget): number;
  ht(target: PDBuffTarget): number;
  heroIsStarving(target: PDBuffTarget): boolean;
  addHp(target: PDBuffTarget, amount: number): void;
  rejuvenationLevels(target: PDBuffTarget): Iterable<number>;
}
interface PDWeaknessPort {
  requireHero(target: PDBuffTarget): void;
  setWeakened(target: PDBuffTarget, value: boolean): void;
  discharge(target: PDBuffTarget): void;
}
interface PDTerrorRecoveryPort { cooldown(buff: PDBuffInstance): number; }
interface PDComboPort {
  validate(count: number): void;
  message(count: number): void;
}
interface PDEffectLeftState { readonly left: number; }
interface PDEffectLevelState { readonly level: number; }
interface PDEffectObjectState { readonly object: number; }
interface PDEffectItem { readonly classId: string; }
interface PDEffectDroppedItem { playDrop(): void; }
interface PDEffectFoodPort {
  isHero(target: PDBuffTarget): boolean;
  randomUnequipped(target: PDBuffTarget): PDEffectItem | null;
  isMysteryMeat(item: PDEffectItem | null): item is PDEffectItem;
  detachOne(target: PDBuffTarget, item: PDEffectItem): PDEffectItem;
  createFood(kind: 'FrozenCarpaccio' | 'ChargrilledMeat'): PDEffectItem;
  collectFood(target: PDBuffTarget, item: PDEffectItem): boolean;
  dropFood(target: PDBuffTarget, item: PDEffectItem): PDEffectDroppedItem;
}
interface PDFrostPort extends PDEffectFoodPort, PDParalysisPort {}
interface PDBurningPort extends PDEffectVitals, PDEffectDeathPort, PDEffectFoodPort {
  prolongLight(target: PDBuffTarget, duration: number): void;
  intBetween(min: number, max: number): number;
  float(): number;
  isScroll(item: PDEffectItem | null): item is PDEffectItem;
  itemName(item: PDEffectItem): string;
  burnsMessage(name: string): void;
  burnFx(target: PDBuffTarget): void;
  isThief(target: PDBuffTarget): boolean;
  thiefItem(target: PDBuffTarget): PDEffectItem | null;
  clearThiefItem(target: PDBuffTarget): void;
  stolenScrollBurst(target: PDBuffTarget, count: number): void;
  isFlammable(target: PDBuffTarget): boolean;
  spreadFire(target: PDBuffTarget, amount: number): void;
  isWater(target: PDBuffTarget): boolean;
  isFlying(target: PDBuffTarget): boolean;
}
