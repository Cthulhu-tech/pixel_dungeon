/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / actors/Char.java: move/distance.
 * Changes: instance-owned position and explicit geometry/world/presentation ports.
 */
export class CharacterMovement {
  private cell: number;
  private readonly geometry: PDMovementGeometry;
  private readonly actor: PDMovementActor;
  private readonly world: PDMovementWorld;
  private readonly presentation: PDMovementPresentation;
  private readonly random: PDMovementRandom;

  constructor(position: number, geometry: PDMovementGeometry, actor: PDMovementActor,
    world: PDMovementWorld, presentation: PDMovementPresentation, random: PDMovementRandom) {
    this.cell = position;
    this.geometry = geometry;
    this.actor = actor;
    this.world = world;
    this.presentation = presentation;
    this.random = random;
  }

  get position(): number { return this.cell; }

  /** Source Char.move: NOT a command validator, turn charge, or occupancy update. */
  move(step: number): void {
    if (this.geometry.adjacent(step, this.cell) && this.actor.hasVertigo()) {
      step = (this.cell + this.geometry.neighbourOffset(this.random.intTo(8))) | 0;
      if (!(this.world.isPassable(step) || this.world.isAvoid(step)) || this.world.hasCharacter(step)) return;
    }
    if (this.world.isOpenDoor(this.cell)) this.world.leaveDoor(this.cell);
    this.cell = step;
    if (this.actor.flying && this.world.isClosedDoor(this.cell)) this.world.enterDoor(this.cell);
    if (!this.actor.isHero) this.presentation.setVisible(this.world.isVisible(this.cell));
  }

  distance(other: PDPositionReader): number {
    return this.geometry.distance(this.cell, other.position);
  }
}
