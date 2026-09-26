/* Pixel Dungeon Terrain.java; Oleg Dolya (C) 2012-2015, GPL-3.0-or-later.
 * Tables are exported by the pinned original Java class, not recreated defaults.
 */
import data from './assets/terrain.json' with { type: 'json' };
export const TERRAIN: Readonly<typeof data.constants> = data.constants;

export function terrainFlags(tile: number): number {
  const flags = data.flags[tile];
  if (flags === undefined) throw new RangeError('Java Terrain.flags bounds');
  return flags;
}

// Absence of a discovery is the original switch default (identity), not a missing-content fallback.
const discoveries: Readonly<Record<number, number>> = data.discoveries;
export function discoverTerrain(tile: number): number {
  return discoveries[tile] ?? tile;
}
