# Navigation policy: выбранные исходные методы

Baseline: `Cthulhu-tech/pixel_dungeon@ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`.
Original sources:

| File / symbol | Original full-file blob |
| --- | --- |
| src/com/watabou/pixeldungeon/Dungeon.java — passable, findPath, flee | 961d04ca35a903486cc9bfd2e1386cf0c0c08813 |
| src/com/watabou/pixeldungeon/levels/Level.java — adjacent | c92488406814f6fb270c77799213200b8a72decb |
| src/com/watabou/pixeldungeon/utils/BArray.java — or | dec22b52f08c99a0b9b2fd3953b6169960726a5e |

`NavigationReference.java` содержит выбранные тела методов из этих исходников без изменения
их формул и ветвлений, но с тестовой class/package оболочкой. **Это не byte-identical полный
Dungeon.java/Level.java/BArray.java.** Собственный blob фрагментного reference:
`f469d5ad306e265f7745cf594d125fb50b5f8fef`. Он проверяется перед javac.
Copyright 2012-2015 Oleg Dolya, GPL-3.0-or-later; root LICENSE.txt.

Actor/Char/buff markers в `tools/port/oracle/navigation/NavigationOracle.java` задают
world inputs и наблюдают вызовы. Binding PathFinder записывает переданную mask и делегирует
настоящему неизменённому PD-classes PathFinder из tests/reference/pathfinding/.
Expected не вычисляется TS-портом или другим алгоритмом поиска пути.

## English

This fixture preserves selected original Java method bodies in a test-only shell; it is
not a build of the entire original Dungeon/Android application. The three source files and
full-file blob identities above record provenance; the fragment artifact has its own hash.
The PathFinder binding observes inputs and delegates to the unmodified original algorithm.
Input-only actors expose occupancy and buffs. Node/JDK required, no browser, root tmp cleanup.
