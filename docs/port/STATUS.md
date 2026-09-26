# Фактический статус переноса

Обновлено 2026-09-26. Поручение: последовательно выполнять задачи. PLAN P00–P10 — единственная очередь.
Полной играбельной игры пока нет; следующий этап ядра выполняется без browser automation.

## Законченные участки текущего продолжения

| Участок | Реализация | Фактическая проверка |
| --- | --- | --- |
| P02: оставшиеся Random операции | collectionIndex/oneOf/element/elementWithin/collectionElement/weightedKey/shuffle/shufflePair | 6/6 новых tests, 4260 Java comparisons |
| P02: старый scalar + новый Random | Все 16 методов wrapper; коллекционный порядок явный вход | 13/13 tests вместе; 9242 comparisons |
| P02: PathFinder | exact path/step/retreat, limited map, source resize/bounds semantics | 5/5 tests, 5460 Java comparisons, включая 1049 одинаковых failure outcomes |
| P01.5: extraction | grid + declared compatibility dependency + только их .d.ts | PASS, без DOM/adapters/прочих globals |

Random записан commit `3777e64296e2a87b52bf2812702d9909ddfb79a2`.
PathFinder — следующий атомарный набор code/reference/tests/docs; current commit берётся из Git.
Подробные symbol mappings: [random](features/random.md), [pathfinding](features/pathfinding.md).

## Реальные проверки и ограничения

Из web выполнены:
- `node --experimental-strip-types --test tests/parity/random.test.mjs tests/parity/random-collections.test.mjs`: 13/13 PASS.
- `node --experimental-strip-types --test tests/parity/pathfinding.test.mjs`: 5/5 PASS, текущая матрица 5460.
- Общий промежуточный прогон трёх suites: 18/18 PASS; затем добавлены 252 unlimited cases и path suite перепроверен.
- `tsc -p tsconfig.compatibility.json`, `node <typescript/bin/tsc> -p tsconfig.kernel.json`: PASS/exit 0.
- `node tools/check-compatibility-extraction.mjs`, `node tools/check-kernel-extraction.mjs`: PASS, temporary hosts удалены.

Node 22.16.0, JDK 21.0.11, доступный TS 5.8.3. Полный clone недоступен из-за DNS;
относящиеся файлы восстановлены через GitHub connector. Исходные Random.java и PathFinder.java
проверены по Git blob. Доступный compiler используется локально, зависимости проекта не
понижались/не устанавливались. Полный package.json-набор с TS 6.0.3 ещё не проверен.

Не запускались: npm install/ci всего приложения, full typecheck/build/architecture gate,
вся инвентаризация на обоих Git trees, Android app, браузер/Playwright/CDP и ручная visual/input/audio приёмка.
Успех выбранного ядра не означает успех этих областей. `test:parity:kernel` — выбранное ядро;
общий `test:parity` сохраняет NOT_READY до полного покрытия, `test:e2e` сохраняет blocker.

## Границы результата

Random: арифметика всех wrapper методов проверена на выбранных входах; production PRNG,
сохранение его состояния, порядок владельцев HashMap/HashSet в Android и общий draw schedule открыты.
PathFinder: алгоритм перенесён отдельно; Dungeon.findPath/flee с Actor occupancy, visible,
flying/avoid и весь Actor scheduler/AI ещё не перенесены. Нет обещания готового движения героя.

Сохранены source quirks: разные draws пустых коллекций, частичные paired-shuffle mutations,
equal-endpoint stale distances, equal-area direction reuse, flattened row adjacency и bounded
queue/bounds errors. Ни одно не заменено fallback/новым алгоритмом. Public API PathFinder
требует положительные int32 dimensions; неверные размеры не объявлены частью tested parity.

## Открытые области PLAN

P00.1/P00.2: file inventory/source-map существуют, semantic coverage и aggregation feature evidence открыты.
P00.3–P00.5: две независимые Java-подсистемы работают; полная PD-classes/Android-сборка не подтверждена.
P00.6: collection owners, saves, clocks, callback phases, presentation RNG требуют дальнейшего аудита.
P01/P01-RULES: общий toolchain/lockfile, старые type imports, shaders, остальные policy gates открыты.
P02: Random wrapper + PathFinder реализованы; далее Ballistica/ShadowCaster и Actor/continuations.
P03–P10: завершение не подтверждено. Full gameplay/visual parity NOT_VERIFIED.

File-level source-map/generated summary ещё не обновляют эти symbol reports; не помечать целый
файл VERIFIED по наличию класса и не обнулять существующее при последующей генерации.

## История и сохранность

Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, Pixel Dungeon 1.9.1/74;
PD-classes candidate `c0b690a4163020963e70a58a7d4f27965dc8f134`.
`6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60` — первоначальный контекст;
`6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2` — уже существующий inventory/web scaffold;
`029fac6143cc09cc000b68c4349e1d0e990acc1f` — план/PSX-CORE правила;
`93aa9b7dba5e78fbe7e471ce49f137e839ffb8ce` — scalar Random, extraction, browser blocker и tmp ignore.

Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Reference Java добавлена только
под tests/reference с provenance. Новый код — web, harness — tools/port; временное — root tmp.
Никаких новых graphics/gameplay features, art, dependency downgrades или запуска браузера.
