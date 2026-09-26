# Фактический статус переноса

Обновлено 2026-09-26. Работа последовательно по PLAN P00–P10; подтверждение между задачами
не требуется. Полной играбельной браузерной игры пока нет.

## Реализованные участки

| Участок | Реализация | Последнее локальное evidence |
| --- | --- | --- |
| Random | Все 16 wrapper operations, порядок коллекций — явный вход | 13 tests / 9242 Java cases |
| PathFinder | Точный путь/шаг/отступление и карты расстояний | 5 tests / 5460 cases |
| Ballistica | Траектории, столкновения, trace и порядок queries | 6 tests / 9150 cases |
| ShadowCaster | Восемь секторов, float32-углы, видимость | 6 tests / 8260 cases |
| Actor scheduler | Время, очередь, hooks, ID и производный occupancy | 6 tests / 106 сценариев / 4129 checkpoints |
| Continuations | Защита от старых/повторных/чужих callbacks и отмена | 13 contracts, включая 1000 completions |
| Navigation policy | Dungeon.findPath/flee с flight/buffs/avoid/visible actors | 6 tests / 5776 selected-method cases |

Локальный `npm run test:kernel`: 55/55 PASS, 0 skipped; `test:contracts`: 14/14 PASS.
Это пересекающиеся наборы, не 69 уникальных tests. Java full-file algorithms: 32112 cases;
selected navigation methods: 5776; scheduler: 4129 последовательных checkpoints.
Количество cases не является процентом готовности игры.

Scoped kernel typecheck и extraction compatibility/turns/kernel локально прошли на TS5.8.3.
Каждый host включает только нужные modules/declarations, без DOM и посторонних globals.
Contract runner исправлен после реального ERR_UNKNOWN_FILE_EXTENSION; regression 1/1 PASS.
Новый registry-audit unit suite: 5/5 PASS. Подробные отчёты находятся в features/.

## Реальный CI — выявленные проблемы

CI добавлен в main commit 109fb364a05724c78cc3545e6c783b5c9752b824.
Подтверждённый run36219646875: kernel job108342347365 и dependencies job108342347290.
**Первый CI завершился с ошибками. Его нельзя описывать как successful run.**

Kernel: hash gate обнаружил, что записанный PathFinder.java reference не совпадает с
локально проверенным оригиналом. В текущем исправлении восстановлен blob
`d58524776566aaf0d835200a6c797ba65a3d61fa` byte-for-byte; expected не менялся.
Результат повторного CI ещё не установлен. Остальные исходные Java/ассеты не изменялись.

Dependencies: все 7 exact pins FOUND, npm install --ignore-scripts успешно добавил46 пакетов.
Установленный compiler — TS6.0.3. **Общий typecheck не проходит:** ошибки собственных
деклараций Phaser/rex/XState. Vite build, общий boundary gate и installed-compiler extraction
после этого не исполнялись. См. features/ci.md для классов ошибок. Type safety не отключалась.
Canonical lockfile ещё не сохранён; установку нельзя называть воспроизводимым npm ci.

Предыдущие сообщения об успешном CI и baseUrl были неподтверждёнными и отозваны.
Actual tsconfig в реальном CI не содержит baseUrl. Источник истины — приведённые run/job/head
и их логи, а не предварительное описание. Расхождение локальных/репозиторных bytes выявил CI.

## Commits и происхождение

Random3777e64296e2a87b52bf2812702d9909ddfb79a2;
PathFinder b9f21257bdad022d411b1795455ea30753fab398;
Ballistica03aae50995bc979ada87d90ab50af32357d6f703;
ShadowCaster0984d661d020024db472a78c919b65c39b21311a;
Actor322c57649392fc4dc28f1419ce2dba6c537e7225;
continuations/runner3e9acd6da3c763a3c3b6393be2733e21460e1172;
navigation dbb00c5e29ef9b6554574e1d53c2e3979e31ffaf.

Source baseline ce7f241515fd5c040fcf18b4beb5b7a49d9d535f, PD-classes
c0b690a4163020963e70a58a7d4f27965dc8f134 неизменны. Navigation oracle содержит выбранные
исходные методы в test-only shell, не весь Dungeon. Actor oracle задаёт порядок
LinkedHashSet через reflection, не доказывает Android HashSet identity order.
Test-only neighbors — входные adapters, не игровые Char/Level/Bundle replacements.

Canonical position остаётся actors; Actor.chars lookup — turns; grid получает query port.
Gate acknowledgment вызывает next, не process/урон; отмена не означает успешный ход.
Настоящие персонажи/бой и связь с Phaser ещё не реализованы этими тестовыми сценариями.

## Открытые задачи

- P00.1/P00.2: semantic completeness и aggregation features в существующий source-map.
- P00.3–P00.6: full original Android build, production collection order, RNG schedule,
  saves/clocks и оставшиеся callback paths.
- P01.1: strict compiler compatibility установленных зависимостей; canonical lockfile.
- P01-RULES: старые type imports/контракты scaffold, shaders и полные policy gates.
- P02/P03: реальные Char/Hero/Mob/buffs/Level, production RNG/checkpoint и callback wiring.
- P04–P10: полный content/UI/save/visual parity NOT_VERIFIED.

Локально Node22.16.0/npm10.9.2/JDK21.0.11/TS5.8.3; полный clone не доступен из-за DNS,
работа шла с восстановленными относящимися файлами. Реальный CI использует полный checkout
и подтвердил установку packages; это не отменяет его ошибок и не доказывает browser behavior.

Браузер не запускался/не автоматизировался; visual/input/audio acceptance ручная и пока
отсутствует. test:e2e — blocker/exit2, общий test:parity не выдаёт ложный full PASS.
Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Runtime — web, references —
tests/reference, oracle — tools/port, scratch — ignored root tmp; временные hosts удаляются.
