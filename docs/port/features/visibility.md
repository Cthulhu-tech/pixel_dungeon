# P00.4 / P00.5 / P02 — ShadowCaster

Дата: 2026-09-26. Четвёртый последовательный алгоритмический участок текущего продолжения.
Единая очередь — PLAN, этот файл — symbol mapping и evidence.

## Source и владелец

File ID: `Cthulhu-tech/pixel_dungeon:src/com/watabou/pixeldungeon/mechanics/ShadowCaster.java`.
Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, blob `566fc3b7725ec80d773b2571df4b7491e16b1ba0`.
Неизменённый reference: tests/reference/visibility/ShadowCaster.java.
Target: web/src/modules/grid/GridShadowCaster.ts, public API grid/index.ts.
Own types: web/src/types/grid/visibility.d.ts. Внешние входы — origin, radius, blockers,
caller-owned output; scratch/rounding принадлежат экземпляру, глобального state нет.

| Original | Target |
| --- | --- |
| castShadow | GridShadowCaster.castShadow |
| scanSector | private scanSector, те же восемь преобразований/порядок |
| Obstacles | internal instance ShadowObstacles, capacity 40, row-limit/merge semantics |
| static rounding table | вычисление исходной формулой один раз в constructor |
| Level.losBlocking | явный PDGridPassability; output Uint8Array передаётся владельцем |

Производная rounding table — результат алгоритма, не новый authored JSON или knob баланса.
Float32 округление сохранено на каждом делении/вычитании/сложении углов. Закрытая клетка
также может добавить obstacle interval. Intervals текущего ряда учитываются со следующего.

## Реальные проверки

`node --experimental-strip-types --test tests/parity/visibility.test.mjs`: **6/6 PASS**,
**8260** Java comparisons, включая **112** одинаковых invalid-radius failures.
14 masks, 64 origin positions, все радиусы 0–8; repeat/alias и неподдержанные -1/9.
В каждом случае сравниваются все 1024 видимых клетки и исходная blocker mask.

Полный текущий kernel suite (Random scalar/collections, PathFinder, Ballistica, visibility):
**30/30 PASS**, **32112** comparisons, 0 skipped. Scoped `tsc -p tsconfig.kernel.json` и
`node tools/check-kernel-extraction.mjs` — PASS, без DOM/адаптеров/посторонних globals.
Node 22.16.0, JDK 21.0.11, доступный TS 5.8.3; проектный npm-набор не установлен.

Oracle компилирует hash-checked ShadowCaster и использует shared test-only Level input
adapter. Это не проверка всего Level.updateFieldOfView, buffs/sensing/hero visibility,
темноты, reveal/UI и Android runtime. Browser evidence по-прежнему ручной и отсутствует.

## Особенности и ограничения

FOV-001: radius0 очищает output и оставляет только origin; rounding[0] равен null, sectors не идут.
FOV-002: invalid radius lookup ошибочен ДО очистки output. Не clamps/default radius.
FOV-003: cast очищает output, но не отдельный blockers; alias output/blockers изменяется как в Java.
FOV-004: eight-sector/row timing и float32 interval endpoints сохраняются, не заменяются иной FOV-библиотекой.

Проверка относится к исходной карте 32×32 и int radius, не всем произвольным dimensions.
Java exception text/stack не обещаны равными JS RangeError. Source-map aggregation остаётся P00.2.
Следующий участок P02 — Actor scheduler и явные continuation boundaries.
