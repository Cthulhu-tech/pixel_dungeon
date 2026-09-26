# Compatibility / Совместимость Java

## Владелец и границы

Модуль владеет только семантикой Java-вычислений, необходимой порту. Он не владеет
игровым миром, глобальным RNG, часами, UI или сохранениями. Runtime API — `index.ts`:
`JavaRandom`, `toJavaInt`. Единственный внешний контракт — `PDRandomSource` из
`web/src/types/compatibility/random.d.ts`. Каждый экземпляр получает источник явно;
создание экземпляра и импорт модуля не расходуют случайные значения.

`toJavaInt` воспроизводит narrowing conversion: усечение к нулю, насыщение int32,
NaN → 0, отсутствие отрицательного нуля. Методы `intTo`, `intBetween`, `intRange`,
`normalIntRange` принимают min/max, уже представленные как signed Java int32;
проверка неизвестного внешнего ввода не относится к этому внутреннему контракту.
Float-параметры и float-промежуточные суммы округляются на исходных стадиях.

Сейчас перенесены Float() / Float(max) / Float(min,max), Int(max) / Int(min,max),
IntRange, NormalIntRange и chances(float[]). API TS: float / floatTo /
floatBetween / intTo / intBetween / intRange / normalIntRange / weightedIndex.
Map/Collection-операции, oneOf/element/shuffle и production PRNG пока НЕ перенесены.

## Проверка

`npm run test:parity:random` компилирует отдельный Java oracle из неизменённого
исходного Random.java и сравнивает 4982 случая: float bits, int-результаты,
категорию выхода за границы массива и количество draws. Нужны Node с TS stripping
и JDK с javac/java. Это не браузерная проверка и не запуск всей Android-игры.

`npm run typecheck:compatibility` — strict typecheck без DOM.
`npm run check:extraction:compatibility` копирует только этот модуль и его собственные
ambient declarations в `tmp/`, проверяет их отдельно и удаляет временную копию.
Для выноса нужны эти два каталога и сохранение GPL/авторства; остальная игра не нужна.

Сохраняется исходная ошибка chances(float[]): пустые/all-zero weights и округление
random float до суммы могут приводить к выходу за границы. Нет fallback на последний
элемент. В TS это RangeError; текст/stack Java-исключения не объявлены идентичными.
Полная карта соответствия и пределы проверки: `docs/port/features/random.md`.

## Ownership and extraction (English)

This module owns Java arithmetic/random-wrapper semantics only. It does not own a
PRNG or game state. Import the runtime values from index.ts and inject PDRandomSource;
its own declaration lives in src/types/compatibility/random.d.ts. Integer parameters
must already be signed int32 values. No framework, DOM, timer, or global random API
is needed. Extract this module with only its own declarations and retain GPL notices.

The Java oracle compiles the unmodified pinned reference and controls only its random
draw source through a test-only same-package Math binding. 4982 comparisons cover
result bits, narrowing, signed overflow, draw counts and bounds-error outcomes for
the eight ported wrapper methods plus numeric casts. This is NOT Android integration,
production PRNG equivalence, collection-order parity or browser verification.

Run the three npm commands above. JDK absence is an error, never a skipped PASS.
Map/Collection operations, oneOf/element/shuffle and production random-state persistence
remain unimplemented. weightedIndex deliberately retains original failure outcomes;
Java exception strings/stacks are not part of the demonstrated equivalence.
