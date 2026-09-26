# Grid / Клеточное ядро

## Ответственность и публичная граница

Public runtime API — index.ts: исходные Level constants, GridPathFinder, GridBallistica,
GridShadowCaster и GridNavigation. Type-only contracts — types/grid/*.d.ts. Нет Phaser,
DOM, XState/stores, timers или общего изменяемого мира. Чистая зависимость —
compatibility.toJavaInt для escape arithmetic. mask.ts переиспользуется внутри grid.

GridPathFinder владеет distance/goals/queue: exact path/step/flee, limits, source ordering
и bounded failures. GridBallistica владеет trace/distance; world flags/hasCharacter поступают
через порт. GridShadowCaster владеет scratch intervals/derived rounding, output принадлежит
вызывающему владельцу. Оригинальные float32/callback-independent algorithms не заменены.

**GridNavigation** переносит Dungeon.findPath/flee вокруг внедрённого PDNavigationPathfinder.
Единственное собственное состояние — reusable working mask. PDNavigationActor предоставляет
flight/buff queries, PDNavigationWorld — avoid/occupancy/ordered character positions.
Обычные pass/visible masks приходят параметрами. Backend получает synchronous borrow рабочей
маски: хранить её как live world state после вызова нельзя.

Adjacent path сохраняет исходную проверку линейного difference и occupancy независимо от
visibility; избегаемая клетка допускается даже без flight. Общий find разрешает avoid при
flight/Amok/Rage, flee — только при flight и восстанавливает текущую клетку. Невидимые actors
не исключаются из общей mask. Порядок queries и flags short-circuit сохранён.

Canonical position — actors; derived Actor.chars lookup — turns. Grid использует публичный
порт, не копирует occupancy. В тесте подключён настоящий TurnScheduler, но реальные
Hero/Mob/buff owners и сцены пока не интегрированы. Параметры dimensions должны совпадать
с backend; доказательство Ballistica/ShadowCaster/navigation относится к исходным 32×32.

## Проверки и переносимость

| Подсистема | Evidence |
| --- | --- |
| PathFinder | 5/5 tests, 5460 original-Java cases |
| Ballistica | 6/6 tests, 9150 cases |
| ShadowCaster | 6/6 tests, 8260 cases |
| Navigation policy | 6/6 tests, 5776 selected-original-method cases |

Original full-file algorithms hash-checked. Navigation fixture содержит выбранные исходные
методы в test-only shell с отдельным hash/provenance, а не полный Dungeon.java. Actor/Level
adapters дают входы; они не доказывают production Android compatibility.
Актуальные глобальные totals/команды — docs/port/STATUS.md, не дублируются в README.

Вынос grid требует modules/grid, modules/compatibility и только их declarations/licenses;
world/actor/pathfinder ports связывает вызывающий host. Общий kernel extraction дополнительно
проверяет turns. Отдельный headless запуск не требует DOM или framework dependencies.
Проверено Node22.16.0/JDK21.0.11/доступным TS5.8.3; full npm set/build не подтверждены.

## English

Grid ports preserve original path, trajectory, visibility and movement-policy semantics.
GridNavigation owns only a reusable scratch mask and queries actor/world owners through
narrow ports. It retains adjacent fast paths, flight/buff asymmetry, visible-only occupancy
filtering, original query order and failure behavior. Pathfinding remains the previously
ported algorithm. The real scheduler is exercised through its public occupancy API in a
contract scenario; production actors and gameplay presentation remain unimplemented.

Source provenance and scope are in docs/port/features/{pathfinding,ballistics,visibility,
navigation}.md. Navigation uses selected original Java method bodies in an explicit test
shell, not a complete original Dungeon build. This distinction is not hidden by passed tests.
