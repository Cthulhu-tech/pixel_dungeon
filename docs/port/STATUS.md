# Фактический статус переноса

Обновлено 2026-09-26. Продолжение: задача за задачей, PLAN P00–P10 остаётся единственной очередью.
Полной играбельной игры ещё нет. Реализованы следующие законченные алгоритмические участки.

## Результат текущего продолжения

| Участок P02 | Результат | Проверки |
| --- | --- | --- |
| Оставшиеся Random операции | Все 16 wrapper methods; порядок коллекции — явный вход | 13/13 tests (старые + новые), 9242 Java cases |
| PathFinder | exact path/step/retreat, limits, full distance buffer и исходные ошибки | 5/5 tests, 5460 cases |
| Ballistica | collision/trace/distance, magic/hitChars, query order, reused buffer | 6/6 tests, 9150 cases |

**Последний общий прогон: 24/24 PASS, 23852 сравнений с исходным Java, 0 skipped.**
Команда из web: `node --experimental-strip-types --test tests/parity/random.test.mjs tests/parity/random-collections.test.mjs tests/parity/pathfinding.test.mjs tests/parity/ballistics.test.mjs`.
Она теперь доступна как `test:parity:kernel`; это НЕ общий parity всей игры.

`node <typescript/bin/tsc> -p tsconfig.kernel.json`, `node tools/check-kernel-extraction.mjs`
и `node tools/check-compatibility-extraction.mjs` — PASS. Изолированный host включает только
grid, compatibility и их owner-scoped .d.ts; нет DOM/остальных globals, temporary hosts удалены.

Отдельные коммиты: Random `3777e64296e2a87b52bf2812702d9909ddfb79a2`;
PathFinder `b9f21257bdad022d411b1795455ea30753fab398`; Ballistica — текущий атомарный набор.
Symbol mappings: features/random.md, features/pathfinding.md, features/ballistics.md.

## Достоверность и границы

Reference Random/PathFinder/Ballistica byte-identical pinned blobs, hashes проверяются до javac.
Ballistica test-only Level/Actor дают фиксированные flags/occupancy и записывают query order;
это не реализации production Level/Actor и не Android evidence. Expected считает оригинальный
Ballistica.java. Java array failure/частичные buffers сравниваются, а не превращаются в success.

Source quirks сохранены: RNG empty-draw/paired mutation; PathFinder neighbor order, equal-area
resize, equal-endpoint stale map, flattened adjacency/bounded queue; Ballistica duplicate
target, wall rollback, short-circuit lookup, trace overflow post-increment и stale tail.
Общее чтение boolean mask вынесено в grid/mask.ts; PathFinder регрессии повторно прошли.

Node 22.16.0, JDK 21.0.11, доступный TS 5.8.3. Полный clone недоступен из-за GitHub DNS;
относящиеся файлы восстановлены через connector. Project dependency versions не изменялись
и полный npm install/ci не выполнен. Доступный локальный compiler не доказывает работу TS 6.0.3.

**Не выполнено:** full app typecheck/build/architecture gate, полная source inventory проверка,
полная Android/PD-classes сборка, browser launch/automation и ручная visual/input/audio приёмка.
Остающиеся Playwright файлы не запускались; npm test:e2e — blocker/exit 2. Общий test:parity
не выдаёт ложный PASS. Количество cases не является процентом готовности.

## Что остаётся по плану

- P00.1/P00.2: inventory/source-map существуют; semantic полнота и aggregation feature evidence открыты.
- P00.3–P00.5: независимые subsystem oracles работают; полный Android runtime ещё не подтверждён.
- P00.6: HashMap/HashSet владельцы, общий random draw schedule, callbacks, saves и clocks.
- P01/P01-RULES: full toolchain/lockfile, старые type imports, shader policy, остальные checks.
- P02: далее ShadowCaster и Actor/continuations. Production RNG/save state и Dungeon.findPath/flee
  с visible/flying/avoid/Actor occupancy ещё не интегрированы.
- P03–P10: завершение не подтверждено; full gameplay/visual parity NOT_VERIFIED.

Public APIs grid принимают положительные dimensions; Ballistica parity проверена для исходных
32×32. Ports не владеют чужими masks/actors. Save, combat damage, AI и анимации не объявляются
реализованными по одному геометрическому алгоритму. Source-map/generated summary пока не
агрегируют symbol reports; не обнулять имеющееся и не ставить whole-file VERIFIED автоматически.

## История и сохранность

Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f` (Pixel Dungeon 1.9.1/74), PD-classes
`c0b690a4163020963e70a58a7d4f27965dc8f134` неизменны.
`6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60` — первичные docs;
`6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2` — ранее существовавший inventory/web scaffold;
`029fac6143cc09cc000b68c4349e1d0e990acc1f` — согласованный PLAN и PSX/CORE rules;
`93aa9b7dba5e78fbe7e471ce49f137e839ffb8ce` — scalar Random, первый oracle/extraction и browser blocker.

Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Новые runtime files — web,
references — tests/reference, input harness — tools/port, временное — root tmp. Нового арта,
игровых заглушек, dependency downgrade, браузерного запуска или reset существующей работы нет.
