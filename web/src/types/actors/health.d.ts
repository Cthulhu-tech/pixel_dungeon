/** Exact source-class identity is supplied by the actor/effect owner. */
interface PDCharacterDamageSource {
  readonly classId: string;
  readonly isCharacter: boolean;
}
interface PDCharacterHealthSnapshot {
  readonly HP: number;
  readonly HT: number;
}
interface PDCharacterHealthPorts {
  intTo(max: number): number;
  intRange(min: number, max: number): number;
  detachFrost(): void;
  isImmune(classId: string): boolean;
  isResistant(classId: string): boolean;
  hasParalysis(): boolean;
  detachParalysis(): void;
  isVisible(): boolean;
  paralysisBroken(): void;
  showDamage(amount: number, tone: 'warning' | 'negative'): void;
  removeActor(): void;
  freeCell(): void;
  showDeath(): void;
}
interface PDCharacterTimePorts {
  hasCripple(): boolean;
  hasSlow(): boolean;
  hasSpeed(): boolean;
  spend(time: number): void;
}
