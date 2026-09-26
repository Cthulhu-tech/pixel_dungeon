# Grid / Клеточное ядро

## Владелец и публичная граница

Модуль содержит исходные Level constants, GridPathFinder, GridBallistica и GridShadowCaster.
Runtime API — index.ts, type-only contracts — types/grid/*.d.ts. Нет Phaser/DOM/stores,
таймеров, глобальных mutable buffers и владельца всей игры. Чистая внешняя зависимость —
compatibility/index.ts:toJavaInt для escape arithmetic. mask.ts — единое внутреннее чтение
boolean flags с исходной ошибкой bounds, не schema validator.

GridPathFinder владеет distance/goals/queue экземпляра. find/getStep/getStepBack и
buildDistanceMap сохраняют source ordering, bounded queue и failures. Passability принадлежит
вызывающему владельцу; distanceAt/copyDistanceMap — readonly query/detached projection.
Equal-area reshape, stale map на from==to и flattened adjacency сохранены. Dungeon-level
occupancy/visible/flying/avoid composition ещё не подключена.

GridBallistica владеет trace/distance. cast получает query-only PDBallisticaWorld; traceAt/
copyTrace не создают второй live owner. Сохраняются duplicate target, magic continuation,
wall rollback, short-circuit occupancy, failed-write increment и stale tail.

GridShadowCaster владеет scratch obstacle intervals и derived rounding table. castShadow
получает x/y, output Uint8Array, int distance 0–8 и blocker mask. Output — явно переданная
изменяемая проекция, исходный отдельный blocker не мутируется. Сохраняются все восемь
секторов, float32 endpoints, row-delayed occlusion, radius0 и invalid-radius behavior.

Constructors требуют положительные целые dimensions. Ballistica/ShadowCaster parity
проверена на исходных 32×32, не на всех произвольных размерах. Domain buffs, AI, Actor
occupancy ownership и Level.updateFieldOfView должны использовать эти алгоритмы отдельно.

## Проверки и переносимость

| Команда | Последний фактический результат |
| --- | --- |
| test:parity:pathfinding | 5/5 tests, 5460 independent Java cases |
| test:parity:ballistics | 6/6 tests, 9150 cases |
| test:parity:visibility | 6/6 tests, 8260 cases |
| test:parity:kernel | 30/30 tests, 32112 cases с обоими Random suites |

Все исходные algorithm files hash-checked. Test-only Java Level/Actor supply inputs, не
подменяют алгоритмы и не доказывают всю Android integration. Ожидаемые ответы вычисляет Java.
Typecheck/extraction kernel прошли с grid + compatibility + только их declarations, без DOM
и остальных globals. Node22.16.0/JDK21.0.11/доступный TS5.8.3; полный package.json-набор не установлен.

Для выноса: modules/grid, modules/compatibility, types/grid, types/compatibility, сохранение GPL.
Runtime scratch освобождается с экземпляром; нет ресурсов для фиктивного lifecycle/dispose.
Подробные mappings: docs/port/features/pathfinding.md, ballistics.md, visibility.md.

## English

Pure instance-owned ports preserve the original pathfinding, ballistic and shadow-casting
algorithms, not substitutes from A*/navcat/FOV libraries. Caller masks and actor/world
ownership remain separate. Shadow intervals use explicit float32 steps and original row
semantics; radius zero and failure-before-clear behavior match the source.

The combined kernel run with Random passes 30 tests / 32112 Java comparisons. Scoped
extraction passes with only grid, its explicit compatibility dependency and their ambient
contracts. This is not a full application build, original Level/Actor integration, or
browser/visual verification. Those gates remain open.
