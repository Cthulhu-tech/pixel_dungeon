# P00.4 / P00.5 / P02 — Java numeric и Random

Обновлено 2026-09-26. Детализация существующего PLAN, не вторая очередь.
Первая scalar-задача сохранена; следующая задача array/collection реализована и проверена.
Полный P02 и интеграция случайности в игру остаются IN_PROGRESS.

## Источник и владелец

`watabou/PD-classes@c0b690a4163020963e70a58a7d4f27965dc8f134:com/watabou/utils/Random.java`.
File-level ID: `watabou/PD-classes:com/watabou/utils/Random.java`.
Git blob: `cc6ce01ae51678da114ee1e0d26485717107704c`.
Неизменённый эталон: `tests/reference/random/Random.java`; hash проверяется перед javac.
Владелец: `web/src/modules/compatibility/`, public API `index.ts`.
Типы: `web/src/types/compatibility/random.d.ts`; зависимость — только caller-owned draws.
UI, шейдеры, авторский контент, сохранения и исходная Java-игра не менялись.

## Посимвольное соответствие

| Java symbol | TS symbol | Evidence |
| --- | --- | --- |
| narrowing cast (int) | toJavaInt | scalar suite |
| Float(), Float(max), Float(min,max) | float, floatTo, floatBetween | scalar suite |
| Int(max), Int(min,max) | intTo, intBetween | scalar suite |
| IntRange, NormalIntRange | intRange, normalIntRange | scalar suite |
| chances(float[]) | weightedIndex | scalar suite |
| chances(HashMap) | weightedKey | collection suite; порядок передан oracle |
| index(Collection) | collectionIndex | collection suite |
| oneOf(T...) | oneOf | collection suite |
| element(T[]), element(T[],int) | element, elementWithin | collection suite |
| element(Collection) | collectionElement | collection suite; порядок задан |
| shuffle(T[]), shuffle(U[],V[]) | shuffle, shufflePair | collection suite |

Все 16 wrapper methods теперь имеют реализации. Однако это не разрешает объявить
исходный файл полностью интегрированным/VERIFIED: production draw source, владение
порядком коллекций Android и потребление случайности всей игрой ещё не подтверждены.
File-level source-map/generated summary пока не агрегируют этот symbol-level evidence;
P00.2 остаётся открытым. Не обнулять старые строки при следующей генерации.

## Реальные проверки продолжения

Локально восстановлены относящиеся текстовые файлы через GitHub; полный clone недоступен
из-за DNS. Hash старого Random.java, RandomOracle.java и scalar test сверены с прочитанными
blob SHA. Node 22.16.0, JDK 21.0.11, доступный TS 5.8.3; зависимости приложения не установлены.

| Команда из web | Результат |
| --- | --- |
| `node --experimental-strip-types --test tests/parity/random-collections.test.mjs` | 6/6 PASS; 4260 Java comparisons |
| `node --experimental-strip-types --test tests/parity/random.test.mjs tests/parity/random-collections.test.mjs` | 13/13 PASS; 4982 + 4260 comparisons, 0 skips |
| `tsc -p tsconfig.compatibility.json` | PASS; только compatibility, strict без DOM |
| `node tools/check-compatibility-extraction.mjs` | PASS; отдельный host только с модулем и его .d.ts, host удалён |

Java expected вычисляются неизменённым исходником. `RandomOracle.java` предоставляет
test-only same-package Math binding; новый `RandomCollectionsOracle.java` вызывает
исходные методы, фиксирует оба массива даже после ошибки и экспортирует фактический
HashMap iteration order. TS получает этот порядок как вход: это проверка wrapper,
НЕ эмуляции Java коллекций. Изменяемые test arrays не являются авторским JSON.

Матрица проверяет пустые/одиночные массивы, null, граничные draws, отрицательные/выходящие
за массив max, float-weight rounding, aliasing, несовпадающие длины пар и частичные мутации.
Отдельные тесты проверяют identity ссылок и отсутствие лишнего draw.

## Сохранённые исходные особенности

- RNG-001: weightedIndex может выйти за границы на пустом/all-zero массиве и при округлении
  draw до полной суммы; fallback не добавлен. Пустой float[] не расходует draw.
- RNG-002: пустой HashMap расходует один draw до ошибки probs[0]; index(empty) также
  расходует draw, тогда как element(empty Collection) возвращает null без draw.
- RNG-003: shufflePair меняет first прежде чтения second. Ошибка second не откатывает first.
  При передаче одного массива дважды каждая пара перестановок взаимно отменяется.

Категория failure и draw count сравниваются; Java exception message/stack не обещаны
одинаковыми с JS RangeError. Не заявляется exhaustive IEEE/runtime проверка.

## Остаток

Production PRNG/state persistence; порядок коллекций владельцев и Android runtime;
визуальные draws; полный PD-classes build; общий toolchain/rules/build; scheduler/path/FOV/
ballistics и ручная browser evidence. Старые P01-RULES ограничения сохранены, browser не запускался.
