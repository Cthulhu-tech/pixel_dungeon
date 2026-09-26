# Фактический статус переноса

Обновлено 2026-09-26. Поручение: продолжать задачу за задачей без промежуточных подтверждений.
PLAN P00–P10 — единственная очередь. Полной играбельной браузерной игры пока нет.

## Текущий участок: движение, двери и базовые эффекты

Исходный checkpoint: 72aa779af97b012badc17a396fceabaed9f6c97c.
Добавлены CharacterMovement (canonical position и Char.move/distance), GridDoors,
общая geometry для Level.adjacent/distance/NEIGHBOURS8, Buff/FlavourBuff/BuffOperations,
owner declarations/README, Java oracle, contracts, scoped configs/extraction.
GridNavigation теперь использует общую adjacency; источник правил не продублирован.
Подробное source mapping и команды: [features/movement-buffs.md](features/movement-buffs.md).

Локально подтверждены movement.test 6/6 (1702 Java cases), buffs.test 6/6
(504 sequences /4032 checkpoints), strict scoped tsc movement/effects на TS5.8.3.
Окружение Node22.16.0/npm10.9.2/JDK21.0.11; восстановленный subset, не полный clone.
Оригинальные Buff.java/FlavourBuff.java совпали по Git blob перед компиляцией.
Новые source-token gate, четыре real-scheduler integrations и installed-compiler extraction
включены в CI. До чтения конкретных новых jobs их результат NOT_VERIFIED.

Position принадлежит CharacterMovement; базовый move не меняет occupancy/время/next.
Двери работают через owner ports, heap удерживает дверь, observation имеет исходные фазы.
Buff owns target, character owns collection, scheduler owns time. Append/affect/prolong
сохраняют различия; исходные caught Exceptions диагностируются, fatal errors не скрываются.
Это не полный Char/Hero/Mob, каталог buffs, Level.set, UI или saves.

## Ранее подтверждено, не обнулять

| Участок | Матрица последнего прочитанного CI |
| --- | --- |
| Random | 13 tests /9242 original-Java cases |
| PathFinder | 5 tests /5460 cases |
| Ballistica | 6 tests /9150 cases |
| ShadowCaster | 6 tests /8260 cases |
| Actor scheduler | 6 tests /106 сценариев /4129 checkpoints |
| Continuations | 13 contracts, включая1000 completions |
| Navigation policy | 6 tests /5776 selected-method cases |
| Char health/combat/time | 4 parity tests /7596 cases + source/contracts/integration |

Code commit325cb12f0f996cead0489c3c8adeb90d9dfd6322, CI run36224213193:
kernel job108354996248 SUCCESS; test:kernel73/73, contracts26/26, 0 skipped.
TS6.0.3 scoped character typecheck/extraction SUCCESS в dependency job108354996241;
поздний общий app build FAILURE. Подробности: [features/character.md](features/character.md).
Наборы частично пересекаются, числа cases/checkpoints не являются процентом готовности.

## Оставшийся blocker P01.1

Последний прочитанный app CI: все7 exact pins FOUND, install46 packages без install scripts;
actual compilerTS6.0.3. Общий tsc падает на Phaser TS2526/TS2416, устаревших rex declarations
и XState StateSchema/exactOptionalPropertyTypes. Vite build и поздние gates не выполнялись.
Новые scopes проверяются перед этим известным failure; это не скрывает app failure.
Никакие skipLibCheck, any, fake typings, downgrade или отключение strict не добавлены.
Canonical lockfile отсутствует. История CI failures и отозванных неподтверждённых ранних
сообщений: [features/ci.md](features/ci.md), без переписывания исторических результатов.

## Следующие незавершённые участки

- P00.1/P00.2: semantic completeness и aggregation features в существующий source-map.
- P00.3–P00.6: полный original Android build, production collection order/RNG schedule,
  saves/clocks, оставшиеся callbacks. Selected-method oracles не доказывают всё приложение.
- P01.1: strict dependency compatibility/lockfile; P01-RULES: старые types/shaders/policy gates.
- P02/P03/P05/P06: Char collection/add/remove/updateSpriteState, конкретные buffs,
  реальные Hero/Mob и их movement overrides, Level.set/observe и production composition.
- P03/P09: полноценный командный сценарий, save/checkpoint и continuation wiring.
- P04–P10: полный content/UI/save/visual parity NOT_VERIFIED.

Baseline ce7f241515fd5c040fcf18b4beb5b7a49d9d535f и PD-classes pin
c0b690a4163020963e70a58a7d4f27965dc8f134 неизменны. Исходные src/assets/res/manifest/license
не менялись. Runtime — web, tests/oracles — соответствующие каталоги, scratch — ignored tmp.
Браузер не запускался/не автоматизировался. Ручная visual/input/audio evidence отсутствует;
запрет test:e2e и незелёный общий parity gate сохранены. Новый код не выдаётся за полную игру.
