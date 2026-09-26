# Selected Char oracle / Эталон выбранных методов Char

Source repository: Cthulhu-tech/pixel_dungeon.
Commit: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
Path: src/com/watabou/pixeldungeon/actors/Char.java.
Original Git blob: 65bb59224b2574caa7939cc030d65ad68e31a9fd.
Copyright (C) 2012-2015 Oleg Dolya; GPL-3.0-or-later; see LICENSE.txt.

CharReference.java retains executable tokens for attack, hit, damage, speed, spend,
destroy, die and isAlive. Whitespace/comments are compacted. The surrounding class fields,
abstract query declarations and CharacterOracle.java neighbors are a TEST HOST. They are
not an Android implementation and cannot prove all Char/Hero/Mob/effect behavior.

character-source.test.mjs checks the complete source blob, then compares selected Java
tokens including string literals. An altered formula fails this gate even if both oracle
and TS were changed to match. Sources are never regenerated from the implementation.

The runner separately verifies original PD-classes Random.java (blob
cc6ce01ae51678da114ee1e0d26485717107704c), instruments only Math.random() into a draw tape
inside ignored tmp, and compiles its unchanged arithmetic with the selected Char methods.
All temporary Java classes are cleaned up. No browser, Android SDK or npm framework package
is needed. Trace comparison covers semantic requests, not translated strings/pixel/audio
output. Helpers for logging/camera/buffs are controlled ports, not full source dependencies.

Commands from web:
- npm run test:parity:character (includes source provenance)
- npm run test:contracts
- npm run typecheck:character
- npm run check:extraction:character
