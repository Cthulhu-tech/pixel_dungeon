# Turns / Очередь и подтверждения действий

## Владение и API

TurnScheduler владеет Actor.time/id, membership, now/current, ID index и производным
occupied-cell lookup. HP/AI/canonical position/buffs принадлежат участникам. Query-only
character view сообщает position и исходный moving barrier; нет Phaser/DOM/timers/stores.
Runtime API — index.ts (TurnScheduler, TurnContinuationGate, исходный TURN_TICK=1).
Собственные contracts — types/turns/*.d.ts; нет type imports/exports.

PDTurnParticipant предоставляет act/onAdd/onRemove, PDTurnEnvironment — hero/alive/duration.
PDTurnMembership передаёт **порядок обхода**; только scheduler меняет состав. Это не обещание,
что JS Set совпадает с Android HashSet. Один participant принадлежит одному активному run
scheduler; отдельные scopes не разделяют изменяемые экземпляры персонажей.

Float32 arithmetic, lazy ID/index differences, duplicate buff hooks, clear/current behavior
и исходные next/death/moving паузы сохранены. clockOf/list — detached projections;
restoreClock восстанавливает только primitive time/id, не является Bundle/save decoder.
Derived chars lookup обновляется в исходных фазах, не дублирует canonical position.

## Безопасный continuation protocol

Для каждого нового вызова act и каждой clear/initialize границы scheduler создаёт новый
opaque activeRevision. Это ephemeral metadata, не игровое время/seed/цена хода/save field.
TurnContinuationGate хранит максимум один pending barrier для текущего act.

Владелец действия вызывает capture(actor) в исходной точке ожидания, передаёт token только
тому playback completion, который соответствует original Actor.next, и принимает
acknowledge(token). Повторный capture текущего действия возвращает тот же token. Новый act
(даже того же actor), clear/initialize, чужой token или повторный callback не могут закрыть
новый ход. Идентичность token/marker проверяется по ссылке; serial bigint не переполняется.
Tokens in-process, ephemeral и не предназначены для JSON/save/network serializing.

Acknowledge только делегирует исходный next; не вызывает process, не меняет HP/time и не
запускает следующий ход. Raw next остаётся domain API, renderer его не получает.
Cancel/dispose не означают успешного завершения анимации и не освобождают actor сами.
Run coordinator должен выполнить явный lifecycle reset/initialize либо возобновить нужное
действие; error/scene teardown отменяет/уничтожает gate. Dispose идемпотентен, capture после
него ошибочен. Не раздавать один token произвольным косметическим FX как право завершить ход.

## Проверки и extraction

Source Actor oracle: 6/6 tests, 106 scenarios / 4129 checkpoints. Java Actor неизменён;
соседние классы — test-input adapters, membership order задан LinkedHashSet через reflection.
Это не доказательство Android HashSet/Char/Bundle integration.

Continuation contract: 13/13 tests, включая 1000 последовательных headless completions,
stale same-actor callbacks, clear/initialize, cancel/dispose, foreign tokens и moving pause.
Это tests нового обязательного протокола, не дополнительные Java parity cases.

Последний совместный kernel+contract прогон — 49/49 PASS. Pure-Java часть остаётся 36 tests,
32112 algorithm cases + 4129 scheduler checkpoints. Все reference hashes проверяются.
Strict kernel/standalone turns typecheck и extraction прошли на доступном TS5.8.3 с
Node22.16.0/JDK21.0.11; полный package.json-набор не установлен.

Вынос: только modules/turns и types/turns, без grid/compatibility/прочих globals/DOM.
Подробные evidence: docs/port/features/turns.md и continuations.md.

## English

The scheduler owns clocks and derived indices; game actors retain behavior, HP, position
and buffs. The collection adapter defines original iteration order explicitly. This is not
an assertion of Java HashSet equivalence.

A single bounded TurnContinuationGate accepts only the currently captured token/revision.
Each act or scope reset changes the opaque revision; stale/duplicate/foreign completions
cannot release a later action. Acknowledgment invokes next only, never process or game
mutations. Cancellation/disposal does not fake success. Tokens are ephemeral in-process
objects, not persisted state. The application must route the original completion phase and
perform explicit reset/recovery on teardown.

Six Java scheduler tests and thirteen continuation contract tests pass. The joint selected
kernel run passes 49 tests. Standalone extraction needs only this module and its declarations.
Production actors, Phaser playback and Android/runtime/save integration remain unverified.
