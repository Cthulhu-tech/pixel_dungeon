# Фактический статус переноса

Обновлено 2026-09-26 после очередного поручения продолжать задачу за задачей.
PLAN P00–P10 остаётся единственной очередью. Полной играбельной браузерной игры пока нет.

## Новый участок: базовый Char — бой, здоровье и время

Исходный checkpoint этой сессии: `57af2d95b2b60784df06c19e69a6454046480354`.
Добавлены `combat/CombatResolver`, `actors/CharacterHealth`, `actors/CharacterTime`, их
public API, owner-scoped ambient declarations, README, отдельный strict config и extraction.
Соответствия исходным восьми методам, commands, ограничения: [features/character.md](features/character.md).

Локально выполнены: 4 Java-parity tests /7596 cases, 9 ownership contracts, scoped typecheck
и extraction с negative control. Node22.16.0/npm10.9.2/JDK21.0.11/available TS5.8.3;
восстановленные относящиеся файлы, не полный clone. Это не подтверждение TS6 всего приложения.
Новые source-token tests и три интеграционных теста с реальным TurnScheduler включены в CI;
до чтения результата полного checkout они НЕ объявляются пройденными.

Combat не владеет HP или часами. Health меняет HP и вызывает owner ports смерти/освобождения
клетки. Time передаёт стоимость в исходную очередь без отдельного loop. Random draw order,
Frost/Paralysis, exact-class immunity/resistance, int overflow, sniper DR exception, procs,
hero interrupt, death overrides и failure phases сохранены. Видимый hit sound потребляет
общий RNG в своей исходной фазе; blood/flash не исчезают только из-за invisible fight.
Ни Hero/Mob, ни настоящие buffs, ни renderer не подменены тестовыми соседями в runtime.

## Сохранённые предыдущие участки

| Участок | Реализация | Прежняя матрица |
| --- | --- | --- |
| Random | Все16 wrapper operations; collection order — явный вход |13 tests /9242 Java cases |
| PathFinder | Путь/шаг/отступление и карты расстояний |5 tests /5460 cases |
| Ballistica | Траектории, столкновения, trace/query order |6 tests /9150 cases |
| ShadowCaster | Восемь секторов, float32-углы, видимость |6 tests /8260 cases |
| Actor scheduler | Время, очередь, hooks, ID и occupancy |6 tests /106 сценариев /4129 checkpoints |
| Continuations | Stale/duplicate/foreign callbacks и отмена |13 contracts, включая1000 completions |
| Navigation policy | Selected Dungeon.findPath/flee |6 tests /5776 cases |

Эти участки не переписывались. На исходном checkpoint реальные CI результаты ниже
подтвердили прежний kernel и general contracts. Числа cases не являются процентом готовности.

## Реальный CI: уже проверенные факты

Run `36219836515`, head `57af2d95b2b60784df06c19e69a6454046480354`:
- kernel job `108342875281`: **SUCCESS**. Восстановление exact PathFinder reference успешно;
  прежние tests kernel/contracts и registry audit завершились без ошибки.
- dependency job `108342875191`: **FAILURE**. Все7 pins FOUND, install добавил46 packages,
  actual compiler TS6.0.3. Общий typecheck падает в декларациях Phaser/rex/XState.

Сохраняются TS2526/TS2416 Phaser, отсутствующие Phaser3-era rex типы/imports и XState
StateSchema exactOptionalPropertyTypes errors. Общий Vite build и последующие gates не
выполнялись. Никакие skipLibCheck, fake typings, any, downgrade или отключение strict не
добавлены. Canonical lockfile ещё отсутствует; успешного npm ci нет.

Новый workflow проверяет scoped character typecheck/extraction установленным compiler
ДО общего app build. Это независимое доказательство pure modules, не обход app failure.
Результат нового run после этого изменения должен быть прочитан по его фактическому head.

История первого CI и отозванных ранних неподтверждённых сообщений сохранена в
[features/ci.md](features/ci.md). Первый run36219646875 имел оба job FAILURE; не заменять его
исторический результат более поздним успешным kernel run.

## Происхождение и границы

Source baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, PD-classes
`c0b690a4163020963e70a58a7d4f27965dc8f134` неизменны.
Char oracle — восемь выбранных исходных методов, executable tokens сравниваются с
hash-pinned полным Char.java. Navigation oracle также selected-method shell, не весь Dungeon.
Actor oracle задаёт LinkedHashSet order через reflection, не доказывает Android identity order.
Test-only соседние объекты не являются production Hero/Mob/Buff/Level implementations.

Прежние commits: Random3777e64296e2a87b52bf2812702d9909ddfb79a2;
PathFinder b9f21257bdad022d411b1795455ea30753fab398;
Ballistica03aae50995bc979ada87d90ab50af32357d6f703;
ShadowCaster0984d661d020024db472a78c919b65c39b21311a;
Actor322c57649392fc4dc28f1419ce2dba6c537e7225;
continuations/runner3e9acd6da3c763a3c3b6393be2733e21460e1172;
navigation dbb00c5e29ef9b6554574e1d53c2e3979e31ffaf.

## Открытые задачи

- P00.1/P00.2: semantic completeness и aggregation feature evidence в source-map. Новая
  посимвольная карта Char в features/character.md; вся строка Char.java НЕ VERIFIED.
- P00.3–P00.6: full original Android build, production collection order, RNG schedule,
  saves/clocks и оставшиеся callback paths.
- P01.1: strict compiler compatibility зависимостей и canonical lockfile.
- P01-RULES: старые type imports/контракты scaffold, shaders и полные policy gates.
- P02/P03/P05: полный Char/buffs/движение, реальные Hero/Mob/Level, production RNG,
  save/checkpoint и continuation wiring. Проверенные базовые методы не закрывают всё P03/P05.
- P04–P10: полный content/UI/save/visual parity NOT_VERIFIED.

Браузер не запускался/не автоматизировался. Visual/input/audio acceptance ручная и отсутствует.
`test:e2e` остаётся blocker/exit2; общий `test:parity` не выдаёт ложного full PASS.
Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Runtime — web, reference —
tests/reference, oracle — tools/port; scratch только ignored root tmp, hosts очищаются.
