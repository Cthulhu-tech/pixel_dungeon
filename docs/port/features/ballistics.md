# P00.4 / P00.5 / P02 — Ballistica

Дата: 2026-09-26. Следующий участок после Random и PathFinder, в рамках единого PLAN.

## Source, owner, API

File ID: `Cthulhu-tech/pixel_dungeon:src/com/watabou/pixeldungeon/mechanics/Ballistica.java`.
Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`; blob `7dc0aca57188f09001a5b48299a1b219401cbbcb`.
Reference: `tests/reference/ballistics/Ballistica.java`, тот же исходный Git blob.
Target: `web/src/modules/grid/GridBallistica.ts`; public export из grid/index.ts.
Собственный world-query contract: types/grid/ballistics.d.ts; только flags + hasCharacter.

| Original | Target |
| --- | --- |
| Ballistica.cast(from,to,magic,hitChars) | GridBallistica.cast(..., world) |
| static trace[] | private instance trace; traceAt/copyTrace readonly projection |
| static distance | readonly distance getter |
| Level flags, Actor.findChar | explicit PDBallisticaWorld query port |

Чтение boolean mask вынесено в один внутренний grid/mask.ts и используется PathFinder;
его поведение не изменено, все прежние differential tests повторно прошли.

## Фактический прогон

`node --experimental-strip-types --test tests/parity/ballistics.test.mjs`: **6/6 PASS**,
**9150** оригинальных Java сравнений, **1508** одинаковых failure outcomes; skips 0.
10 world masks, 15×15 пар cells, оба magic/hitChars флага и повторные casts.
Сравниваются collision cell, distance, весь trace на 32 элемента и occupancy-query order.

Совместный прогон scalar Random, collections, PathFinder и Ballistica: **24/24 PASS**, всего
**23852** comparisons. `tsc -p tsconfig.kernel.json`, kernel extraction и compatibility
extraction — PASS. Окружение: Node 22.16.0, JDK 21.0.11, доступный TS 5.8.3.
Заявленные npm dependencies не установлены; результаты не означают full build или TS 6.0.3 compatibility.

Java алгоритм неизменён и hash-checked. Java Level/Actor в test harness — явные adapters
для заданных flags/occupancy, не копии production systems и не источник expected-формул.
Граница доказанного — алгоритм с такими входами при исходной карте 32×32; живая Actor/Level
интеграция, damage/AI/animation и browser visuals этим не подтверждаются.

## Сохранённые особенности

BALL-001: обычный cast добавляет целевую клетку дважды; from==to даёт два элемента.
BALL-002: непроходимая клетка без avoid возвращает предыдущую; wall остаётся в trace за distance.
BALL-003: magic продолжается за to; losBlocking останавливает до проверки occupancy.
BALL-004: bounded trace write сохраняет post-increment distance даже при выходе за границы.
BALL-005: новый cast не очищает старый tail; экземпляры изолированы, copies не мутируют owner.

Нет нормализации траектории, другой Bresenham-версии, fallback, расширения trace или новых
правил столкновения. Java exception message/stack не обещаны равными JS RangeError.
Constructor принимает положительные dimensions, но parity matrix относится к исходным 32×32.

Следующие области P02: ShadowCaster и Actor/continuations. Source-map aggregation и прочие
P00/P01 ограничения не закрываются фактом появления Ballistica.
