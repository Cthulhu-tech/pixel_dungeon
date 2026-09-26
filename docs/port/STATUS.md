# Фактический статус переноса

Обновлено 2026-09-26 после поручения продолжать задачу за задачей и чтения результатов CI.
PLAN P00–P10 остаётся единственной очередью. Полной играбельной браузерной игры пока нет.

## Новый проверенный участок: базовый Char — бой, здоровье и время

Исходный checkpoint: `57af2d95b2b60784df06c19e69a6454046480354`.
Код и тесты записаны одним commit `325cb12f0f996cead0489c3c8adeb90d9dfd6322`.
Добавлены `combat/CombatResolver`, `actors/CharacterHealth`, `actors/CharacterTime`, public API,
owner-scoped ambient declarations, README, strict config, extraction и независимый Java oracle.
Подробная карта восьми исходных методов и доказательств: [features/character.md](features/character.md).

**CI run36224213193 завершён и прочитан.** Kernel job108354996248 SUCCESS:
`test:kernel` **73/73 PASS**, `test:contracts` **26/26 PASS**, 0 skipped.
Новые4 Java-parity tests содержат **7596 случаев**; дополнительно прошли2 source-token tests,
9 ownership contracts и3 интеграции с настоящим TurnScheduler. Общие наборы пересекаются;
не складывать73 и26 как уникальные тесты. Source blob и executable tokens8 методов подтверждены
из полного checkout, expected не получены тестируемым TS-кодом.

Dependency job108354996241 — **FAILURE** только на позднем общем app typecheck.
До этого **TypeScript6.0.3** успешно выполнил `typecheck:character` и
`check:extraction:character`, включая negative control без деклараций. Отделение нового ядра
от Phaser/DOM проверено установленным compiler; это не обход ошибки app build.

Combat не владеет HP или часами. Health меняет HP и вызывает owner ports смерти/освобождения
клетки. Time передаёт стоимость в исходную очередь без отдельного loop. Random draw order,
Frost/Paralysis, exact-class immunity/resistance, int overflow, sniper DR exception, procs,
hero interrupt, death overrides и failure phases сохранены в проверенной матрице.
Видимый hit sound потребляет общий RNG в исходной фазе; blood/flash остаются при invisible fight.
Реальные интеграции подтвердили HP=0 до removal hook, последующее освобождение клетки/ID,
отсутствие повторной смерти и отсутствие неявного spend/resume внутри CombatResolver.
Ни Hero/Mob, ни настоящие buffs, ни renderer не подменены тестовыми соседями в runtime.

## Сохранённые предыдущие участки

| Участок | Реализация | Матрица в прошедшем kernel |
| --- | --- | --- |
| Random | Все16 wrapper operations; collection order — явный вход |13 tests /9242 Java cases |
| PathFinder | Путь/шаг/отступление и карты расстояний |5 tests /5460 cases |
| Ballistica | Траектории, столкновения, trace/query order |6 tests /9150 cases |
| ShadowCaster | Восемь секторов, float32-углы, видимость |6 tests /8260 cases |
| Actor scheduler | Время, очередь, hooks, ID и occupancy |6 tests /106 сценариев /4129 checkpoints |
| Continuations | Stale/duplicate/foreign callbacks и отмена |13 contracts, включая1000 completions |
| Navigation policy | Selected Dungeon.findPath/flee |6 tests /5776 cases |

Эти участки не переписывались; их проверки повторно прошли в CI нового commit.
Числа cases не являются процентом готовности или числом перенесённых игровых механик.

## Toolchain: оставшийся реальный блокер

Run36224213193, head325cb12f0f996cead0489c3c8adeb90d9dfd6322:
все7 pins FOUND; `npm install --ignore-scripts --no-audit --no-fund` установил46 packages;
actual compilerTS6.0.3. Общий `npm run build` завершился exit2 в tsc.

Ошибки находятся в поставляемых декларациях Phaser/rex/XState: TS2526/TS2416 Phaser,
отсутствующие Phaser3-era rex типы/imports, несовместимые NameInputDialog signatures и
XState StateSchema с exactOptionalPropertyTypes. Они совпадают с предыдущим blocker.
Vite build, общий architecture gate и поздние extraction остальных модулей skipped.
Никакие skipLibCheck, fake typings, any, downgrade или отключение strict не добавлены.
Canonical lockfile ещё отсутствует; успешного npm ci нет.

История: run36219836515 на57af2... подтвердил прежний kernel (job108342875281 SUCCESS),
но dependency job108342875191 имел тот же FAILURE. Первый run36219646875 имел оба job
FAILURE. Подробности и отозванные неподтверждённые ранние сообщения сохраняются в
[features/ci.md](features/ci.md); поздний успех не переписывает исторические failures.

## Локальные проверки и область CI

Локально до публикации: Node22.16.0/npm10.9.2/JDK21.0.11/TS5.8.3, восстановленный subset,
не полный clone. Пройдены4 parity tests /7596 cases,9 contracts, scoped tsc и extraction.
JavaRandom.ts/numbers.ts и Random.java совпали с закреплёнными blobs.
Полный source-token gate, настоящая scheduler integration и TS6 проверены последующим CI:
Node22.16.0/npm10.9.2/Temurin javac21.0.12.1, actual checkout325cb12f....

## Происхождение и границы

Source baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, PD-classes
`c0b690a4163020963e70a58a7d4f27965dc8f134` неизменны.
Char oracle — восемь выбранных исходных методов с проверкой tokens полного pinned Char.java;
navigation oracle — selected-method shell, не весь Dungeon. Actor oracle задаёт
LinkedHashSet order через reflection и не доказывает production Android identity order.
Test-only соседи не являются production Hero/Mob/Buff/Level implementations.

Прежние commits: Random3777e64296e2a87b52bf2812702d9909ddfb79a2;
PathFinder b9f21257bdad022d411b1795455ea30753fab398;
Ballistica03aae50995bc979ada87d90ab50af32357d6f703;
ShadowCaster0984d661d020024db472a78c919b65c39b21311a;
Actor322c57649392fc4dc28f1419ce2dba6c537e7225;
continuations/runner3e9acd6da3c763a3c3b6393be2733e21460e1172;
navigation dbb00c5e29ef9b6554574e1d53c2e3979e31ffaf.

## Открытые задачи и следующий участок

- P00.1/P00.2: semantic completeness и aggregation feature evidence в source-map. Новая
  посимвольная карта Char в features/character.md; вся строка Char.java НЕ VERIFIED.
- P00.3–P00.6: full original Android build, production collection order, RNG schedule,
  saves/clocks и оставшиеся callback paths.
- P01.1: strict compiler compatibility зависимостей и canonical lockfile.
- P01-RULES: старые type imports/контракты scaffold, shaders и полные policy gates.
- P02/P03/P05, следующий независимый участок: Char movement/position и полный lifecycle buffs,
  затем реальные Hero/Mob/Level, production RNG, save/checkpoint и continuation wiring.
  Проверенные базовые методы не закрывают весь Char, P03 или P05.
- P04–P10: полный content/UI/save/visual parity NOT_VERIFIED.

Браузер не запускался/не автоматизировался. Visual/input/audio acceptance ручная и отсутствует.
`test:e2e` остаётся blocker/exit2; общий `test:parity` не выдаёт ложного full PASS.
Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Runtime — web, reference —
tests/reference, oracle — tools/port; scratch только ignored root tmp, hosts очищаются.
