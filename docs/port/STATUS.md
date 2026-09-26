# Фактический статус переноса

Обновлено 2026-09-26 после реализации движения/дверей/базовых Buff и чтения завершённого CI.
Поручение: продолжать задачу за задачей без промежуточных подтверждений.
PLAN P00–P10 — единственная очередь. Полной играбельной браузерной игры пока нет.

## Новый проверенный участок

Исходный checkpoint: 72aa779af97b012badc17a396fceabaed9f6c97c.
Code commit: cb79abd7cba228b96bff16ed5ff61a27a9337f64.
Добавлены CharacterMovement (canonical position и Char.move/distance), GridDoors,
общая geometry для Level.adjacent/distance/NEIGHBOURS8, Buff/FlavourBuff/BuffOperations,
owner declarations/README, Java oracle, contracts, scoped configs/extraction.
GridNavigation использует общую adjacency; прежняя navigation-проверка прошла повторно.
Подробная source map этой части: [features/movement-buffs.md](features/movement-buffs.md).

**CI run36225450263 завершён, оба журнала прочитаны, head совпадает с code commit.**
Kernel job108358475470 SUCCESS: npm run test:kernel **90/90 PASS**, test:contracts
**30/30 PASS**, 0 skipped. Наборы частично пересекаются, не складывать их как уникальные tests.

Новые проверки: movement-source hash/token gate шести исходных методов PASS;
movement6/6 tests с1702 Java cases; buffs6/6 tests с504 sequences/4032 checkpoints;
4/4 integrations с настоящим TurnScheduler. Contract-entry regression1/1 и audit fixtures5/5 PASS.
Количество cases/checkpoints не означает процент готовности игры.

Dependency job108358475302 имеет общий FAILURE, но на **TypeScript6.0.3** успешно выполнены:
- typecheck:character и check:extraction:character, включая negative declaration control;
- typecheck:movement, typecheck:effects и typecheck:kernel;
- check:extraction:movement, check:extraction:effects и check:extraction:kernel.
Все эти scopes проверялись до позднего app failure. Это не обход ошибки общей сборки.

Position принадлежит CharacterMovement; базовый move не изменяет occupancy/время/next.
Двери используют owner ports, heap удерживает дверь, observation имеет исходные фазы.
Buff owns target, character owns collection, scheduler owns time. Append/affect/prolong
сохраняют различия; исходные caught Exceptions диагностируются, fatal errors не скрываются.
Это не полный Char/Hero/Mob, каталог buffs, Level.set, UI или saves.

## Ранее реализованные участки — повторно прошли в новом CI

| Участок | Матрица |
| --- | --- |
| Random | 13 tests /9242 original-Java cases |
| PathFinder | 5 tests /5460 cases |
| Ballistica | 6 tests /9150 cases |
| ShadowCaster | 6 tests /8260 cases |
| Actor scheduler | 6 tests /106 сценариев /4129 checkpoints |
| Continuations | 13 contracts, включая1000 completions |
| Navigation policy | 6 tests /5776 selected-method cases |
| Char health/combat/time | 4 parity tests /7596 cases + source/contracts/integration |

Прежний code commit325cb12f0f996cead0489c3c8adeb90d9dfd6322, CI run36224213193:
kernel job108354996248 SUCCESS73/73, contracts26/26; scoped character TS6/extraction SUCCESS;
поздний app build FAILURE. История: [features/character.md](features/character.md).
Новый успех не отменяет прежние failures и ограничения их доказательств.

## Реальный blocker P01.1 сохраняется

Run36225450263 /job108358475302: все7 exact pins FOUND; npm install --ignore-scripts
--no-audit --no-fund установил46 packages, compilerTS6.0.3. Общий npm run build завершился
exit2 в tsc: Phaser TS2526/TS2416, устаревшие rex types/imports/NameInputDialog declarations,
XState StateSchema/exactOptionalPropertyTypes. Новые игровые scopes типизируются успешно.
Vite build, общий boundary gate и поздние compatibility/turns extraction skipped.

Нет skipLibCheck, any, fake typings, downgrade или отключения strict.
Canonical lockfile отсутствует; успешного воспроизводимого npm ci нет. История ранних CI
и отозванных неподтверждённых сообщений: [features/ci.md](features/ci.md).

## Локальная проверка и пределы доказанного

Локально до публикации: movement.test6/6 (1702 Java cases), buffs.test6/6
(504 sequences/4032 checkpoints), strict scoped tsc movement/effects PASS на TS5.8.3.
Node22.16.0/npm10.9.2/JDK21.0.11; восстановленный subset, не полный clone (git DNS unavailable).
Оригинальные Buff.java/FlavourBuff.java совпали по Git blob перед компиляцией.
Полные source-token checks, scheduler integrations и installed compilerTS6 проверены именно
CI из полного checkout. CI Java — Temurin javac21.0.12.1, Node22.16.0/npm10.9.2.

Movement oracle использует выбранные исходные методы и test-only Level/Actor/Sprite ports.
Buff oracle компилирует полные исходные Buff/FlavourBuff с тестовыми target/clock/UI соседями;
UI icon не проверен. Это не production Hero/Mob/Char collection и не полный Android build.
Source-map остаётся file-level: новые features не дают права поставить VERIFIED целому
Char/Level/Buff или всем этапам P03/P05/P06. Aggregation остаётся открытой P00.2.

## Следующие незавершённые участки

- P00.1/P00.2: semantic completeness и aggregation features в существующий source-map.
- P00.3–P00.6: полный original Android build, production collection order/RNG schedule,
  saves/clocks и оставшиеся callbacks. Selected-method oracles не доказывают всё приложение.
- P01.1: strict dependency compatibility/lockfile; P01-RULES: старые types/shaders/policy gates.
- P02/P03/P05/P06: Char collection/add/remove/updateSpriteState и конкретные buffs;
  затем реальные Hero/Mob и их movement overrides, Level.set/observe, production composition.
- P03/P09: полноценный командный сценарий, save/checkpoint и continuation wiring.
- P04–P10: полный content/UI/save/visual parity NOT_VERIFIED.

Baseline ce7f241515fd5c040fcf18b4beb5b7a49d9d535f и PD-classes pin
c0b690a4163020963e70a58a7d4f27965dc8f134 неизменны. Исходные src/assets/res/manifest/license
не менялись. Runtime — web, tests/oracles — соответствующие каталоги, scratch — ignored tmp.
Браузер не запускался/не автоматизировался. Ручная visual/input/audio evidence отсутствует;
запрет test:e2e и незелёный общий parity gate сохранены. Новый код не выдаётся за полную игру.
