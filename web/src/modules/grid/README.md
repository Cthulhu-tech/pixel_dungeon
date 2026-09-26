# Grid / Клеточное ядро

## Ответственность и публичная граница

Public runtime API — index.ts: Level constants, GridPathFinder, GridBallistica,
GridShadowCaster, GridNavigation, GridDoors and pure grid geometry functions.
Type-only contracts — types/grid/*.d.ts. No Phaser, DOM, XState/stores, timers or shared
mutable world. Pure dependency: compatibility.toJavaInt for escape arithmetic.
mask.ts is reused within grid; geometry.ts is the single Level adjacency implementation.

GridPathFinder owns distance/goals/queue: exact path/step/flee, limits, source order and
bounded failures. GridBallistica owns trace/distance; flags/occupancy come through a port.
GridShadowCaster owns scratch intervals; output belongs to its caller.

GridNavigation owns only a reusable working mask and delegates to PDNavigationPathfinder.
Actor/world ports supply flight/buffs, avoid/occupancy/ordered positions. The backend borrows
the mask synchronously and may not retain it as live world state. Adjacent paths keep the
flattened difference rule and visibility-independent occupancy check. Find allows avoid with
flight/Amok/Rage; flee only with flight, then restores the current cell. Hidden actors do not
block the general mask. Original query order and short-circuit reads are preserved.

Canonical actor position belongs to actors; derived Actor.chars belongs to turns. Grid only
queries that index. Dimensions must agree with the backend. Ballistica/visibility/navigation
parity is checked for the original 32x32; generalized dimensions are not an unqualified claim.

## Geometry and doors / Геометрия и двери

geometry.ts ports Level.adjacent/distance and NEIGHBOURS8 order. GridNavigation reuses adjacency
instead of a second formula. Java int subtraction/abs overflow and truncation toward zero are
preserved. Flattened adjacency is deliberately NOT geometric Chebyshev distance <= 1.

GridDoors ports Door.enter/leave through PDGridDoorPorts. It owns no terrain or observation
state. Enter calls set-open → updateMap → observe → visibility → optional sound. Leave checks
heap first and only then set-closed → updateMap → observe. Neither method adds its own turn,
RNG, renderer, cache or loop. Full Level.set/masks and Dungeon.observe remain other operations.

## Проверки и переносимость

Original full-file path/ballistics/visibility algorithms are hash-checked. Navigation and
movement/door reference shells contain selected source methods and test-only neighbor ports,
not a complete original Android runtime. The movement source-token gate checks all six
selected methods against pinned Char/Level/Door files. Real scheduler contracts check occupancy.

Source provenance and commands: docs/port/features/{pathfinding,ballistics,visibility,
navigation,movement-buffs}.md. Actual current counts/results: docs/port/STATUS.md.

Вынос grid требует modules/grid, modules/compatibility, их declarations и лицензии.
World/actor/pathfinder/door ports связывает вызывающий host. Kernel extraction дополнительно
проверяет turns. Изолированный запуск не требует DOM/Phaser. Меньший movement host проверяет
только geometry/doors/position, не заменяя полный kernel extraction.

Это не готовые уровни, полноценные Hero/Mob, UI или browser parity. Неперенесённые части не
подменяются тестовыми соседями в runtime; tests/reference остаётся только эталонным harness.
