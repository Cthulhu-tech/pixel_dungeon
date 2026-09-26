# Grid / Клеточное ядро и состояние уровня

Public runtime API is `index.ts`; own types are `web/src/types/grid/*.d.ts`.
No Phaser, DOM, XState, stores, timers or global mutable world. The existing pure dependency
is compatibility.toJavaInt. Extraction includes grid, compatibility, their declarations and
owner-local assets/terrain.json, never the whole application's type tree.

## Owners

- GridPathFinder owns distance/goals/queue. GridBallistica owns trace/distance. GridShadowCaster
  owns scratch intervals; LevelSight owns its per-level reusable field-of-view output.
- GridNavigation owns only its scratch passability mask; actor/world queries are injected.
- TerrainGrid owns the transferred runtime map and nine derived masks. The constructor's caller
  relinquishes mutation; masks are read-only borrows and snapshots are detached runtime copies.
- LevelExploration owns transferred visited/mapped buffers per level. Stable hero visibility
  belongs to run/RunObservation, not to the reusable LevelSight output.
- GridDoors owns no terrain: it calls the terrain/observation/presentation ports in source order.

Canonical character position belongs to actors; the derived Actor.chars index belongs to turns.
Grid never creates a second occupancy owner or recomputes it outside the original phases.

## Source behavior

Paths, trajectories and visibility retain original ordering, Java numbers and bounded failures.
Flattened adjacency deliberately differs from geometric distance<=1. Find allows avoid cells
with flight/Amok/Rage, flee only with flight. Only visible actors block the general path mask;
adjacent checks query occupancy regardless of visibility. Backend masks are synchronous borrows.

TerrainGrid.paint is raw Painter.set. set writes terrain before looking up flags and does not
clamp boundary cells. buildFlagMaps clamps boundaries, then stitches water and pit IDs. Its
water test differs from set for unused IDs. cleanWalls and destroy/flood preserve neighbor order;
no implicit FOV refresh, turn charge, sound or extra rebuild is introduced. Terrain tables are
exported by the original Java class and consumed without normalization/schema/default pipelines.

LevelSight composes the real caster with Blindness/Shadows, MindVision, Huntress and Awareness.
Sensing intersects the entire FOV with discoverable before creature/heap reveal; query and
partial-write order matter. Another actor query overwrites this borrowed output. RunObservation
copies hero sight before recording exploration, so monster sight cannot corrupt hero visibility.
LevelExploration.remember is the original short-circuit visited OR visible. mapCell only writes
mapped[cell]; it is not a spell, implicit visit or observation trigger.

Door.enter: set-open -> updateMap -> observe -> visibility -> optional sound. Door.leave checks
heap first, then set-closed -> updateMap -> observe. Observation sees the old character position
on leave and the new position on enter when called through the original base movement.

## Verification / Проверки

Evidence and source pins are in docs/port/features/{pathfinding,ballistics,visibility,navigation,
movement-buffs,terrain-sight,observation-blobs}.md. Current totals/CI are in STATUS.md.
Full-file algorithms are hash-checked; selected Level/Dungeon methods are extracted or token-
checked against their pinned sources. Test-only neighbors are input adapters, not production
Hero/Mob/Level replacements. Real-owner tests integrate terrain, doors, caster and scheduler.

Parity claims apply to the original32x32 cases; generalized dimensions are not automatically
verified. Full Level generation/press/traps, items, saved-game decoding, fog rendering and
manual browser acceptance remain unfinished. A green build is not full game parity.
