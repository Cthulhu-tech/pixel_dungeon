# P03 / P05 — базовые Char: бой, здоровье и время

Source: Cthulhu-tech/pixel_dungeon@ce7f241515fd5c040fcf18b4beb5b7a49d9d535f,
`src/com/watabou/pixeldungeon/actors/Char.java`, blob65bb59224b2574caa7939cc030d65ad68e31a9fd.
Это детализация единого PLAN, не отдельная очередь.

| Symbols | Owner / target | Evidence |
| --- | --- | --- |
| attack, hit | combat/CombatResolver.ts | 516 hit +2344 attack selected Java cases |
| damage, destroy, die, isAlive | actors/CharacterHealth.ts | 3384 damage/lifecycle selected Java cases |
| speed, spend | actors/CharacterTime.ts | 1352 float32/timing selected Java cases |

Итого7596 случаев. Порядок логов/звука/крови/flash, callbacks, модификаторов, проверок buffs,
RNG draws и состояний HP/HT сравнивается целиком. 114 ожидаемых failures включают исчерпание
тестового draw tape и реальное исходное деление на ноль при HT<4. Не исправлять исходную
арифметику/ветки молча; stack/error text Java и JS не обещаны идентичными.

Independent expected: selected original Java methods in tests/reference/character/CharReference.java.
Source-token gate checks these methods against the hash-pinned full Char.java in the checkout;
full original Random.java is separately hash-checked before instrumentation of Math.random only.
No expected values come from TS. Oracle neighbors are test adapters, not playable Hero/Mob/Buff.

## Выполнено локально

Node22.16.0 / npm10.9.2 / JDK21.0.11 / available TS5.8.3, restored relevant files, not full clone.
- node --experimental-strip-types --test tests/parity/character.test.mjs: 4/4 PASS;7596 cases.
- node --experimental-strip-types --test tests/contracts/character.test.mjs: 9/9 PASS.
- tsc -p tsconfig.character.json: PASS.
- node tools/check-character-extraction.mjs: PASS; isolated host, missing-declaration negative control.
Actual local JavaRandom.ts and numbers.ts hashes match their checkpoint blobs; Random.java
matches the pinned reference. Complete source provenance and real scheduler integration are
mandatory in repository CI; their results are not assumed from these local runs.

## Смысл API

Combat owns no HP or turn queue; it calls public actor damage. Health owns HP/HT only; death
routes scheduler removal/freeCell through ports. Time modifies only the existing actor clock.
The synchronous effect port preserves shared random consumption; no async event bus, frame
delta combat, hidden singleton, runtime shader or new gameplay loop was added.
A health snapshot constructor is not a save importer; complete Bundle mapping remains P09.

## Ограничения

This is NOT complete Char, Hero, Mob, original buff implementations, per-class skills or UI.
No production full-run composition, animation continuation wiring, save migration or human
browser evidence is supplied by these tests. Do not mark the entire source-map Char.java row
VERIFIED. Overall map aggregation remains P00.2. Full vendor-dependent strict app compile
remains blocked by the previously recorded declaration errors; no skipLibCheck/any bypass.
