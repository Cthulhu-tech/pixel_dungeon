/** Query-only view of authoritative world flags and character occupancy. */
interface PDBallisticaWorld {
  readonly passable: PDGridPassability;
  readonly avoid: PDGridPassability;
  readonly losBlocking: PDGridPassability;
  hasCharacter(cell: number): boolean;
}
