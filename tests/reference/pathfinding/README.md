# PathFinder: independent Java reference / Независимый эталон

`PathFinder.java` is byte-identical to
`watabou/PD-classes@c0b690a4163020963e70a58a7d4f27965dc8f134:com/watabou/utils/PathFinder.java`.
Git blob: `d58524776566aaf0d835200a6c797ba65a3d61fa`.
Copyright 2012-2015 Oleg Dolya; GPL-3.0-or-later, see repository LICENSE.txt.

Исходник не исправлен и не переписан. Test-only `tools/port/oracle/pathfinding/PathFinderOracle.java`
вызывает оригинальные публичные операции, отдельно проверяет private unlimited builder
через reflection и выдаёт полный distance buffer. Никаких expected из TS-реализации.
`web/tests/parity/pathfinding.test.mjs` проверяет hash, компилирует source с javac, сравнивает
результаты и убирает временные class-файлы из root tmp. JDK обязателен; нет skipped PASS.

Runtime wrapper exposes instance-local state instead of Java statics. The matrix includes
same-area resizing, exact paths, failed searches, retreat, limit behavior, queue/boundary
failures and partial distance state. This is not Android or browser integration evidence.
