# Фактический статус переноса

Обновлено 2026-09-26. PLAN P00–P10 — единственная очередь; подтверждения между задачами
не нужны. Полной играбельной игры нет, visual/input/audio parity NOT_VERIFIED.

## Следующие завершённые участки кода: исследование карты и базовый газ

RunObservation сохраняет отдельную текущую видимость героя; LevelExploration владеет visited/mapped.
BlobField переносит spread/decay, seed/clear, собственные save fields и исходное resizing.
Проверены 420 observation sequences /2520 checkpoints и320 Blob sequences /2894 checkpoints.
Локально: новые11 tests PASS; полный kernel144/144, contracts53/53; build/boundaries,
typecheck:run, effects/kernel extraction PASS. Наборы пересекаются; browser parity не проверялся.
Evidence: [features/observation-blobs.md](features/observation-blobs.md).

CI terrain/sight run36256765151 на3c7d979a2e9b22d801b91a92d69b4c7249a85879 завершился
SUCCESS (прочитан API после завершения). Результат CI следующего commit не назначается заранее.

## Сохранённый участок P02/P03/P04 — состояние уровня и обзор

Checkpoint начала: `93ceeb7c68bfe875909c25644a2a2229b069a108`.
Добавлены TerrainGrid, исходные terrain tables/discover, LevelSight, owner declarations,
независимый Java oracle и интеграции с настоящими GridDoors/GridShadowCaster.
Подробности: [features/terrain-sight.md](features/terrain-sight.md).

TerrainGrid владеет map и девятью масками; сохранены set/build phases, границы, water/pit
stitching, cleanWalls и destroy/flood. LevelSight сохраняет Blindness/Shadows/MindVision,
Huntress/Awareness, порядок queries, полное discoverable-пересечение и reusable FOV.

Локально на полном checkout с установленным TS6.0.3/Vite8.3.1:
- terrain:6/6 PASS,357 sequences /2214 original-Java checkpoints, все256 slots flags.
- level-sight:6/6 PASS,2608 Java cases, все1024 клетки/ordered queries.
- общий kernel:133/133 PASS; contracts:53/53 PASS; наборы пересекаются.
- application:5/5 PASS; tools:18/18 PASS.
- full strict build, boundaries и kernel extraction:PASS; bundle-size warning не подавлен.
Итоговый kernel и build повторно прошли после фиксации текущего content shape. Результаты
нового CI не назначаются заранее. Полный port/visual parity не выводится из PASS.

## P01: подтверждённый предыдущий CI

Run36250243190, head93ceeb7c68bfe875909c25644a2a2229b069a108: overall SUCCESS
(прочитано API этой сессией). Старый blocker vendor declarations закрыт для выбранного набора:
Phaser4.1.0, rex4.2.0 button plugin, XState4.38.3, Zustand5.0.15, TS6.0.3, Vite8.3.1.
No skipLibCheck/any/vendor patches. История прежних failures остаётся в features/ci.md.
Canonical lock/npm ci пока не закрыты. Dependency versions этой задачей не менялись.

## Сохранённые игровые участки

Random; PathFinder; Ballistica; ShadowCaster; Actor scheduler/continuations;
Dungeon.findPath/flee; Char combat/health/time; movement/doors; Buff/FlavourBuff;
CharacterBuffs/CharacterStatus; все31 top-level concrete actors/buffs class.
Mapping/evidence: features/{random,pathfinding,ballistics,visibility,turns,navigation,
character,movement-buffs,character-buffs,status-effects,resource-effects}.md.
Это выбранные матрицы, не полные классы/все сочетания/игровой мир. Source-map aggregation открыта.

## Окружение и границы

Full checkout + resolved dependency tree восстановлены из artifact10908891344,
run36250243190. ZIP/bundle/tar hashes сверены; подробности в terrain-sight evidence.
Node22.16.0/npm10.9.2/JDK21.0.11/actual TS6.0.3. Свежий локальный npm install/ci не выполнялся:
прямой git clone завершился DNS error. Новый runtime тестируется на полном исходном дереве.
Source ce7f241515fd5c040fcf18b4beb5b7a49d9d535f и PD-classes c0b690a4163020963e70a58a7d4f27965dc8f134 неизменны.
Исходные src/assets/res/manifest/license не менялись. Браузер не запускался.

## Следующая очередь

P01.1: canonical lock и чистый npm ci. P00.1/P00.2: semantic inventory/source-map aggregation;
P00.3–P00.6: полный Android oracle и production collection/RNG order.
P03/P05/P06: реальные Char/Hero/Mob/Item, renderer binding afterObserve, полный Level lifecycle,
nested effects/blobs и первый полный командный сценарий. P04–P10: генераторы, полный
контент/UI/save и ручное визуальное соответствие остаются открытыми.
