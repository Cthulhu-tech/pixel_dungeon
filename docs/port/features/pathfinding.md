# P00.4 / P00.5 / P02 — исходный PathFinder

Дата: 2026-09-26. Следующая законченная подсистемная задача после Random; не новая очередь.
Результат: реализован и проверен алгоритм PathFinder. Интеграция в Actor/AI/Dungeon остаётся открытой.

## Происхождение и mapping

File ID: `watabou/PD-classes:com/watabou/utils/PathFinder.java`.
Commit: `c0b690a4163020963e70a58a7d4f27965dc8f134`.
Blob: `d58524776566aaf0d835200a6c797ba65a3d61fa`.
Reference: `tests/reference/pathfinding/PathFinder.java`, неизменённые bytes, GPL сохранена.
Owner/runtime: `web/src/modules/grid/GridPathFinder.ts`, public `grid/index.ts`.
Types: `web/src/types/grid/pathfinding.d.ts`; чистая зависимость `compatibility.toJavaInt`.

| Original | Target/evidence |
| --- | --- |
| setMapSize | constructor/setMapSize; положительные int32 dimensions, equal-area behavior сохранён |
| find / Path | find -> number[] or null; сравнивается вся последовательность клеток |
| getStep | getStep; точный tie-selected шаг |
| getStepBack | getStepBack; исходные escape map + goals + search |
| buildDistanceMap(to, passable, limit) | buildDistanceMap, вся карта расстояний и limit |
| private single-target/multi-goal builders | buildPathMap/search + getStepBack, проверены через public операции |
| private escape builder, factor 2f | buildEscapeMap, проверен через getStepBack |
| private unused unlimited builder | Эквивалент limited builder с Integer.MAX_VALUE; Java private метод вызван reflection в oracle |
| distance[] | distanceAt / copyDistanceMap; изменения проекции не меняют owner |

Существующие Level constants сохранены; их NEIGHBOURS8 не подменяет PathFinder.dir.
Прочитан Dungeon.findPath/flee: специальные mask, Actor occupancy, visible/flying/avoid
не принадлежат этому алгоритму и пока не реализованы. Нельзя объявлять всё движение готовым.

## Реальные результаты

`node --experimental-strip-types --test tests/parity/pathfinding.test.mjs`: **5/5 PASS**,
**5460** Java/TS comparisons, **1049** одинаковых failure outcomes; 0 skipped.
В каждом случае сравнивается также вся distance map, включая частичные изменения при ошибке.
Матрица: 3×3, 4×5, 8×8, 32×32; 14 масок на размер; границы, равные endpoints, недостижимые
цели, blocked starts/targets, несколько limits, flee, equal-area reshape, changed-area resize.

`node <доступный typescript/bin/tsc> -p tsconfig.kernel.json`: exit 0.
`node tools/check-kernel-extraction.mjs`: PASS; только два owner module/declarations в
чистом host без DOM/adapters/остальных globals; temporary host удалён.
Random регрессии сохранены; общий промежуточный прогон трёх suites дал 18/18 PASS до
добавления 252 unlimited-builder случаев, после добавления повторно прошёл полный path suite.

Окружение: Node 22.16.0, JDK 21.0.11, доступный TS 5.8.3. Git DNS недоступен; относящиеся
файлы восстановлены через connector; hash эталона совпал. Это не полный clone/npm install,
не подтверждение проектного TS 6.0.3, не Android/browser и не full architecture gate.

## Исходные особенности и границы

PF-001: equal endpoints -> false/null/-1 до очистки distance buffer.
PF-002: setMapSize обновляет offsets только при изменении площади, не одной ширины.
PF-003: линейный neighbor offset может пересечь границу строки; geometry checks здесь нет.
PF-004: from может повторно попадать в bounded queue; крайние neighbor accesses/overflow
могут завершиться ArrayIndexOutOfBoundsException. TS сохраняет failure/частичное состояние
как RangeError; нет выдуманного пути, расширения очереди или скрытого corner restriction.

Нулевые/отрицательные dimensions не входят в новый public API; проверены положительные
размеры. Чужие маски не изменяются, canonical actor position и passability остаются у владельцев.
Нет утверждения об exhaustive всех картах; число случаев не является процентом готовности.
File-level source-map ещё требует согласования с этим symbol evidence на P00.2.
