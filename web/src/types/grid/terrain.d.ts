type PDGridFlag = 'passable' | 'losBlocking' | 'flamable' | 'secret' | 'solid' | 'avoid' | 'water' | 'pit' | 'discoverable';
interface PDTerrainGridSnapshot {
  readonly map: Int32Array;
  readonly flags: Readonly<Record<PDGridFlag, Uint8Array>>;
}
