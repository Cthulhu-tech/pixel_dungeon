# P00.4 / P00.5 / P02 — первые Java numeric и Random операции

Дата: 2026-09-26. Это детализация существующего PLAN, не вторая очередь. Полный P02 и полный Random остаются IN_PROGRESS. Результаты ниже относятся только к перечисленным методам и условиям, не ко всей игре.

## Источник и владелец

Владелец: `web/src/modules/compatibility/`. Public runtime API: `index.ts`. Единственная внешняя зависимость модуля — caller-owned `PDRandomSource` в `web/src/types/compatibility/random.d.ts`. Нет Phaser/XState/Zustand/DOM, clocks, Math.random или глобального mutable RNG. Шейдеры и игровой контент этой задачей не затрагиваются.

File-level ID: `watabou/PD-classes:com/watabou/utils/Random.java`.
Source commit: `c0b690a4163020963e70a58a7d4f27965dc8f134`.
Source blob: `cc6ce01ae51678da114ee1e0d26485717107704c`.
Независимая неизменённая копия: `tests/reference/random/Random.java`.
Harness: `tools/port/oracle/random/RandomOracle.java`.
Test: `web/tests/parity/random.test.mjs`.

## Соответствие методов

| Исходный symbol | TS symbol | Результат |
| --- | --- | --- |
| Java narrowing cast `(int)` в формулах | numbers.ts: toJavaInt | PASS в Java-матрице |
| Random.Float() | JavaRandom.float | PASS в Java-матрице |
| Random.Float(float max) | JavaRandom.floatTo | PASS в Java-матрице |
| Random.Float(float min, float max) | JavaRandom.floatBetween | PASS в Java-матрице |
| Random.Int(int max) | JavaRandom.intTo | PASS в Java-матрице |
| Random.Int(int min, int max) | JavaRandom.intBetween | PASS в Java-матрице |
| Random.IntRange | JavaRandom.intRange | PASS в Java-матрице |
| Random.NormalIntRange | JavaRandom.normalIntRange | PASS в Java-матрице |
| Random.chances(float[]) | JavaRandom.weightedIndex | PASS в Java-матрице |
| Random.chances(HashMap), index(Collection), oneOf, element, shuffle | Не перенесены | TODO |

Это первая посимвольная карта поверх существующего file-level inventory. `source-map.json` и generated summary в этой сессии не регенерировались; они пока не агрегируют эту детализацию. Их согласование с feature evidence остаётся P00.2. Нельзя объявлять весь исходный файл VERIFIED по частично перенесённым методам или обнулять прежние записи при следующей генерации.

## Реально выполнено

Окружение: Node 22.16.0, npm 10.9.2, javac/java 21.0.11, локально доступный TypeScript 5.8.3. Набор пакетов из web/package.json НЕ установлен/проверен; там по-прежнему заявлен TypeScript 6.0.3. Версии не подменялись ради зелёного результата.

| Команда | Фактический результат |
| --- | --- |
| `git hash-object tests/reference/random/Random.java` | Совпадает с исходным blob cc6ce01ae51678da114ee1e0d26485717107704c |
| из web: `tsc -p tsconfig.compatibility.json` | PASS, TS 5.8.3, strict, без DOM/global @types |
| из web: `node tools/check-compatibility-extraction.mjs` | PASS: только модуль + его .d.ts скопированы в отдельный host и проверены; host очищен |
| из web: `npm run test:parity:random` | 7/7 tests PASS, внутри 4982 независимых Java/TS comparisons, 0 skips |
| из web: `node --test tools/browser-check-blocked.test.mjs` | 1/1 PASS: e2e entry является блокировкой, дочерний browser не запускается |
| из web: `node tools/browser-check-blocked.mjs` | Ожидаемый exit 2 и BLOCKED/PD-R20; не browser PASS |

Java expected вычисляются оригинальным кодом на каждом прогоне. Harness меняет только разрешение имени Math в изолированной compilation unit на test-only источник draws. Формулы и исходные bytes не редактируются. Сравниваются raw float32 bits, int-результаты, категория выхода за границы массива и число draws; входы детерминированно формируются тестом. NaN/Infinity проверяются для int narrowing; матрица не заявлена как перебор всех возможных double/float.

Проверены signed overflow диапазонов, усечение отрицательных чисел, float intermediate rounding, exclusive/inclusive bounds, отсутствие draws для Int(max <= 0), два draws у NormalIntRange, неизменность весов и независимость экземпляров. Модуль не является production PRNG и не утверждает одинаковые seed для Java/JS Math.random.

## Наблюдаемый исходный дефект RNG-001

`chances(float[])` читает `chances[i + 1]` на последней итерации. Пустой массив ошибочен до random draw; все нулевые веса — после одного draw. Для `[1]` и draw `1 - 2^-53` float округляется до 1, строгое `<` не выбирает элемент и Java выходит за границы.

Этот результат воспроизведён независимым Java oracle и сохранён в TS как RangeError. Fallback на последний элемент не добавлен. Java exception class/message/stack не объявлены побитно одинаковыми с JS; сравнивается исход неуспешного выбора и количество draws. Будущее исправление поведения требует отдельного решения, не маскируется под перенос 1:1.

## Что остаётся открытым

Полная PD-classes/Android-сборка; прочие Random методы и порядок коллекций; production RNG и состояние при save/load; связь визуальных random draws с игровыми; Actor/PathFinder/ShadowCaster/Ballistica; общий build/typecheck с заявленными npm versions и браузерная приёмка.

P01-RULES выполнен только частично: npm test:e2e теперь явно блокируется, новые типы owner-scoped, временное размещается в root tmp. Старые Playwright файлы/зависимость не запущены и не удалены; существующие type imports/контракты scaffold, shader-only path и прочие policy checks ещё требуют отдельного согласованного изменения. Общая команда test:parity не превращена в ложный PASS всей игры.
