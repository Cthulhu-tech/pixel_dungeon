# P02 — защищённые continuation acknowledgments

Дата: 2026-09-26. Шестой последовательный участок после переноса очереди Actor.
Требование: MANDATORY_RULES PD-R17/18 и ARCHITECTURE §6, не новая механика игры.

## Реализация

TurnScheduler.activeRevision — новое ephemeral identity на каждый act и clear/initialize.
Оно не участвует в сравнении времени/очереди и не меняет gameplay state. Исходный
Actor.next сохраняется в next(actor). Отдельный TurnContinuationGate по узкому host port
создаёт token, хранит один pending barrier и принимает только текущий token+revision+actor.

Files: modules/turns/TurnContinuationGate.ts, types/turns/continuations.d.ts;
module public API index.ts. Constructor не запускает loop/listener; dispose идемпотентен.
Token serial — bigint, но identity проверяется по ссылке, не по доверенному номеру.
Формат in-process, не external save/JSON. Одна pending запись, без неограниченной истории.

capture выполняет владелец action в исходной callback-фазе. Renderer получает только
право подтвердить этот token, не raw next или управление очередью. Acknowledge не запускает
process и не списывает время; новый акт исполняется лишь при явном process владельца.
Cancel не притворяется успешной анимацией; текущий ход остаётся ожидающим до явного решения
coordinator. При новом run/level и error teardown старый gate отменяется/уничтожается.

## Проверки

`node --experimental-strip-types --test tests/contracts/turn-continuations.test.mjs`:
**13/13 PASS**, включая 1000 последовательных valid completions и duplicate/stale проверки.
Покрыто: поздний callback для того же actor на новом act без нового capture, wrong actor,
foreign/forged token, duplicate capture, clear (при сохранённом source current), initialize
без clear, cancellation/retry, idempotent dispose, moving, removed current actor, fixTime.

Повторный совместный прогон source-Java suites + contract: **49/49 PASS**, 0 skipped.
Java comparison scope не расширяется этим числом: по-прежнему 32112 algorithm cases и
4129 scheduler checkpoints. Contract проверяет новый архитектурный протокол, а не якобы
существовавшую в Java token API. Raw scheduling после metadata changes повторно совпало
с неизменённым Actor.java во всей выбранной матрице.

Strict typecheck/kernel и turns/kernel extraction — PASS. Node22.16.0, JDK21.0.11,
доступный TS5.8.3, не установленные project package versions. Browser не запускался.

## Открытая интеграция

Нужно перенести настоящие Char/Hero/Mob/animation handlers и связать правильные source
completion points с gate; этот модуль не делает визуальные сцены готовыми. Не выдавать
token каждому FX и не использовать cancel как невидимый пропуск хода. Application recovery,
production collection order, original-save и full P01/visual checks остаются открытыми.
