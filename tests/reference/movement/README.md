# Movement oracle / Эталон движения

MovementReference.java contains selected unchanged executable methods from original
Char.move/distance, Level.adjacent/distance and Door.enter/leave, pinned to
ce7f241515fd5c040fcf18b4beb5b7a49d9d535f. The six methods are token-compared against
hash-pinned original files by web/tests/parity/movement-source.test.mjs.
Copyright (C) 2012-2015 Oleg Dolya; GPL-3.0-or-later, see root LICENSE.txt.

Surrounding Char/Level/Sprite/Actor/Random classes are explicit test inputs, not production
replacements. Random returns a selected neighbour index; full RNG was tested separately.
Level.set only models the port's map write, not all of the game's terrain masks or effects.
Observation and failure hooks expose source mutation order and final visibility/map state.

1702 cases cover directions/statuses, doors/heaps, early cancellation, long/equal moves,
row wrap, signed arithmetic, invalid indices and failures after partial changes.
These checks do not certify complete Hero movement, Level.set, graphics or Android behavior.
Compiler/temp files remain in ignored root tmp and are removed after each test.
