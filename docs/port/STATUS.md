# Фактический статус переноса

Обновлено 2026-09-26. Продолжение: задача за задачей, без повторных запросов подтверждения.
PLAN P00–P10 — единственная очередь. Полной играбельной браузерной игры ещё нет.

## Семь выполненных участков продолжения

| Участок | Реализация | Фактическая проверка |
| --- | --- | --- |
| Random | Все 16 wrapper operations; collection order explicit | 13/13 tests, 9242 Java cases |
| PathFinder | Exact path/step/flee и distance maps | 5/5 tests, 5460 cases |
| Ballistica | Trace/collision/magic/hitChars/query order | 6/6 tests, 9150 cases |
| ShadowCaster | Eight-sector visibility с float32 intervals | 6/6 tests, 8260 cases |
| Actor scheduler | Clocks/current/hooks/membership/IDs/occupancy | 6/6 tests, 106 scenarios / 4129 checkpoints |
| Continuation gate | Stale/duplicate/foreign callback guard и cancellation | 13/13 contracts, включая 1000 completions |
| Navigation policy | Dungeon.findPath/flee: flight/buffs/avoid/visible actors | 6/6 tests, 5776 selected-original-method cases |

Числа случаев не являются процентом готовности. Java full-file algorithms дают 32112 cases;
navigation — ещё 5776 сравнений выбранных исходных методов в test-only shell; scheduler —
4129 последовательных checkpoints. Continuation safety tests не считаются Java comparisons.

## Последний прогон

| Команда из web | Результат |
| --- | --- |
| `npm run test:kernel` | **55/55 PASS**, 0 skipped |
| `npm run test:contracts` | **14/14 PASS**, 0 skipped |
| `npm run test:parity:navigation` | **6/6 PASS**, 5776 comparisons после последнего уточнения теста |
| `node --test tools/contracts-entrypoint.test.mjs` | Ранее в этой сессии 1/1 PASS; общий contract runner проверен реально |
| `npm run typecheck:kernel` | PASS, strict без DOM |
| `npm run check:extraction:kernel` | PASS; только compatibility/grid/turns и собственные .d.ts |

Отдельные compatibility/turns extraction тоже проходили на предыдущем checkpoint этой
сессии; их код не менялся в navigation. 55 kernel и 14 contracts пересекаются, не складывать
как уникальные tests. Источник прогонов — восстановленные относящиеся файлы, не полный clone.

Общий test:contracts исправлен после воспроизведённого ERR_UNKNOWN_FILE_EXTENSION на Node22.16.0:
добавлен TS stripping, проверены целевой и общий npm входы. Regression проверяет фактический
запуск, не принимает пустой/skipped вывод. Details: features/contract-runner.md.

## Commits и evidence

Random `3777e64296e2a87b52bf2812702d9909ddfb79a2`;
PathFinder `b9f21257bdad022d411b1795455ea30753fab398`;
Ballistica `03aae50995bc979ada87d90ab50af32357d6f703`;
ShadowCaster `0984d661d020024db472a78c919b65c39b21311a`;
Actor `322c57649392fc4dc28f1419ce2dba6c537e7225`;
continuations + contract runner `3e9acd6da3c763a3c3b6393be2733e21460e1172`;
navigation — текущий атомарный набор.
Reports: features/random.md, pathfinding.md, ballistics.md, visibility.md, turns.md,
continuations.md, navigation.md. File-level source-map ещё требует aggregation с ними.

## Границы доказательства

Random/PathFinder/Ballistica/ShadowCaster/Actor reference files byte-identical pinned blobs.
Navigation reference сохраняет выбранные method bodies Dungeon/Level/BArray, но меняет
class/package оболочку для изолированного oracle; это явно описано, не whole Dungeon build.
Test-only bindings задают inputs и наблюдают queries, PathFinder делегируется оригиналу.

В Actor oracle порядок коллекции задан LinkedHashSet через reflection: это НЕ универсальная
эмуляция Android HashSet/identity hash. Production collection owners и полный draw schedule
не закрыты. Primitive Bundle adapter не является save codec. Истинные Char/Hero/Mob/AI/buffs
не подменяются scripted test actors и пока не объявлены реализованными.

GridNavigation уже проверяет реальное соединение с TurnScheduler.findChar/list через ports,
но не перемещает sprite и не тратит ходы. Canonical position остаётся actors, derived chars
index — turns. Gate acknowledge вызывает next, не process; cancel не означает успешный ход.
Source behavior/quirks, ошибки и порядок side effects сохраняются без нового баланса.

## Окружение и незакрытые gates

Реальные прогоны: Node22.16.0/npm10.9.2/JDK21.0.11/доступный TypeScript5.8.3.
Project dependencies не менялись и не устанавливались целиком; TS6.0.3 compatibility не доказана.
GitHub DNS препятствует полному clone; относящиеся тексты восстановлены через connector.

Не выполнены: full app typecheck/build/architecture gate, полный inventory replay, whole
Android/PD-classes build, human browser visual/input/audio acceptance. Браузер не запускался
и не автоматизировался. test:e2e — blocker/exit2; общий test:parity не выдаёт ложный full PASS.

## Открытая работа PLAN

P00.1/P00.2: semantic completeness и aggregation evidence в существующий inventory/source-map.
P00.3–P00.5: whole original runtime compatibility при работающих subsystem oracles.
P00.6: production collection order, RNG consumption, saves/clocks/callbacks.
P01/P01-RULES: full toolchain/lockfile, старые type imports, shaders и остальные policy gates.
P02/P03: настоящие characters/combat/buffs/Level, production RNG/checkpoint и callback wiring.
P04–P10: полный content/UI/save/visual parity NOT_VERIFIED. Не закрывать whole-file по одной функции.

Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f` и PD-classes
`c0b690a4163020963e70a58a7d4f27965dc8f134` сохранены. Предшествующий checkpoint продолжения
`93aa9b7dba5e78fbe7e471ce49f137e839ffb8ce`; ранее existing inventory/web и PLAN/rules не обнулялись.
Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Runtime — web, references —
tests/reference, oracle — tools/port, scratch — root tmp с очисткой временных hosts.
Нового арта, игровых заглушек, reset старой работы, dependency downgrade или browser запуска нет.
