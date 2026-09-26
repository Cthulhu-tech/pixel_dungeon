/** Domain queries only. Actor identity, buffs, HP and position keep their own owners. */
interface PDLevelSightActor {
  readonly position: number;
  readonly viewDistance: number;
  hasBlindness(): boolean;
  hasShadows(): boolean;
  isAlive(): boolean;
  mindVisionDistances(): Iterable<number>;
  hasMindVision(): boolean;
  isHero(): boolean;
  isHuntress(): boolean;
  hasAwareness(): boolean;
}
interface PDLevelSightWorld {
  readonly losBlocking: PDGridPassability;
  readonly discoverable: PDGridPassability;
  mobPositions(): Iterable<number>;
  heapPositions(): Iterable<number>;
}
interface PDLevelShadowCast {
  castShadow(x: number, y: number, output: Uint8Array, distance: number, losBlocking: PDGridPassability): void;
}
