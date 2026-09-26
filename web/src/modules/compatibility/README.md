# Compatibility / Совместимость Java

## Владелец и public API

Модуль владеет семантикой исходных Java-вычислений и random wrapper, не игровым миром,
часами, UI, глобальным PRNG или сохранениями. Runtime API через `index.ts`:
`JavaRandom`, `toJavaInt`. Собственные контракты `PDRandomSource` и
`PDRandomWeightedEntry<T>` находятся только в `web/src/types/compatibility/random.d.ts`.
Импорт и конструирование ничего не запускают и не расходуют draws.

`toJavaInt` сохраняет narrowing: усечение, int32 saturation, NaN -> 0, отсутствие -0.
Integer min/max должны уже быть signed int32. Float-преобразования и промежуточные
суммы округляются в исходных местах. Проверка неизвестного внешнего ввода — у boundary.

Все 16 методов исходного wrapper имеют TS-реализации:

| Java | TypeScript |
| --- | --- |
| Float(), Float(max), Float(min,max) | float, floatTo, floatBetween |
| Int(max), Int(min,max), IntRange, NormalIntRange | intTo, intBetween, intRange, normalIntRange |
| chances(float[]), chances(HashMap) | weightedIndex, weightedKey |
| index(Collection), oneOf | collectionIndex, oneOf |
| element(array), element(array,max), element(Collection) | element, elementWithin, collectionElement |
| shuffle(array), shuffle(first,second) | shuffle, shufflePair |

**Граница коллекций:** collectionElement/collectionIndex принимают snapshot в исходном
порядке Collection.toArray(); weightedKey — entries в исходном keySet().toArray() order.
Это НЕ обещание, что JS Map/Set воспроизводят Java HashMap/HashSet. В Java-тесте реальный
порядок экспортируется oracle и подаётся TS как явный вход. Подбор representation каждого
владельца коллекции и Android integration остаются отдельной открытой задачей.

Выбор возвращает исходные ссылки, допускает null; undefined и sparse JS holes не
представляют Java-элемент. Shuffle изменяет переданный runtime-массив; immutable JSON
нельзя передавать как изменяемое состояние. Парная версия намеренно сначала меняет first,
затем second: ошибка second не откатывает уже выполненную мутацию first. Aliased arrays
обрабатываются в том же порядке, без выдуманной атомарности.

## Проверки

`npm run test:parity:random`: оба suite, **13/13 PASS** в текущем прогоне,
**4982 scalar + 4260 collection = 9242** сравнения с неизменённым Random.java.
Проверяются результаты/float bits, draws, ошибки, обе перестановки и частичные мутации.
Это выбранная матрица, не исчерпывающий перебор и не процент готовности игры.
`npm run typecheck:compatibility` и `npm run check:extraction:compatibility` проверяют
модуль только с его declarations, без DOM, adapters и остальных globals.

Нужны Node с TS stripping, JDK javac/java и TypeScript. В этой сессии использованы
Node 22.16.0, JDK 21.0.11, доступный TS 5.8.3; заявленный package.json-набор не установлен.
Отсутствующий JDK — ошибка, не skipped PASS. Исходный reference проверяется по Git blob.
Подробности: `docs/port/features/random.md`.

Сохраняются исходные ошибки weighted selection, а не fallback на последний элемент.
Пустой float[] ошибочен до draw, пустой map — после draw. Текст/stack Java и JS исключений
не обещаны идентичными. Production RNG, его checkpoint и потребители draws в игре пока открыты.

## English: ownership, extraction and evidence

Extract this module plus only `src/types/compatibility/`, retain GPL notices and inject
a caller-owned PDRandomSource. No framework, DOM, global RNG, lifecycle or storage is needed.
All sixteen wrapper operations are implemented; the collection owner MUST supply the
original iteration order. Java exports its actual HashMap order in the test; the TS wrapper
does not pretend to emulate HashMap/HashSet. Selection preserves object identity and null.
Shuffle accepts mutable runtime arrays, never authored immutable content, and preserves
partial mutation on failure and aliasing semantics.

Thirteen tests passed: 4982 scalar and 4260 collection comparisons against hash-checked,
unmodified Java source. Scoped typecheck and extraction passed using TS 5.8.3, not the
uninstalled project TS 6.0.3. Production random-state generation/persistence, Android
collection-owner integration, full application build and visual parity remain unverified.
