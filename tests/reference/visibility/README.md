# ShadowCaster: independent reference / Независимый эталон

`ShadowCaster.java` — unchanged source blob `566fc3b7725ec80d773b2571df4b7491e16b1ba0`
from `Cthulhu-tech/pixel_dungeon@ce7f241515fd5c040fcf18b4beb5b7a49d9d535f:src/com/watabou/pixeldungeon/mechanics/ShadowCaster.java`.
Copyright 2012-2015 Oleg Dolya; GPL-3.0-or-later, root LICENSE.txt.

`tools/port/oracle/visibility/ShadowCasterOracle.java` вызывает исходный алгоритм с явными
входами. Используется уже существующий test-only `oracle/ballistics/Level.java`: он задаёт
только исходные размеры 32×32 и mask. Это не production Level и не Android integration.
Expected visibility не вычисляется TS-портом. Перед javac проверяется hash исходника.

The suite compares all 1024 visibility cells and the blocker mask, including repeated
casts, aliased buffers and failure-before-clear semantics. Node TS stripping and JDK
required. Temporary class files are removed from root tmp. No browser is started.
