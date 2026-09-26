# Turns / Очередь ходов

## Владелец и контракты

TurnScheduler владеет исходными Actor.time/id, membership, now/current, ID index и
производным lookup occupied cells. HP/AI, canonical character position и attached buffs
принадлежат участникам. Position/playback state поступают через query-only character view;
Phaser/DOM, timers, XState и глобальные stores здесь отсутствуют.

Runtime API — index.ts; все собственные contracts в types/turns/scheduler.d.ts.
PDTurnParticipant задаёт act/onAdd/onRemove; PDTurnEnvironment — hero/alive/duration port;
PDTurnMembership задаёт membership и **явный порядок обхода**. Его мутации разрешены только
scheduler. Не считать произвольный JS Set доказанной реализацией Android HashSet.

Clock arithmetic использует float32 в исходных местах. ID allocation и index сохраняют
различие: id(), вызванный после add(), сам по себе не регистрирует новый ID в lookup.
add(character) регистрирует buffs напрямую: без сдвига времени/index, с onAdd даже для
уже существующего buff. remove вызывает onRemove и для отсутствующего non-null участника.
clear не очищает current и не уничтожает detached clocks; initialize завершает исходный
цикл инициализации с current=null. Эти quirks сохранены, не исправляются незаметно.

process выполняется только по команде, не создаёт своего loop/timer. Оно останавливается
на moving character, false act или source death condition. next(actor) — доменный аналог
Actor.next, **не API для незащищённых renderer callbacks**. Generation/continuation guards
должны связывать presentation отдельно; пока это следующий незакрытый участок P02.

clockOf/list возвращают detached projections; restoreClock восстанавливает только time/id
и не является Bundle decoder или готовыми сохранениями. Occupancy lookup воспроизводит
фазы original Actor.process/occupyCell/freeCell, не становится второй canonical position.

## Проверки

`test:parity:turns`: 6/6 tests, 106 scripted scenarios, 4129 Java checkpoints, 4 одинаковых
bounds failures. Сравниваются time/cooldown bits, now/current, duration, membership, raw IDs,
ID lookup, occupied cells и callback order. Java Actor неизменён; все соседние harness
классы — явно описанные test-input adapters. LinkedHashSet задаёт order input через reflection.

`typecheck:turns` и `check:extraction:turns`: только turns + его .d.ts, без остальных modules/DOM.
Общий kernel: 36/36 tests, прежние 32112 algorithm cases + 4129 scheduler checkpoints.
Node22.16.0/JDK21.0.11/доступный TS5.8.3; project dependency set не установлен.

## English

An instance owns scheduler clocks, membership, current actor and derived indices. Actor
behavior, character position/buffs and hero status arrive through narrow ports. Iteration
order is caller-supplied and is NOT an assertion of Android HashSet equivalence.

Six tests pass across 106 scripted scenarios and 4129 independent original-Java checkpoints.
Both standalone turns extraction and full pure-kernel extraction pass. This is not production
Char/AI/Bundle/Android integration or browser evidence. Raw next is reserved for domain
orchestration; stale-safe playback continuations are the next pending boundary.
