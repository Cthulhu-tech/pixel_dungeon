# Фактический статус переноса

Обновлено 2026-09-26. Поручение: продолжать последовательно, задачу за задачей.
PLAN P00–P10 — единственная очередь. Полной играбельной браузерной игры ещё нет.

## Шесть выполненных участков продолжения

| Участок | Реализация | Фактическая проверка |
| --- | --- | --- |
| Random wrapper | Оставшиеся array/collection операции; всего 16 методов | 13/13 tests, 9242 Java cases |
| PathFinder | Exact path/step/flee, карты расстояний и source quirks | 5/5 tests, 5460 cases |
| Ballistica | Траектории, столкновения, trace и порядок occupancy queries | 6/6 tests, 9150 cases |
| ShadowCaster | Eight-sector visibility с исходными float32-углами | 6/6 tests, 8260 cases |
| Actor scheduler | Clocks/current/membership/hooks/ID/occupancy | 6/6 tests, 106 сценариев / 4129 checkpoints |
| Continuation gate | Stale/duplicate/foreign callbacks, cancellation, scope reset | 13/13 contracts, включая 1000 последовательных completions |

Java evidence: **32112 algorithm cases + 4129 scheduler checkpoints**. Это разные единицы
проверки, не процент готовности. Continuation contracts проверяют новый архитектурный
протокол и не прибавляются к original-Java comparisons.

## Последний фактический прогон

| Команда из web | Результат |
| --- | --- |
| `npm run test:kernel` | **49/49 PASS**, 0 skipped; все шесть Java suites + continuation contracts |
| `npm run test:contracts` | **14/14 PASS**; continuation contracts + прежний clean-Node grid import test |
| `node --test tools/contracts-entrypoint.test.mjs` | **1/1 PASS**, запускает фактический общий contract script |
| `npm run typecheck:kernel` | PASS; strict typecheck выбранных чистых модулей |
| `npm run check:extraction:compatibility` | PASS, только compatibility и его declarations |
| `npm run check:extraction:turns` | PASS, только turns и его declarations |
| `npm run check:extraction:kernel` | PASS, compatibility/grid/turns и только нужные declarations |

49 kernel tests и 14 contracts пересекаются: не складывать их как независимые уникальные tests.
Проверка общего runner обнаружила реальный дефект: старый `test:contracts` не загружал .ts
на Node22.16.0. Воспроизведён RED/exit1, добавлен флаг TS stripping, затем получены результаты
выше. Подробности — [features/contract-runner.md](features/contract-runner.md).

## Commits и evidence

Уже зафиксированные последовательные checkpoints:
Random `3777e64296e2a87b52bf2812702d9909ddfb79a2`;
PathFinder `b9f21257bdad022d411b1795455ea30753fab398`;
Ballistica `03aae50995bc979ada87d90ab50af32357d6f703`;
ShadowCaster `0984d661d020024db472a78c919b65c39b21311a`;
Actor scheduler `322c57649392fc4dc28f1419ce2dba6c537e7225`.
Continuation gate и исправление общего contract runner — текущий атомарный набор.
Symbol reports: features/random.md, pathfinding.md, ballistics.md, visibility.md, turns.md,
continuations.md. File-level source-map ещё требует согласования с этими отчётами.

Original Java algorithms неизменны; hashes проверяются до javac. Для Actor oracle порядок
membership задан LinkedHashSet через reflection и одинаковым TS input. Это **не доказательство
Android HashSet/identity hash parity**. Test-only Char/Level/Bundle/прочие классы подают входы,
не подменяют исходную очередь и не доказывают whole-game/Android/save integration.

Canonical position остаётся actors, производный Actor.chars lookup — turns. ARCHITECTURE
обновлён с этим уточнением. Grid получает query port, не создаёт второй occupancy owner.
Opaque revision меняется на act/clear/initialize, но не влияет на clocks/seed/цены ходов.
Gate хранит одну pending запись; acknowledge вызывает next, а не process. Cancel/dispose
не имитируют успех. Привязка к настоящим Phaser callbacks ещё не выполнена.

## Окружение и ограничения

Node22.16.0, npm10.9.2, JDK21.0.11, доступный TypeScript5.8.3. Полный clone недоступен из-за
GitHub DNS; относящиеся файлы восстановлены через connector. Package.json восстановлен
локально для проверки настоящих npm scripts. Project versions не понижались: заявленный
TS6.0.3 и весь dependency set не установлены и не проверены совместно.

Не выполнены full app typecheck/build/architecture gate, полный inventory replay,
whole Android/PD-classes build и human visual/input/audio acceptance. Браузер не запускался
и не автоматизировался. `test:e2e` остаётся blocker/exit2; общий `test:parity` не превращён
в ложный full PASS. Изолированные hosts и oracle class-файлы удаляются из root tmp.

## Открытая работа PLAN

P00.1/P00.2: inventory/source-map существуют; semantic completeness и aggregation evidence открыты.
P00.3–P00.5: subsystem oracles работают; whole original runtime compatibility не доказана.
P00.6: collection owners, весь random schedule, saves/clocks и остальные callbacks.
P01/P01-RULES: full toolchain/lockfile, старые type imports, shader path и остальные policy gates.
P02: production RNG/checkpoint, настоящие Char/Hero/Mob/Level и source callback integration.
P03–P10: full gameplay/visual parity NOT_VERIFIED; не ставить whole-file VERIFIED по наличию класса.

Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f` и PD-classes
`c0b690a4163020963e70a58a7d4f27965dc8f134` неизменны. До продолжения существовали initial docs
`6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60`, inventory/web checkpoint
`6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2`, PLAN/rules
`029fac6143cc09cc000b68c4349e1d0e990acc1f` и первый scalar Random
`93aa9b7dba5e78fbe7e471ce49f137e839ffb8ce`.

Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Runtime — web; references —
tests/reference; oracles — tools/port; scratch — root tmp. Нет нового арта, игровых заглушек,
сброса прошлой работы, dependency downgrade или браузерного запуска.
