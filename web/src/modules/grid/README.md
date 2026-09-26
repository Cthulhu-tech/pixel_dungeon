# Grid / Клеточное ядро

## Владелец и публичная граница

Модуль содержит исходные Level constants, GridPathFinder и GridBallistica. Runtime API
через index.ts; type-only contracts — только types/grid/*.d.ts. Нет Phaser/DOM/stores,
таймеров, глобальных mutable buffers или владельца всей игры. Чистая внешняя зависимость —
compatibility/index.ts:toJavaInt для escape-factor arithmetic. mask.ts — единое внутреннее
чтение исходных boolean flags, не отдельная система и не schema validator.

GridPathFinder владеет distance/goals/queue экземпляра. find/getStep/getStepBack и
buildDistanceMap сохраняют source ordering, bounded queue и failures. Passability принадлежит
вызывающему владельцу; distanceAt и detached copyDistanceMap не дают второй live owner.
Положительные integer dimensions — явный контракт. Equal-area reshape не меняет offsets,
from==to не сбрасывает distance, flattened row adjacency и source errors сохранены.
Dungeon.findPath/flee с occupancy/visible/flying/avoid ещё должны подключить этот алгоритм.

GridBallistica владеет trace/distance экземпляра. cast принимает query-only PDBallisticaWorld
(passable/avoid/losBlocking/hasCharacter). traceAt/copyTrace — чтение/явная detached copy.
Алгоритм сохраняет повтор final target, short-circuit actor lookup, magic continuation,
wall rollback, post-increment при overflow и stale tail. World/Actor state не изменяется.
Проверка относится к исходной карте 32×32; constructor dimensions не доказывают любой размер.

## Проверки и извлечение

`npm run test:parity:pathfinding`: 5/5 tests, 5460 независимых Java cases.
`npm run test:parity:ballistics`: 6/6 tests, 9150 Java cases.
`npm run test:parity:kernel`: последний общий прогон — 24/24 tests, 23852 cases с Random.
Исходные algorithms hash-checked; Ballistica использует явно помеченные test-only input
adapters Level/Actor, не альтернативный алгоритм и не доказательство Android integration.

`npm run typecheck:kernel`, `npm run check:extraction:kernel`: grid + compatibility + только
их declarations, без DOM/прочих globals/адаптеров. Проверено на Node 22.16.0, JDK 21.0.11,
доступном TS 5.8.3. Полный пакетный набор из package.json и full browser build ещё не проверены.
Для выноса нужны modules/grid, modules/compatibility, types/grid, types/compatibility и GPL notices.
Здесь нет presentation ресурсов, требующих фиктивного dispose.

## English

This is a pure, instance-owned port of the original grid algorithms, not navcat/A*.
GridPathFinder preserves exact paths/steps, retreat, distance buffers, original ties and
failure outcomes. GridBallistica preserves collision cells, trace/distance semantics,
lookup order, duplicate destination, old tail and failed-write post-increments. World
flags and occupancy arrive via a query-only port. Neither algorithm owns actor/game state.

Five path tests (5460 Java cases) and six ballistic tests (9150 Java cases) pass. The joint
kernel run with Random passes 24 tests / 23852 comparisons. Extraction/typecheck passes with
only grid, its pure compatibility dependency and owner .d.ts. Ballistica's Java Level/Actor
hosts supply inputs only; this is not production Android/browser integration evidence.
Detailed mappings: docs/port/features/pathfinding.md and ballistics.md. ShadowCaster and
Actor/AI integration remain open.
