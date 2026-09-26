interface PDStatusResistance { durationFactor(): number; }
interface PDStatusResistancePort {
  resistance(target: PDBuffTarget): PDStatusResistance | null;
}
interface PDParalysisPort { setParalysed(target: PDBuffTarget, value: boolean): void; }
interface PDRootsPort {
  isFlying(target: PDBuffTarget): boolean;
  setRooted(target: PDBuffTarget, value: boolean): void;
}
interface PDLevitationPort {
  setFlying(target: PDBuffTarget, value: boolean): void;
  press(target: PDBuffTarget): void;
}
interface PDInvisibilityPort {
  invisible(target: PDBuffTarget): number;
  setInvisible(target: PDBuffTarget, value: number): void;
}
interface PDInvisibilityDispelPort {
  hero(): PDBuffTarget;
  visibleEnemies(): number;
}
interface PDObservePort { observe(): void; }
interface PDLightPort extends PDObservePort {
  levelViewDistance(): number | null;
  setViewDistance(target: PDBuffTarget, value: number): void;
}
interface PDShadowsPort extends PDObservePort, PDInvisibilityPort {
  isAlive(target: PDBuffTarget): boolean;
  visibleEnemies(): number;
  meldSound(): void;
}
interface PDShadowsState { readonly left: number; }
type PDStatusId = 'Cripple' | 'Slow' | 'Speed' | 'Vertigo' | 'Amok' | 'Rage' | 'Sleep'
  | 'MindVision' | 'Awareness' | 'Blindness' | 'Light' | 'Paralysis' | 'Roots'
  | 'Levitation' | 'Invisibility' | 'Shadows';
interface PDStatusInfo {
  readonly icon: number;
  readonly title: string | null;
  readonly duration?: number;
  readonly distance?: number;
  readonly soundSleep?: number;
}
