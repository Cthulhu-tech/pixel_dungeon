/* Pixel Dungeon Char.speed/spend, Oleg Dolya 2012-2015, GPL-3.0-or-later. */
export class CharacterTime {
  private readonly ports: PDCharacterTimePorts;

  constructor(ports: PDCharacterTimePorts) { this.ports = ports; }

  speed(baseSpeed: number): number {
    const base = Math.fround(baseSpeed);
    return this.ports.hasCripple() ? Math.fround(base * 0.5) : base;
  }

  spend(time: number): void {
    let scale = 1;
    if (this.ports.hasSlow()) scale = Math.fround(scale * 0.5);
    if (this.ports.hasSpeed()) scale = Math.fround(scale * 2);
    this.ports.spend(Math.fround(Math.fround(time) / scale));
  }
}
