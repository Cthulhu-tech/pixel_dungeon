# Actors: health, time and movement / Здоровье, время и движение

This folder ports selected base Char behaviors, NOT the complete Char/Hero/Mob.
Source: Char.java at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
Public runtime API: index.ts. Own declarations: web/src/types/actors/*.d.ts.

## Health / Здоровье

CharacterHealth owns one actor's HP/HT. Its readonly snapshot is a detached projection;
there is no independent Zustand/XState health store. Initialization takes an owner checkpoint;
external save validation belongs to persistence. Damage/destroy/die/isAlive preserve source
order. Die remains virtual for future Hero/Mob resurrection and death overrides.

Damage removes Frost even at zero damage; immunity wins over resistance; resistance matches
exact source-class IDs, not parent categories. Paralysis uses resulting damage and old HP,
with source draw consumption. Negative damage/int overflow are not normalized. Zero damage
from a Char still produces its status. Dead actors return before buff/random work.
Destroy sets HP=0, removes the scheduler participant including hooks, then frees its cell.
Default die adds death playback. Removal/freeCell use ports, not a second occupancy index.

## Time / Время

CharacterTime owns no clock: it queries Cripple/Slow/Speed and sends float32 time to the
existing TurnScheduler.spend. Speed does not spend a turn. No timer or independent loop.

## Movement / Позиция и движение

CharacterMovement is the sole owner of its canonical cell. Geometry, actor flags, terrain,
doors, occupancy and visibility come through narrow ports. Renderer positions are never read.
Constructor initialization is not a save importer. Distance delegates to the same Level
geometry. Source move only tests passability/occupancy for the Vertigo-adjusted adjacent step;
it is NOT a high-level player-command validator, teleport policy or turn charge.

При отмене Vertigo позиция/двери/видимость не меняются. Leave-door/observe видят старую
позицию; enter-door/observe — новую. Flying и принадлежность герою читаются в исходных фазах.
Сам Char.move НЕ вызывает next, spend или eager occupancy update. TurnScheduler rebuilds the
derived Actor.chars index at its original boundary. Higher-level Hero/Mob movement, collision,
interaction and continuation wiring must be ported separately; do not expose a fabricated
atomic operation or charge a second turn inside this base method.

## Verification and extraction

Health/time/combat: docs/port/features/character.md. Movement/doors:
docs/port/features/movement-buffs.md. Tests exercise original Java, ownership and the real
TurnScheduler, with explicit scope. Source-token checks use the pinned full Char.java.

Extraction uses only modules/actors, its declarations and the declared pure dependencies.
The existing character/combat extraction host checks their public API without DOM/frameworks.
Movement additionally has a smaller scoped host with explicit geometry/door ports.
Actual global results remain in docs/port/STATUS.md; no duplicate progress totals here.

Remaining: production collection ordering, concrete effects/Hero/Mob content, full movement overrides,
Bundle decoding and graphics. Passing selected-method tests never verifies all of Char.java.

## CharacterBuffs / Коллекция эффектов

CharacterBuffs owns a character's effect membership and source add/remove/query/playback
ordering. It depends on narrow classification, scheduler, owner-state and presentation
ports; neither Buff target nor turn time is duplicated. Main and filtered collection order
are explicit dependencies. `find` uses the main order; `matching` constructs a separate set.
The selector factory must return a fresh empty set with the applicable original ordering.
Returned arrays are membership projections, not an alternative mutable collection.
`detachAll` snapshots before callbacks; `removeMatching` does not call Buff.detach instead
of the original Char.remove. Duplicate add and absent remove retain source side effects.

Ключи исходных сообщений — `assets/buff-labels.en.json`; renderer разрешает их в текст.
Наследование класса проверяет `PDCharacterBuffKinds`, не имя JS-конструктора. Отсутствие
sprite подавляет только исходную ветку add; remove/update не получают новый fallback.
Extraction needs actors files and only types/actors, plus the previously documented combat
scope for the shared extraction command. New evidence: docs/port/features/character-buffs.md.
