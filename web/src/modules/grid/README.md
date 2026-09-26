# Grid / Клеточное ядро

## Владелец и API

Модуль содержит исходные Level dimensions/neighbor constants и `GridPathFinder`.
Вызовы только через `index.ts`. `GridPathFinder` владеет distance/goals/queue каждого
экземпляра; passability принадлежит вызывающему владельцу и не мутируется. Нет Phaser,
DOM, store, RNG, таймера или глобального изменяемого массива. Чистая зависимость —
`compatibility/index.ts:toJavaInt` для float/int-семантики escape factor.
Собственный контракт `PDGridPassability` — `web/src/types/grid/pathfinding.d.ts`.

Создать `new GridPathFinder(width, height)` с положительными целыми dimensions/area int32.
`find` возвращает упорядоченный массив клеток либо null; `getStep`/`getStepBack` — клетку
либо -1. `buildDistanceMap(to, mask, limit)` строит ограниченные расстояния.
`distanceAt` — readonly query, `copyDistanceMap` — явная detached projection, не второй owner.

Сохраняется исходный порядок PathFinder, отличный от NEIGHBOURS8 уровня. На этом нижнем
слое нет новых corner/x-boundary проверок. from==to возвращает null/-1 без сброса прежней
distance map. Повторный setMapSize с той же площадью сохраняет прежние offsets, как Java.
Queue имеет исходную ёмкость; повторный enqueue from и bounds failures не замаскированы.
Эти особенности не исправляются попутно. Source caller Dungeon.findPath/flee дополнительно
строит mask с учётом акторов/видимости/flying/avoid: этот application-layer ещё не перенесён.

## Проверки и извлечение

`npm run test:parity:pathfinding`: 5/5 tests, 5460 original-Java cases, включая 1049 исходных
failure outcomes и частичные distance buffers. Матрица содержит 3×3, 4×5, 8×8, 32×32,
разные маски, endpoints, retreat, limits, resize и previous-buffer semantics.
Java reference hash проверяется; весь expected вычисляет оригинал.

`npm run typecheck:kernel` и `npm run check:extraction:kernel`: только grid, compatibility
и их собственные declarations, без остального приложения/DOM. Тестировалось на Node 22.16.0,
JDK 21.0.11 и доступном TS 5.8.3; полный package.json-набор не установлен.
Для выноса нужны modules/grid, modules/compatibility, types/grid и types/compatibility,
сохранение GPL и public contracts. Здесь нет UI/lifecycle ресурсов для фиктивного dispose.

## English

GridPathFinder is an instance-owned port of the pinned PD-classes algorithm, not A* or
navcat. It returns the exact ordered path/step and preserves source tie order, same-area
reshape behavior, stale distance on equal endpoints, flattened adjacency and failure
outcomes. Passability is supplied by the caller; Dungeon-level occupancy/AI integration
remains open. Positive integer dimensions are the new API's explicit precondition.

Five tests passed with 5460 independent Java comparisons. Extraction/typecheck passed for
grid plus its declared pure compatibility dependency and owner-scoped .d.ts only. This is
not full gameplay or browser evidence; see docs/port/features/pathfinding.md for scope.
