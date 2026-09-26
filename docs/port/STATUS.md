# Фактический статус переноса

Обновлено 2026-09-26. Продолжение: задача за задачей. PLAN P00–P10 — единственная очередь.
Полной играбельной игры нет. Четыре алгоритмических участка реализованы и проверены отдельно.

## Результат продолжения

| Участок P02 | Реализовано | Java evidence |
| --- | --- | --- |
| Оставшийся Random | Все16 wrapper operations, коллекционный порядок — explicit input | 13/13 tests, 9242 cases |
| PathFinder | path/step/flee, maps, source ordering/bounds | 5/5 tests, 5460 cases |
| Ballistica | collision/trace/distance, query order, magic/hitChars | 6/6 tests, 9150 cases |
| ShadowCaster | eight-sector visibility, float32 intervals, радиусы0–8 | 6/6 tests, 8260 cases |

**Последний совместный прогон: 30/30 PASS, 32112 original-Java comparisons, 0 skipped.**
Команда из web: `node --experimental-strip-types --test tests/parity/random.test.mjs tests/parity/random-collections.test.mjs tests/parity/pathfinding.test.mjs tests/parity/ballistics.test.mjs tests/parity/visibility.test.mjs`.
`test:parity:kernel` обновлён на эти пять suites; это не полный parity всей игры.
Scoped `tsc -p tsconfig.kernel.json` и `node tools/check-kernel-extraction.mjs` — PASS.
Host содержит только grid, compatibility и собственные declarations; tmp очищен.

Коммиты: Random `3777e64296e2a87b52bf2812702d9909ddfb79a2`, PathFinder
`b9f21257bdad022d411b1795455ea30753fab398`, Ballistica
`03aae50995bc979ada87d90ab50af32357d6f703`; ShadowCaster — текущий атомарный набор.
Symbol mapping/evidence: features/random.md, pathfinding.md, ballistics.md, visibility.md.

## Границы доказательства

Original algorithm Java files byte-identical pinned blobs, проверяемые до javac. Для
Ballistica/ShadowCaster test-only Level/Actor задают входные flags/occupancy, не являются
production implementations. Expected получают оригинальные алгоритмы, не TS-порт.
Shadow suite сравнивает все1024 клетки и blockers, repeat/alias и invalid-radius outcomes.
Нет переписывания алгоритмов, fallback или изменения исходных quirks.

Окружение: Node22.16.0, JDK21.0.11, локально доступный TS5.8.3. Полный clone недоступен
из-за GitHub DNS; относящиеся текстовые files восстановлены через connector. Project
versions не менялись; npm install/ci полного набора с TS6.0.3 не выполнен.

**Не выполнялись:** full app typecheck/build/architecture gate, полная inventory проверка,
Android/PD-classes application build, запуск/автоматизация браузера, ручная visual/input/audio
приёмка. 30 passed tests не означают прохождение этих gates. test:e2e остаётся blocker/exit2,
общий test:parity не превращён в ложный PASS. Число cases не является процентом готовности.

## Открытые задачи

P00.1/P00.2: file-level inventory/source-map есть; semantic coverage и aggregation evidence открыты.
P00.3–P00.5: subsystem oracles работают, whole Android/runtime compatibility не подтверждена.
P00.6: HashMap/HashSet владельцы, полный random consumption schedule, saves/clocks/callbacks.
P01/P01-RULES: полный toolchain/lockfile, старые type imports, shaders и прочие policy gates.
P02: следующая задача — Actor scheduler/continuations; production RNG/save и integration
Dungeon.findPath/flee/Level.updateFieldOfView с героями, buffs и AI ещё не реализованы.
P03–P10: завершение не подтверждено; full gameplay/visual parity NOT_VERIFIED.

Source-map/generated summary ещё не агрегируют feature reports; не сбрасывать старые записи
и не назначать whole-file VERIFIED по наличию отдельного класса. Grid public dims положительные;
Ballistica/ShadowCaster доказательство относится к исходной карте32×32 и описанным входам.

## История и сохранность

Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, Pixel Dungeon1.9.1/74;
PD-classes `c0b690a4163020963e70a58a7d4f27965dc8f134` неизменны.
`6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60` — initial docs;
`6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2` — ранее существовавший inventory/web;
`029fac6143cc09cc000b68c4349e1d0e990acc1f` — согласованный PLAN и PSX/CORE rules;
`93aa9b7dba5e78fbe7e471ce49f137e839ffb8ce` — scalar Random/oracle/extraction/browser blocker.

Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Runtime — web, references —
tests/reference, oracle — tools/port, scratch — root tmp. Нет нового арта, игровых заглушек,
сброса старой работы, dependency downgrade или запуска браузера.
