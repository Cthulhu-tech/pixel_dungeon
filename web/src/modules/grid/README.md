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
получает x/y, output Uint8Array, int distance0–8 и blocker mask. Output — явно переданная
изменяемая проекция, отдельный blocker не мутируется. Сохраняются восемь секторов, float32
endpoints, row-delayed occlusion, radius0 и invalid-radius behavior.

Constructors требуют положительные целые dimensions. Ballistica/ShadowCaster parity
проверена на исходных32×32, не на всех произвольных размерах. Canonical actor position —
actors; derived Actor.chars lookup теперь перенесён в turns. Grid получает его через
query port, не создаёт второй occupancy index. Integration с buffs/AI/Level ещё открыта.

## Проверки и переносимость

| Команда | Подсистемный результат |
| --- | --- |
| test:parity:pathfinding | 5/5 tests, 5460 independent Java cases |
| test:parity:ballistics | 6/6 tests, 9150 cases |
| test:parity:visibility | 6/6 tests, 8260 cases |
| test:parity:kernel / test:kernel | Актуальный общий состав и totals: docs/port/STATUS.md |

Исходные algorithm files hash-checked. Test-only Java Level/Actor supply inputs, не
подменяют алгоритмы и не доказывают whole Android integration. Expected вычисляет Java.
Typecheck/extraction проходят без DOM/adapters/остальных globals. Grid зависит только от
compatibility; общий kernel host дополнительно содержит turns и его declarations.
Node22.16.0/JDK21.0.11/доступный TS5.8.3; полный package.json-набор не установлен.

Для выноса grid: modules/grid, modules/compatibility, types/grid, types/compatibility,
сохранение GPL. Runtime scratch освобождается с экземпляром; нет ресурсов для фиктивного dispose.
Mappings: docs/port/features/pathfinding.md, ballistics.md, visibility.md.

## English

Pure instance-owned ports preserve original pathfinding, ballistic and shadow-casting
algorithms, not substitutes from A*/navcat/FOV libraries. Caller masks and actor/world
ownership remain separate. Shadow intervals use explicit float32 steps and original row
semantics; radius zero and failure-before-clear behavior match the source.

Grid extraction requires only this module, compatibility and their ambient contracts.
The larger kernel host additionally verifies turns. Each subsystem's Java matrix passes;
current global totals are recorded only in STATUS.md to avoid stale repeated progress.
Production world/actor integration, full app build and browser evidence remain open.
