# Effects / Состояния персонажа и клеточные поля

Public runtime API: index.ts. Own contracts/data: types/effects/*.d.ts and assets/.
The only pure module dependency is compatibility; extraction copies only these owners,
their declarations/data and licenses. No frameworks, DOM, global clocks or import-time work.

## Buff ownership and lifecycle

Buff owns the attached target reference and exact class ID. The character owns buff membership,
HP and status flags; TurnScheduler owns time. Base Buff.act deactivates; FlavourBuff.act detaches.
Source target retention, repeated detach, immunity rejection and original empty Actor hooks
are preserved. Application teardown idempotency must not rewrite these gameplay transitions.

BuffOperations ports append/affect/prolong/detach. Append creates a new object and ignores a
false immunity attach, as the source does. Affect reuses the first matching object. Durations
add via spend; prolong uses postpone. Collection/class matching belongs to the character owner,
not JS constructor names. Factory errors are classified/reported at an explicit port: source
caught Java Exceptions return null, fatal errors propagate; duration helpers retain null failures.

## Concrete effects

SimpleStatuses, ControlStatuses, VisionStatuses, Invisibility and Shadows cover16 status classes.
Poison, Bleeding, Barkskin, Fury, Ooze, Regeneration, Hunger, SnipersMark, Charm, Terror,
GasesImmunity, Weakness, Combo, Frost and Burning cover the other15 top-level concrete classes.
This source-file accounting does not assert that all game integrations and combinations work.

Source display metadata/constants are immutable owner-local JSON, consumed directly without
schema validation, normalization or defensive cloning/freezing. Own Bundle fields such as
left/level/object are explicit checkpoints; clock/id remain with turns. Fields absent from the
source save (e.g. MindVision.distance or Barkskin/Combo state) are not silently persisted.
Actor/item/level/ending operations use typed ports; test neighbors never replace production
Hero/inventory/traps. Ending text belongs to run; effect messages belong to effects.

## BlobField / Газ по клеткам

BlobField owns current/off concentration buffers and volume. Its clock delegates to turns;
act spends TICK even when volume is non-positive. Evolution preserves cardinal averaging,
int32 arithmetic, decay, two-buffer border history and partial failure phases. Subclasses can
extend evolve before swapping. seed/clear operate only on this field, not the level terrain.

Own-state projection is decoded source fields, not an external save parser. It stores the
positive bounding range or no fields; restore remains additive and retains the original
loadedMapSize copy phase. No defaults/reset or duplicate actor clock. Snapshots are detached.
Supply original32x32 dimensions and a live solid-mask query. Generalized sizes are not claimed
as verified. Static class factory, emitter/use/tileDesc and concrete gas/fire interactions are
still separate tasks, not generic fallback behavior supplied by the base field.

## Evidence / Границы

See docs/port/features/{movement-buffs,character-buffs,status-effects,resource-effects,
observation-blobs}.md and current STATUS.md. Full unchanged Java sources compile with explicit
test adapters; actual TurnScheduler/CharacterStatus/terrain integrations have separate tests.
Run typecheck:effects and check:extraction:effects. Browser checks are never launched by agents.
Production actor/item composition, nested item effects, complete save IO and visual acceptance
remain open. Passing selected matrices does not authorize full P03/P06 or game VERIFIED.
