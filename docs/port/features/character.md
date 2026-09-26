# P03 / P05 — базовые Char: бой, здоровье и время

Source: `Cthulhu-tech/pixel_dungeon@ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`,
`src/com/watabou/pixeldungeon/actors/Char.java`, blob `65bb59224b2574caa7939cc030d65ad68e31a9fd`.
Это детализация единого PLAN, не отдельная очередь.

| Symbols | Owner / target | Подтверждённая матрица |
| --- | --- | --- |
| attack, hit | combat/CombatResolver.ts | 516 hit + 2344 attack selected Java cases |
| damage, destroy, die, isAlive | actors/CharacterHealth.ts | 3384 damage/lifecycle selected Java cases |
| speed, spend | actors/CharacterTime.ts | 1352 float32/timing selected Java cases |

Итого **7596 случаев**. Сравниваются порядок логов/звука/крови/flash, callbacks,
модификаторов, проверок buffs, RNG draws и состояния HP/HT. 114 ожидаемых failures включают
исчерпание тестового draw tape и исходное деление на ноль при HT<4. Не исправлять исходную
арифметику/ветки молча; stack/error text Java и JS не обещаны идентичными.

Independent expected: selected original Java methods in `tests/reference/character/CharReference.java`.
Source-token gate checks these methods against the hash-pinned full Char.java in the checkout;
full original Random.java is separately hash-checked before instrumentation of Math.random only.
No expected values come from TS. Oracle neighbors are test adapters, not playable Hero/Mob/Buff.

## CI из полного checkout: подтверждено

Code commit: `325cb12f0f996cead0489c3c8adeb90d9dfd6322`.
Run: `36224213193`, workflow `Port verification (no browser)`.
Kernel job: `108354996248` **SUCCESS**; его журнал прочитан после завершения.
Окружение: Node22.16.0, npm10.9.2, Temurin `javac 21.0.12.1`.

| Команда / проверка | Результат |
| --- | --- |
| `npm run test:kernel` | **73/73 PASS**, 0 skipped; новые tests и прежнее ядро |
| `character-source.test.mjs` внутри kernel | **2/2 PASS**: исходный blob и токены 8 методов; negative token controls |
| `character.test.mjs` parity внутри kernel | **4/4 PASS**, 7596 Java cases |
| `character.test.mjs` contracts | **9/9 PASS** |
| `character-turns.test.mjs` contracts | **3/3 PASS** с настоящим TurnScheduler |
| `npm run test:contracts` | **26/26 PASS**, 0 skipped; часть тестов также входит в kernel |
| contract-entrypoint regression | **1/1 PASS** |
| registry audit fixtures | **5/5 PASS** |

Нельзя складывать73 и26 как число уникальных тестов: наборы частично пересекаются.
Реальные интеграционные тесты подтвердили порядок HP=0/remove hook/freeCell, удаление ID,
отсутствие повторной смерти, Slow/Speed в существующих часах и отсутствие неявного
spend/resume при вызове CombatResolver.

Dependency job `108354996241`: общая **FAILURE**, но scoped шаг **SUCCESS**:
- Все7 dependency pins FOUND; install46 packages без scripts/browser.
- Actual compiler **TypeScript6.0.3**.
- `npm run typecheck:character` — PASS.
- `npm run check:extraction:character` — PASS, включая negative control без declarations.
- Затем общий `npm run build` падает на прежних декларациях Phaser/rex/XState. Vite build,
  общий architecture gate и поздние extraction остальных владельцев skipped.

Это не зелёный app build и не полная browser-совместимость. Никакие skipLibCheck/any,
фиктивные типы, downgrade, отключение strict или скрытый fallback не добавлены.

## Выполнено локально до CI

Node22.16.0 / npm10.9.2 / JDK21.0.11 / available TS5.8.3, restored relevant files, not full clone.
- `node --experimental-strip-types --test tests/parity/character.test.mjs`: 4/4 PASS,7596 cases.
- `node --experimental-strip-types --test tests/contracts/character.test.mjs`: 9/9 PASS.
- `tsc -p tsconfig.character.json`: PASS.
- `node tools/check-character-extraction.mjs`: PASS, isolated host и negative control.
Local JavaRandom.ts/numbers.ts hashes match their checkpoint blobs; Random.java matches the pin.
Полный source-token gate и real scheduler integration подтверждены именно последующим CI,
а не приписаны локальному subset-прогону.

## API и границы доказательства

Combat owns no HP or turn queue; it calls public actor damage. Health owns HP/HT only; death
routes scheduler removal/freeCell through ports. Time modifies only the existing actor clock.
The synchronous effect port preserves shared random consumption; no async event bus, frame
delta combat, hidden singleton, runtime shader or new gameplay loop was added.
A health snapshot constructor is not a save importer; complete Bundle mapping remains P09.

Это **не полный Char, Hero, Mob, Buff или UI**. Существующие проверки не доказывают
per-class skills, полные buffs, production run composition, анимационные кадры, save migration
или browser input/audio. Новые методы имеют подтверждённую выбранную матрицу; вся строка
Char.java в source-map НЕ VERIFIED. Aggregation полного реестра остаётся P00.2.
Следующие части владельца: движение/позиция, полный lifecycle buffs, реальные Hero/Mob и
интеграция с continuation protocol. Полный P03/P05 остаётся незавершённым.
