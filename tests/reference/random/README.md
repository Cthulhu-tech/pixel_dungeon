# Независимый источник Random / Independent reference

`Random.java` — неизменённый файл из `watabou/PD-classes`, commit
`c0b690a4163020963e70a58a7d4f27965dc8f134`, path `com/watabou/utils/Random.java`.
Git blob SHA-1: `cc6ce01ae51678da114ee1e0d26485717107704c`.
Авторство: Oleg Dolya, 2012–2015. GPL-3.0-or-later; см. исходный заголовок и LICENSE.txt.
Файл скопирован как независимый test oracle, не как browser dependency.

Harness: `tools/port/oracle/random/RandomOracle.java`. В отдельной Java compilation
unit объявлен package-private `com.watabou.utils.Math`: имя заменяет только binding
`Math.random()` в компилируемом эталоне, не меняя bytes, формулы или алгоритмы файла.
Этот test-only класс нельзя включать в сборку оригинальной игры/других PD-classes.

Входы создаёт `web/tests/parity/random.test.mjs`; expected вычисляет Java во время
теста. TSV-протокол передаёт метод, аргументы и tape draws; результат содержит raw
float32 bits либо int/категорию bounds error, затем число потреблённых draws.
Текст/stack exception и внутренности production Java Math.random не сравниваются.
Hash исходного файла проверяется до компиляции; несовпадение, отсутствие JDK,
исчерпанная лента или ошибка запуска останавливают тест, а не дают зелёный skip.

The reference is byte-identical to the pinned blob. Only the isolated harness binds
its Math name to a controlled draw tape. Expected values come from compiled original
Java, not the TS implementation. This proves the documented operations on the test
matrix, not full PD-classes/Android compatibility or a shared production seed contract.
