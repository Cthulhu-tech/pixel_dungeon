# Actors: health and time / Здоровье и время акторов

This folder currently ports selected base `Char` behaviors, NOT the complete Char/Hero/Mob.
Source: `Char.java` at `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`.

`CharacterHealth` owns one actor's HP/HT. Its readonly snapshot is detached projection;
there is no independent Zustand/XState health store. Initialization takes a canonical
owner checkpoint; external save validation belongs to persistence, not this constructor.
`damage`, `destroy`, `die`, `isAlive` preserve their original order. `die` is virtual so a
future Hero/Mob specialization can implement the source's resurrection/death override.
Never replace that dispatch with unconditional removal before the override.

Damage removes Frost even at zero damage; immunity wins over resistance; resistance matches
exact source-class IDs, not parent categories. Paralysis checks use resulting damage and
old HP, with the original conditional number of draws. Negative damage and int overflow
are not normalized. Zero damage from a Char still produces the source's damage status.
Dead actors return before buff/random work. Destruction sets HP=0, removes the scheduler
participant including its hooks, then frees its cell. The default die adds death playback.
Removal/freeCell use dynamic owner ports, never a second occupancy index.

`CharacterTime` owns no clock: it queries Cripple/Slow/Speed and sends the resulting float32
time to the existing `TurnScheduler.spend`. Its `speed` method does not spend a turn.
No timers, wall-clock input, independent simulation or new frame loop are introduced.

Public runtime API: `index.ts`; declarations: `web/src/types/actors/health.d.ts`.
Extraction requires only these files; no browser/framework imports or hidden globals.
Class IDs and stable identity must be supplied by real actor/effect owners in composition.

Verification: selected-original Java parity, ownership/lifecycle contracts and real scheduler
integration in `web/tests`. Scripts and scope are listed in `docs/port/features/character.md`.
Position/movement, full buff ownership, Hero/Mob content, Bundle decoding and graphics remain
future work. Tests do not authorize marking all of Char.java VERIFIED.
