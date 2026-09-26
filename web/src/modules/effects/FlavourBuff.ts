/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / actors/buffs/FlavourBuff.java.
 */
import { Buff } from './Buff.ts';

export class FlavourBuff extends Buff {
  override act(): boolean { this.detach(); return true; }
}
