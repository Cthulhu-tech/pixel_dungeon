# Ballistica Java oracle / Эталон траекторий

Reference is the unchanged blob `7dc0aca57188f09001a5b48299a1b219401cbbcb` from
`Cthulhu-tech/pixel_dungeon@ce7f241515fd5c040fcf18b4beb5b7a49d9d535f:src/com/watabou/pixeldungeon/mechanics/Ballistica.java`.
Copyright 2012-2015 Oleg Dolya; GPL-3.0-or-later. See root LICENSE.txt.

`tools/port/oracle/ballistics/Level.java` и `Actor.java` — только тестовые адаптеры входов:
32×32 masks и occupancy lookup. Они не заменяют production Level/Actor, не содержат
алгоритма траектории и не доказывают интеграцию с Android. Ballistica.java не изменяется.
Oracle сравнивает collision cell, distance, весь trace buffer, включая stale tail/partial
writes, и порядок запросов к Actor.findChar. Java array failures не превращаются в success.

Run `npm run test:parity:ballistics` from web. Node TS stripping and JDK required.
Sources are hash-checked before compilation; all temporary classes are removed from root tmp.
