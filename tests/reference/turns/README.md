# Actor oracle / Эталон очереди ходов

Actor.java is byte-identical to blob `2f91dd22a194d2d2a83f22c56930695a702100d8` from
`Cthulhu-tech/pixel_dungeon@ce7f241515fd5c040fcf18b4beb5b7a49d9d535f:src/com/watabou/pixeldungeon/actors/Actor.java`.
Copyright 2012-2015 Oleg Dolya; GPL-3.0-or-later, root LICENSE.txt.

Исходный scheduler не переписан и не инструментирован строковыми патчами. Harness
`tools/port/oracle/turns/` подаёт scripted actor behavior, character/buff/level inputs,
primitive Bundle fields и keyed SparseArray behavior. Эти классы — только тестовые границы,
не production replacements и не проверка настоящих save/Android APIs.

**Iteration order is controlled explicitly:** test reset injects LinkedHashSet into
Actor.all using reflection. This is an input condition shared with the TS membership
port, not proof that JS Set reproduces Android HashSet. Tests vary insertion order and
exercise original tie selection, callbacks, time and partial state. Android collection
ownership remains unresolved and cannot be marked VERIFIED by these tests.

The Java oracle exports every checkpoint: float clock bits, current actor, duration,
membership, raw/lazy IDs, lookup index, full occupied-cell index and callback order.
Run `npm run test:parity:turns` from web; Node TS stripping and JDK are required.
Reference hash is checked before javac; temporary files are removed from root tmp.
