# Фактический статус переноса

Обновлено 2026-09-26. Работа по единому PLAN, без промежуточных подтверждений.
Полной играбельной браузерной игры пока нет. Полный visual/input/audio parity NOT_VERIFIED.

## Текущий участок: коллекция эффектов Char

Исходный code checkpoint: `1330ba6353e9379c0b2f52d5dde910721867f5d9`; инфраструктура inputs
добавлена в `0ec2fcc0c9b28820d14f16fac9516e1ce2656600`.

Добавлены CharacterBuffs, owner-scoped types, original English label data, независимый
Java-harness девяти исходных методов, 5 parity/regression tests и 4 интеграционных теста.
Подробности: [features/character-buffs.md](features/character-buffs.md).

Локально на ПОЛНОМ checkout и actual TS6.0.3:
- 475 Java-сценариев /10235 checkpoints, включая queries, наследование, duplicate add,
  absent remove, reentrant cleanup, sprite-null и частичные изменения перед ошибкой.
- typecheck:character и extraction с negative declaration control PASS.
- test:kernel **99/99 PASS**, 0 skipped; новые и предыдущие тесты.
- check-boundaries regression **8/8 PASS**; общий check:boundaries PASS.
Новый CI после публикации этого участка ещё не подтверждён: локальный успех не приписан CI.

Коллекцией владеет Char, target — Buff, часы — TurnScheduler. Реальные существующие владельцы
соединены тестами: HP=0/очистка эффектов/freeCell, снятие Frost перед уроном и Slow/Speed.
Конкретные Frost/Poison и полноценный Char/Hero/Mob пока не реализованы этой коллекцией.
Порядок Java HashSet остаётся явным входом, не подменён универсальным JS Set.

## Полный локальный snapshot и общий build

Получен через GitHub artifact10902809718/run36234060850: Git bundle и точные установленные
пакеты. SHA256 ZIP/bundle/tar проверены. Теперь доступен полный исходный Git checkout и
TypeScript6.0.3, а не только восстановленные тексты с TS5.8.3. Node22.16.0/JDK21.0.11.
Provenance и исправление gate: [features/compilation-inputs.md](features/compilation-inputs.md).

Обнаружен и исправлен ложный boundary failure: метод TurnScheduler.process ошибочно принимался
за Node global process. Настоящие global reads по-прежнему запрещены; regression tests PASS.
Общий npm run build остаётся FAIL/exit2: 31 diagnostic в vendor Phaser/rex/XState declarations.
Vite runtime, browser launch и browser acceptance не выполнялись. Strict не отключён,
skipLibCheck/fake typings не добавлены. Lockfile из snapshot пока не принят как canonical;
успешного npm ci в репозитории не заявляется.

## Сохранённое ядро и прежние подтверждения CI

| Участок | Предыдущая подтверждённая матрица |
| --- | --- |
| Random | 13 tests /9242 Java cases |
| PathFinder | 5 tests /5460 cases |
| Ballistica | 6 tests /9150 cases |
| ShadowCaster | 6 tests /8260 cases |
| Actor scheduler | 6 tests /106 сценариев /4129 checkpoints |
| Continuations | 13 contracts, включая1000 completions |
| Navigation policy | 6 tests /5776 selected-method cases |
| Char health/combat/time | 4 parity tests /7596 cases + contracts/integration |
| Movement/doors | 6 tests /1702 cases + source gate |
| Buff/FlavourBuff | 6 tests /504 sequences /4032 checkpoints |

Прежний CI run36225450263, code cb79abd7cba228b96bff16ed5ff61a27a9337f64:
kernel job108358475470 SUCCESS90/90; contracts30/30; scoped TS6/extraction SUCCESS;
app job108358475302 FAILURE. Наборы частично пересекаются; cases не процент готовности.
История и пределы доказательств сохранены в features/{ci,character,movement-buffs}.md.
Текущий локальный kernel повторно проверил прежние участки без изменения исходных expected.

## Открытая очередь

P00.1/P00.2: semantic completeness и aggregation features в source-map.
P00.3–P00.6: полный Android oracle, production collection/RNG order, saves/clocks/callbacks.
P01.1: устранить vendor declaration incompatibility, canonical lockfile и npm ci.
P01-RULES: старые type imports/scaffold contracts, shader path и остальные policy gates.
P03/P05/P06: конкретные эффекты/собственные checkpoints, флаги и composition реальных Char,
затем Hero/Mob/Level и первый полный командный сценарий. Следующий участок — status effects.
P04–P10: полный content/UI/save/visual parity ещё не подтверждён.

Baseline ce7f241515fd5c040fcf18b4beb5b7a49d9d535f и PD-classes
c0b690a4163020963e70a58a7d4f27965dc8f134 неизменны. src/assets/res/manifest/license не менялись.
Browser automation запрещена и не запускалась. Scratch — ignored root tmp; исходные expected
не получаются TS-портом. Новая частичная реализация не выдаётся за законченный порт.
