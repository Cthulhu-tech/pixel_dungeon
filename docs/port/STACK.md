# Стек и технические решения

Дата проверки официальных материалов: 2026-09-26. Это архитектурное решение, не результат установки пакетов: версии и совместная browser-сборка пока не проверены.

## Обязательная часть

| Технология | Принятое назначение | Чего она не делает |
| --- | --- | --- |
| JavaScript + TypeScript | Основная реализация — strict TypeScript, исполняемый результат — JavaScript; .mjs допустим для инструментов | Две параллельные JS/TS-реализации одного правила не нужны |
| Vite | Dev server, сборка и поставка браузерного приложения | Не владеет domain lifecycle и правилами |
| Phaser 4, пакет `phaser` | Render, assets, input, camera, animation, audio | Не содержит combat/inventory/AI/turn economy |
| `xstate` | Сценарии приложения и взаимодействия; загрузка, меню, запуск, продолжение, targeting, playback continuation | Не заменяет Actor scheduler и не дублирует domain state |
| `zustand`, entrypoint `zustand/vanilla` | UI read models, selectors, ephemeral UI state | Не хранит второй изменяемый мир и не требует добавления React |
| `phaser4-rex-plugins` | Layout, окна и компоненты в точном оригинальном оформлении | Не задаёт новый UI-дизайн и не подменяет исходные игровые алгоритмы |

Phaser 4 обязателен: не откатывать на Phaser 3 «ради совместимости», не подменять PixiJS. Доступность названия библиотеки не доказывает совместимость конкретного набора версий.

Документация rex сейчас показывает:

```ts
import RexUIPlugin from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';
```

Это проверенный путь в документации, но его работу с выбранными published versions нужно подтвердить на P01. Подключать только необходимые возможности, регистрировать scene plugin явно и освобождать подписки/объекты при shutdown. Не полагаться на то, что старые примеры Phaser 3 подходят внутреннему renderer Phaser 4.

Для доменных алгоритмов, имеющихся в оригинале (pathfinding, FOV, RNG, FSM конкретного AI), наличие похожего плагина rex не является основанием для замены. Сначала поведенческие fixtures, затем решение о переиспользовании.

## Решение N01: navcat — DEFERRED / NOT INSTALLED

Пользовательница оставила navcat под вопросом. В базовый перенос пакет **не добавлять**.

Причина: официальное описание navcat — построение и запросы navigation mesh для 3D floor-based navigation. Исходный Pixel Dungeon использует клеточную карту 32×32, массивы соседей и PathFinder из PD-classes. Navmesh не гарантирует совпадение маршрута, порядка обхода, углов, диагоналей, flee/seek и взаимодействия с динамическими препятствиями.

Базовая реализация: порт исходной клеточной логики за узким PathfindingPort в модуле grid. FOV и баллистика имеют свои контракты; не объединять их в огромный NavigationManager.

Вернуться к navcat можно только с конкретной задачей и тестовым сравнением всех используемых операций. Потребуются неизменные результаты, измеримая польза и отдельное зафиксированное решение. Возможность подключить другой адаптер не означает, что сейчас нужно писать или устанавливать оба. Для будущего другого проекта библиотека может быть полезна, но это не довод менять алгоритм этого порта.

## Версии и окружение: правила P01

1. Проверить registry metadata, engines, exports, types и peer dependencies для реальных опубликованных версий Phaser 4, rex, XState, Zustand, TS и Vite. Не угадывать версии из памяти и не записывать «latest» как воспроизводимую конфигурацию.
2. Если к началу P01 уже есть выбранный package manager/lockfile, сохранить его. Иначе выбрать один и записать в STATUS; не создавать npm/yarn/pnpm lockfiles одновременно.
3. Зафиксировать exact прямые зависимости и один lockfile, версию Node и package manager. При конфликте сначала исследовать поддержанный набор; не менять обязательный стек молча.
4. Vite guide на дату проверки указывает Node 20.19+ / 22.12+ и возможные более строгие требования шаблонов. Выбирать поддерживаемый на момент реализации runtime, удовлетворяющий фактическим engines всего набора, не трактовать этот минимум как вечную рекомендацию конкретной Node-ветки.
5. Использовать vanilla TypeScript setup, не добавлять React/Vue и сервер без задачи.
6. Обязателен отдельный typecheck. Начальные настройки: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes; любые исключения должны быть локальными и объяснёнными. Не отключать type safety глобальным any или фиктивными декларациями API.
7. Зависимости домена от framework/browser API запрещать автоматической архитектурной проверкой.

## Smoke-test совместимости

До реализации UI проверить в реальном браузере:

- старт Vite dev и production preview с Phaser 4;
- загрузку и показ оригинального sprite без размытия/искажения пропорций;
- rex container + кнопку/окно с оригинальным frame/bitmap text;
- input -> XState -> тестовую domain operation -> Zustand projection -> render;
- отсутствие React в обязательном runtime пути;
- создание/уничтожение сцены, отписки, повторный старт;
- production asset URLs при ненулевом base path, работу загрузки в целевом размещении;
- отсутствие console errors и неявного Phaser 3 fallback.

Тестовую операцию/fixture явно обозначить как инфраструктурную, не как перенесённую механику. Без результатов этого smoke-test стек имеет статус SELECTED_NOT_VERIFIED.

## Dev tooling

На P01 выбрать и закрепить минимально достаточные инструменты unit/contract/parity, browser e2e и проверки import graph. Допустимы Vitest, Playwright и ESLint/анализатор зависимостей после проверки актуальных версий; это dev tooling, не новая игровая архитектура.

Создать реально работающие scripts `dev`, `build`, `preview`, `typecheck`, `lint`, `test:unit`, `test:contracts`, `test:parity`, `test:e2e`, `check:boundaries`. Не выдавать отсутствие fixtures или skipped tests за успешный parity gate. CI собирает и проверяет, но сам по себе не публикует игру без отдельной задачи.

## Проверенные первичные источники

- Phaser: https://github.com/phaserjs/phaser
- Rex UI: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/
- XState actors: https://stately.ai/docs/actors
- Zustand vanilla API: https://zustand.docs.pmnd.rs/reference/index
- Vite: https://vite.dev/guide/
- Navcat: https://github.com/isaac-mason/navcat и https://navcat.dev/

Эти ссылки подтверждают назначения/API библиотек, а не факт запуска нашего приложения. Полный список установленного стека появится в package.json/lockfile вместе с первым успешным smoke-test.
