# Фактический статус переноса

Обновлено 2026-09-26. Поручение: последовательно выполнять задачи без повторных подтверждений.
PLAN P00–P10 — единственная очередь. Полной играбельной игры ещё нет.

## Пять законченных алгоритмических участков продолжения

| Участок | Результат | Проверка |
| --- | --- | --- |
| Random | Все16 wrapper operations; collection order задан явно | 13/13 tests, 9242 Java cases |
| PathFinder | Exact path/step/retreat, distance maps/quirks | 5/5 tests, 5460 cases |
| Ballistica | Trace/collision, magic/hitChars/query order | 6/6 tests, 9150 cases |
| ShadowCaster | Eight-sector float32 visibility | 6/6 tests, 8260 cases |
| Actor scheduler | Clocks/membership/current/hooks/ID/occupancy | 6/6 tests, 106 scenarios/4129 checkpoints |

**Последний общий прогон: 36/36 PASS, 0 skipped.** Сравнены 32112 algorithm cases и
4129 последовательных scheduler checkpoints. Это разные единицы сценариев, не процент готовности.
Команда из web: `node --experimental-strip-types --test tests/parity/random.test.mjs tests/parity/random-collections.test.mjs tests/parity/pathfinding.test.mjs tests/parity/ballistics.test.mjs tests/parity/visibility.test.mjs tests/parity/turns.test.mjs`.

Strict kernel typecheck и отдельные extraction compatibility/turns/kernel — PASS.
Extraction host теперь общий tools/module-extraction.mjs; wrappers явно перечисляют
owners. Standalone turns проверяется БЕЗ grid/compatibility/прочих globals/DOM.

## Коммиты и evidence

Random `3777e64296e2a87b52bf2812702d9909ddfb79a2`; PathFinder `b9f21257bdad022d411b1795455ea30753fab398`;
Ballistica `03aae50995bc979ada87d90ab50af32357d6f703`; ShadowCaster `0984d661d020024db472a78c919b65c39b21311a`.
Actor scheduler — текущий атомарный code/test/docs набор. Symbol mappings в features/
random.md, pathfinding.md, ballistics.md, visibility.md, turns.md.

Каждый original Java algorithm hash-checked и неизменён. Для Actor test-only соседние
классы дают scripted behavior, primitive fields и world inputs; не подменяют scheduler.
**Порядок membership контролируется LinkedHashSet через reflection** и совпадает с TS input;
это не эмуляция произвольного Android HashSet/identity hash. Bundle adapter не является save codec.

Окружение Node22.16.0, JDK21.0.11, доступный TS5.8.3. GitHub DNS не позволяет полный clone;
относящиеся files восстановлены через connector. Project versions не менялись, full npm
install/ci с заявленным TS6.0.3 не выполнялся.

Не выполнены: full app typecheck/build/architecture gate, полная inventory проверка,
whole Android/PD-classes build, browser launch/automation и human visual/input/audio evidence.
Общий test:parity не выдаёт ложный full PASS; test:e2e остаётся blocker/exit2.

## Архитектурное уточнение

Source Actor.chars[] — производный индекс turns. Canonical actor position остаётся actors;
grid использует query port, а не второй occupancy owner. ARCHITECTURE обновлён вместе с кодом.
Time/ID weak records сохраняются у scheduler; clockOf/list — detached projections, не live stores.
clear/current, late lazy-ID indexing, duplicate buff hooks, moving/next/death и частичное
состояние при bounds failure воспроизведены. Никакого игрового rebalance/fallback.

## Следующие области PLAN

P02: следующий законченный участок — stale-safe continuation IDs/generations и cancellation
для animation acknowledgments. Raw next пока только domain API. Реальные Char/AI/Level,
коллекционный порядок Android, production RNG/save и полный draw schedule не интегрированы.
P00.1/P00.2: file inventory/source-map есть, semantic completeness/aggregation evidence открыты.
P00.3–P00.5: isolated oracles работают, whole original runtime compatibility не доказана.
P00.6: прочие callbacks/saves/clocks/collection owners требуют аудита.
P01/P01-RULES: full toolchain/lockfile, старые type imports, shader path и policy gates открыты.
P03–P10: full gameplay/visual parity NOT_VERIFIED. Source-map не назначать whole-file VERIFIED
по отдельному классу и не обнулять существующие записи.

## Сохранность

Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, PD-classes
`c0b690a4163020963e70a58a7d4f27965dc8f134` сохранены. Предыдущие checkpoints:
`6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60` initial docs;
`6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2` inventory/web scaffold;
`029fac6143cc09cc000b68c4349e1d0e990acc1f` PLAN/PSX-CORE rules;
`93aa9b7dba5e78fbe7e471ce49f137e839ffb8ce` первый scalar/oracle/extraction этап.

Исходные src/assets/res/AndroidManifest/LICENSE не менялись. Runtime — web, references —
tests/reference, oracles — tools/port, scratch — root tmp (hosts удаляются). Нет нового арта,
браузерных запусков, dependency downgrade, игровых заглушек или reset предыдущей работы.
