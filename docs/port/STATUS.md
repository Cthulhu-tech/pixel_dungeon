# Фактический статус переноса

Обновлено 2026-09-26. PLAN P00–P10 — единственная очередь; подтверждения между задачами
не нужны. Полной играбельной игры нет, visual/input/audio parity NOT_VERIFIED.

## Новый результат P01.1 / P01-RULES

Full strict TypeScript6.0.3 + Vite8.3.1 build локально PASS. Приложение явно адаптировано
к Phaser4.1.0, rex4.2.0 plugins/button.js, XState4.38.3, Zustand5.0.15. Обязательный стек
сохранён; major XState исходным запросом не фиксировался. No vendor patches, skipLibCheck,
any, отключения strict или подмены Phaser3. Предыдущие Phaser4.2.1/XState5.33.2/full rex
UI declaration failures остаются историческими фактами, не объявлены успешными.

Собственные типы shell — types/app/*.d.ts. main только экспортирует вход, HTML явно вызывает
composition root. Нет DOM controls поверх canvas. Один shader quad использует исходный
amulet.png, vertex/fragment sources в отдельных GLSL. Scene снимает подписки; Rex component
уничтожается вместе с display target. Shell FAIL отличается от READY; dispose идемпотентен.

Проверено локально на ПОЛНОМ checkout, actual Node22.16.0/JDK21.0.11/TS6.0.3:
- npm run build: PASS, warning о размере bundle не подавлен.
- npm run test:application: 5/5 PASS, реальные XState/Zustand без DOM/browser.
- npm run test:tools: 18/18 PASS; type/GLSL policy имеет negative controls.
- npm run check:boundaries: PASS.
- npm run test:kernel: 120/120 PASS; test:contracts: 53/53 PASS; наборы пересекаются.

Playwright dependency/config/test удалены; test:e2e остаётся BLOCKED/exit2.
Новый CI и canonical lock/npm ci ещё не подтверждены. Текущий локальный package tree
получен из hash-checked CI artifacts; это не свежий локальный npm install (DNS недоступен).
Подробное решение/provenance: [features/application-shell.md](features/application-shell.md).

## Сохранённые игровые участки

Random; PathFinder; Ballistica; ShadowCaster; Actor scheduler/continuations;
Dungeon.findPath/flee; базовые Char combat/health/time; movement/doors; Buff/FlavourBuff;
CharacterBuffs/CharacterStatus; все31 top-level concrete actors/buffs class.

CharacterBuffs:475 sequences/10235 checkpoints,4 integrations; statuses:390/6465,8 integrations;
resource effects:1150/9191. Это выбранные матрицы, не все сочетания/полный игровой мир.
Mapping/evidence: features/{random,pathfinding,ballistics,visibility,turns,navigation,
character,movement-buffs,character-buffs,status-effects,resource-effects}.md.
Полная локальная повторная проверка включает прежние участки. Source-map aggregation ещё открыта.

## История и источники

Исходный checkpoint этой правки bbfc127564638b528e0d9a198facebd5e56675a2.
Полный checkout/dependencies: CI run36238380348 artifact10905087352; candidate packages:
artifact10905122217. Hashes ZIP/bundle/tar проверены и записаны в application-shell evidence.
Предыдущие CI run36225450263,36234828235,36236450307 подтверждали kernel/scopes,
но app build имел FAILURE. Их история не заменяется новым локальным PASS.

Source baseline ce7f241515fd5c040fcf18b4beb5b7a49d9d535f и PD-classes
c0b690a4163020963e70a58a7d4f27965dc8f134 неизменны. Исходные src/assets/res/manifest/license
не изменялись. Runtime — web; scratch — ignored root tmp. Браузер не запускался.

## Следующая очередь

P01.1: фактический новый CI, canonical lock и npm ci; P01-RULES: ручная проверка реального
render/input/lifecycle, оставшиеся статические границы. P00.1/P00.2: semantic inventory и
aggregation source-map; P00.3–P00.6: полный Android oracle и production collection/RNG order.
P03/P05/P06: production Char/Hero/Mob/Level/Item composition, nested effects/blobs и первый
полный командный сценарий. P04–P10: весь контент/UI/save/визуальное соответствие ещё открыты.
