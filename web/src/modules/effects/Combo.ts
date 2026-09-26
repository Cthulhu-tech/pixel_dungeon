/* Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: actors/buffs at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Changes: explicit state owners and side-effect ports, original arithmetic/order.
 */
import { Buff } from './Buff.ts';
import { toJavaInt } from '../compatibility/index.ts';

export class Combo extends Buff {
  count = 0;
  private readonly port: PDComboPort;
  constructor(clock: PDBuffClock, port: PDComboPort) { super('Combo', clock); this.port = port; }
  hit(_enemy: PDBuffTarget | null, damage: number): number {
    this.count = (this.count + 1) | 0;
    if (this.count >= 3) {
      this.port.validate(this.count); this.port.message(this.count);
      this.postpone(Math.fround(Math.fround(1.41) - Math.fround(Math.fround(this.count) / 10)));
      const product = Math.imul(damage, (this.count - 2) | 0);
      return toJavaInt(Math.fround(Math.fround(product) / 5));
    }
    this.postpone(Math.fround(1.1)); return 0;
  }
  override act(): boolean { this.detach(); return true; }
}
