# Фактический статус переноса

Обновлено 2026-09-26. Работа по единому PLAN, без промежуточных подтверждений.
Полной играбельной браузерной игры пока нет. Полный visual/input/audio parity NOT_VERIFIED.

## Текущий участок: 15 ресурсных эффектов и взаимодействия с предметами

Poison/Bleeding/Barkskin/Fury/Ooze/Regeneration/Hunger/SnipersMark/Charm/Terror/GasesImmunity/
Weakness/Combo/Frost/Burning реализованы через owner ports. Вместе с предыдущими 16 статусами
это все 31 top-level concrete class исходного actors/buffs. Nested item/ring buffs, blobs,
production Hero/Level/Item composition по-прежнему открыты: это НЕ завершение effects/P06.

Независимые 1150 Java sequences /9191 checkpoints PASS. Локальный test:kernel120/120,
test:contracts53/53, scopes effects/character/run и extraction PASS на actual TS6.0.3.
CharacterHealth.addCurrent выполняет регенерацию без damage callbacks. Метаданные/сообщения
owner-local; ResultDescriptions принадлежат run. Подробности:
[features/resource-effects.md](features/resource-effects.md). Новый CI ещё предстоит прочитать.

## Предыдущие новые участки этой серии

CharacterBuffs: девять исходных методов, 475 Java sequences /10235 checkpoints, 4 интеграции.
Commit f0d28682724eca00f14cec85e58bbf2d6a48bcee. CI run36234828235:
kernel job108384583625 SUCCESS, scoped types/extraction SUCCESS, app build FAILURE.
Детали: [features/character-buffs.md](features/character-buffs.md).

16 статусов и CharacterStatus: 390 sequences /6465 checkpoints, 8 интеграций.
Commit 6f1378bcb60a664a846f3eaf9cd09bdfcd98c516. CI run36236450307:
kernel job108389143817 SUCCESS, dependency job108389143847 overall FAILURE после scoped PASS.
Статусы jobs прочитаны; локальные числа не выданы за отдельный прочитанный полный log.
Детали: [features/status-effects.md](features/status-effects.md).

Membership принадлежит Char, target — Buff, flags — CharacterStatus, HP — CharacterHealth,
часы — TurnScheduler. Реальные доступные владельцы связаны integration tests; World/Item/Hero
в oracle — явные тестовые входы, не production replacements. Порядок HashSet остаётся
контролируемым входом до проверки production runtime. Новые проверки не доказывают весь Char.

## Toolchain: найден совместимый кандидат, приложение ещё не переведено

Текущие app pins остаются прежними. Общий build имеет 31 vendor diagnostic Phaser/rex/XState;
strict/any/skipLibCheck/fake declarations не использовались для обхода ошибки.

Run36236781664 проверил опубликованные XState5 candidates и Phaser4.1 + rex. Phaser4.1.0 и
rex4.2.0 Button entry проходят строгий TS6; полный rex UI entry и проверенные XState5
кандидаты с exactOptionalPropertyTypes не проходят. Run36237318057, artifact10904453327:
combined probe Phaser4.1.0 + rex4.2.0 plugins/button.js + XState4.38.3 дал typecheckExit0.
SHA256 ZIP873211d08bd5ebb1e9e41c0c4ca8284408fd478cd02de27f29dbe0c2135f5edb проверен.
Это кандидат, НЕ уже проверенная новая сборка приложения. Следующая P01.1 явно адаптирует API,
фиксирует решение/lockfile и проверяет app целиком. Успешный probe не заменяет app acceptance.

## Полный локальный checkout и автоматические границы

Полный source bundle и установленные packages получены из CI artifact10902809718;
SHA256 ZIP/bundle/tar проверены. Далее Git snapshot обновлён artifact10904976019 до f1bf457...
и точной записью workflow commit e0a4d864eec220d8f124b66221e0f8ffe7b97367.
Локально Node22.16.0/JDK21.0.11/actual TS6.0.3, не восстановленный вручную subset.
Provenance: [features/compilation-inputs.md](features/compilation-inputs.md).

Boundary checker различает метод process и Node global, принимает только owner-local JSON;
9 regression tests и общий gate прошли. P01-RULES этим не закрыт: старый scaffold ещё содержит
type imports, DOM controls, import-time startup и непроверенный world shader path.
Canonical lockfile пока отсутствует в Git; успешного npm ci не заявляется.

## Сохранённое ядро

| Участок | Предыдущая подтверждённая матрица |
| --- | --- |
| Random | 13 tests /9242 Java cases |
| PathFinder | 5 tests /5460 cases |
| Ballistica | 6 tests /9150 cases |
| ShadowCaster | 6 tests /8260 cases |
| Actor scheduler | 6 tests /106 sequences /4129 checkpoints |
| Continuations | 13 contracts, включая1000 completions |
| Navigation policy | 6 tests /5776 selected-method cases |
| Char health/combat/time | 4 parity tests /7596 cases + integrations |
| Movement/doors | 6 tests /1702 cases + source gate |
| Buff/FlavourBuff | 6 tests /504 sequences /4032 checkpoints |

Прежний CI run36225450263, code cb79abd7...: kernel90/90 и contracts30/30 PASS,
scoped TS6/extraction PASS, app FAILURE. История сохранена в features/{ci,character,
movement-buffs}.md. Текущий локальный kernel повторно проверил прежние участки.
Наборы kernel/contracts пересекаются; cases и количество файлов не процент готовности.

## Открытая очередь

P00.1/P00.2: semantic completeness и aggregation features в source-map.
P00.3–P00.6: полный Android oracle, production collection/RNG order, saves/clocks/callbacks.
P01.1: подтверждённая общая сборка на подходящем опубликованном наборе, canonical lock/npm ci.
P01-RULES: scaffold contracts/types, single-canvas UI, lifecycle, shaders и полные policy gates.
P03/P05/P06: production Char/Hero/Mob/Level/Items composition, nested effects/blobs и первый
полный командный сценарий. P04–P10: полный content/UI/save/visual parity остаётся открытым.

Baseline ce7f241515fd5c040fcf18b4beb5b7a49d9d535f и PD-classes c0b690a4163020963e70a58a7d4f27965dc8f134 неизменны.
src/assets/res/manifest/license не менялись. Браузер не запускался и не автоматизировался;
его приёмка ручная. Scratch — ignored root tmp; expected получены не тестируемым TS-портом.
