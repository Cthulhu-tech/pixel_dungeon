# Combat / Бой

Owner: original `Char.attack`/`Char.hit` resolution, not HP, turn cost or target selection.
Source: `src/com/watabou/pixeldungeon/actors/Char.java` at
`ce7f241515fd5c040fcf18b4beb5b7a49d9d535f` (blob `65bb59224b2574caa7939cc030d65ad68e31a9fd`).

## Public contract / Контракт

`CombatResolver` is exported by `index.ts`. Copy this folder together with
`web/src/types/combat/combat.d.ts` to extract it; no framework, DOM, other module or runtime
singleton is imported. Random, combatants and ordered effects are injected ports.
The caller authorizes the action and retains the original attack/callback/turn boundary.
Calling `attack` does not itself spend time, resume a continuation or create a target.

HP/HT belong to the actor. Combat calls its public `damage` method after attackProc and
defenseProc, never mutates health or effects directly, and keeps all virtual callbacks.
The ranged-sniper predicate must reflect `instanceof Hero && rangedWeapon != null &&
subClass == SNIPER`; it is NOT the same as `attacker == world.hero`.

## Preserved order / Сохранённый порядок

Visibility short-circuit -> two hit draws -> visible hit log -> armor draw (unless ranged
sniper) -> damageRoll -> int subtraction/clamp -> attackProc -> defenseProc -> damage ->
visible sound-pitch draw -> hero interruption/shake -> blood/flash -> isAlive -> visible
kill/failure reporting. An invisible attack still emits blood/flash requests and queries
isAlive; a visible sound uses the shared Random stream. Misses consume only hit draws in
this method and resolve the defense verb only for visible fights.

`emit` is a synchronous ordered boundary, not a general asynchronous EventBus. Effects
that consume the original shared RNG must consume it at the corresponding source phase.
Stable actor keys are presentation bindings, not newly allocated scheduler IDs. Localized
text and camera/sprite coordinates are resolved by the adapter, not by combat rules.

Java integer overflow, float32 comparison, magic multiplier and integer shake division
are preserved. In particular HT<4 can cause the original zero-divisor failure AFTER damage
and interruption: no clamping/default is introduced. A killerGlyph leaves the commented-out
source failure-report branch empty. These are source behaviors, not recommended new design.

## Evidence and limits / Проверка и границы

See `docs/port/features/character.md`. Selected Java methods supply independent expected
values; adapters are test neighbors, not a complete Hero/Mob/Buff implementation. Matching
semantic requests does not verify actual sprites, fonts, sound output or human input.
Full source coverage, production actor composition and manual browser parity remain open.
