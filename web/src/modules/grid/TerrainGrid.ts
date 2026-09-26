/* Pixel Dungeon Level.java; Oleg Dolya (C) 2012-2015, GPL-3.0-or-later.
 * Pinned source ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Owns terrain and derived masks. Constructor transfers a runtime map, not authored content.
 */
import { TERRAIN, terrainFlags } from './terrain.ts';
import { LEVEL_WIDTH as WIDTH, LEVEL_LENGTH as LENGTH, NEIGHBOURS4, NEIGHBOURS9 } from './geometry.ts';

export class TerrainGrid {
  private readonly map: Int32Array;
  private readonly flags: Record<PDGridFlag, Uint8Array> = {
    passable: new Uint8Array(LENGTH), losBlocking: new Uint8Array(LENGTH),
    flamable: new Uint8Array(LENGTH), secret: new Uint8Array(LENGTH),
    solid: new Uint8Array(LENGTH), avoid: new Uint8Array(LENGTH),
    water: new Uint8Array(LENGTH), pit: new Uint8Array(LENGTH), discoverable: new Uint8Array(LENGTH),
  };

  constructor(map: Int32Array) { this.map = map; }

  tileAt(cell: number): number {
    const tile = this.map[cell];
    if (tile === undefined) throw new RangeError('Java level.map bounds');
    return tile;
  }

  /** Read-only borrow. A recipient must not retain it as a second writable world. */
  mask(kind: PDGridFlag): PDGridPassability { return this.flags[kind]; }

  /** Painter.set phase; generation may write raw terrain before rebuilding masks. */
  paint(cell: number, tile: number): void {
    if (cell < 0 || cell >= this.map.length) throw new RangeError('Java level.map bounds');
    this.map[cell] = tile;
  }

  /** Level.set writes terrain BEFORE looking up flags. Boundary cells are not reclamped. */
  set(cell: number, tile: number): void {
    this.paint(cell, tile);
    this.writeFlags(cell, terrainFlags(tile), tile === TERRAIN.WATER || tile >= TERRAIN.WATER_TILES);
  }

  buildFlagMaps(): void {
    for (let i = 0; i < LENGTH; i++) {
      const bits = terrainFlags(this.tileAt(i));
      this.writeFlags(i, bits, (bits & TERRAIN.LIQUID) !== 0);
    }
    const lastRow = LENGTH - WIDTH;
    for (let i = 0; i < WIDTH; i++) {
      this.flags.passable[i] = this.flags.avoid[i] = 0;
      this.flags.passable[lastRow + i] = this.flags.avoid[lastRow + i] = 0;
    }
    for (let i = WIDTH; i < lastRow; i += WIDTH) {
      this.flags.passable[i] = this.flags.avoid[i] = 0;
      this.flags.passable[i + WIDTH - 1] = this.flags.avoid[i + WIDTH - 1] = 0;
    }
    for (let i = WIDTH; i < LENGTH - WIDTH; i++) {
      if (this.flagAt('water', i)) this.paint(i, this.waterTile(i));
      if (this.flagAt('pit', i) && !this.flagAt('pit', i - WIDTH)) {
        const above = this.tileAt(i - WIDTH);
        if (above === TERRAIN.EMPTY_SP || above === TERRAIN.STATUE_SP) this.paint(i, TERRAIN.CHASM_FLOOR_SP);
        else if (this.flagAt('water', i - WIDTH)) this.paint(i, TERRAIN.CHASM_WATER);
        else if ((terrainFlags(above) & TERRAIN.UNSTITCHABLE) !== 0) this.paint(i, TERRAIN.CHASM_WALL);
        else this.paint(i, TERRAIN.CHASM_FLOOR);
      }
    }
  }

  waterTile(cell: number): number {
    let tile = TERRAIN.WATER_TILES;
    for (const [index, offset] of NEIGHBOURS4.entries()) {
      if ((terrainFlags(this.tileAt((cell + offset) | 0)) & TERRAIN.UNSTITCHABLE) !== 0) tile += 1 << index;
    }
    return tile;
  }

  destroy(cell: number): void {
    if ((terrainFlags(this.tileAt(cell)) & TERRAIN.UNSTITCHABLE) === 0) this.set(cell, TERRAIN.EMBERS);
    else {
      let flood = false;
      for (const offset of NEIGHBOURS4) {
        if (this.flagAt('water', (cell + offset) | 0)) { flood = true; break; }
      }
      this.set(cell, flood ? this.waterTile(cell) : TERRAIN.EMBERS);
    }
  }

  cleanWalls(): void {
    for (let i = 0; i < LENGTH; i++) {
      let discoverable = false;
      for (const offset of NEIGHBOURS9) {
        const n = i + offset;
        if (n >= 0 && n < LENGTH && this.tileAt(n) !== TERRAIN.WALL && this.tileAt(n) !== TERRAIN.WALL_DECO) {
          discoverable = true; break;
        }
      }
      if (discoverable) {
        discoverable = false;
        for (const offset of NEIGHBOURS9) {
          const n = i + offset;
          if (n >= 0 && n < LENGTH && !this.flagAt('pit', n)) { discoverable = true; break; }
        }
      }
      this.flags.discoverable[i] = Number(discoverable);
    }
  }

  snapshot(): PDTerrainGridSnapshot {
    return { map: this.map.slice(), flags: {
      passable: this.flags.passable.slice(), losBlocking: this.flags.losBlocking.slice(),
      flamable: this.flags.flamable.slice(), secret: this.flags.secret.slice(), solid: this.flags.solid.slice(),
      avoid: this.flags.avoid.slice(), water: this.flags.water.slice(), pit: this.flags.pit.slice(),
      discoverable: this.flags.discoverable.slice(),
    } };
  }

  private flagAt(kind: PDGridFlag, cell: number): boolean {
    const value = this.flags[kind][cell];
    if (value === undefined) throw new RangeError('Java terrain mask bounds');
    return value !== 0;
  }

  private writeFlags(cell: number, bits: number, water: boolean): void {
    if (cell < 0 || cell >= LENGTH) throw new RangeError('Java terrain mask bounds');
    this.flags.passable[cell] = Number((bits & TERRAIN.PASSABLE) !== 0);
    this.flags.losBlocking[cell] = Number((bits & TERRAIN.LOS_BLOCKING) !== 0);
    this.flags.flamable[cell] = Number((bits & TERRAIN.FLAMABLE) !== 0);
    this.flags.secret[cell] = Number((bits & TERRAIN.SECRET) !== 0);
    this.flags.solid[cell] = Number((bits & TERRAIN.SOLID) !== 0);
    this.flags.avoid[cell] = Number((bits & TERRAIN.AVOID) !== 0);
    this.flags.pit[cell] = Number((bits & TERRAIN.PIT) !== 0);
    this.flags.water[cell] = Number(water);
  }
}
