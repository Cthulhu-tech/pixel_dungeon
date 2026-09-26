# Стек и технические решения

Обновлено 2026-09-26. Обязательны [MANDATORY_RULES](MANDATORY_RULES.md). На checkpoint `6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2` уже существует `web/package.json` с точными версиями и npm-конфигурацией. Это факт объявления зависимостей, **не доказательство установки, доступности этих версий или совместного запуска**. В данной документальной задаче пакеты не устанавливались и tests/build не запускались.

## Обязательная часть

| Технология | Назначение | Не допускается |
| --- | --- | --- |
| TypeScript → JavaScript | strict TS — основной код; JS — исполняемый результат; .mjs — инструменты | Две параллельные реализации одного правила |
| Vite | Dev/build/preview | Владение game state или исходной очередью |
| Phaser 4 (`phaser`) | Один WebGL render runtime, assets/input/camera/animation/audio | Combat/AI/inventory в scene; замена на Phaser 3/PixiJS |
| XState | Boot/menu/loading/targeting/playback orchestration | Подмена Actor scheduler и второй герой/мир в context |
| Zustand (`zustand/vanilla`) | UI projections, selectors, ephemeral UI state | Второй mutable gameplay store или React-зависимость ради store |
| phaser4-rex-plugins | Оригинальные UI controls/layout | Новый дизайн вместо оригинала, готовый plugin вместо непроверенного игрового алгоритма |

Один Phaser WebGL canvas; Canvas fallback/DOM UI/другой renderer запрещены. Non-UI графика проходит project shader path; собственные stages — физические owner-local `.glsl`. UI использует Phaser/rex, но не требует отдельного shader на каждый control. Импорт shader source допустим; создание/генерация/склейка его строк в host-коде запрещены. Не переписывать vendor internals и не заменять оригинальные textures.

Путь rexUI, указанный в исходной документации контекста: `phaser4-rex-plugins/templates/ui/ui-plugin.js`. Фактические exports/types/совместимость с установленным Phaser нужно проверить на P01; старые примеры Phaser 3 не считаются доказательством. Подключать нужные plugins явно и освобождать owned resources/subscriptions.

## N01: navcat — DEFERRED / NOT INSTALLED

Пользовательница оставила библиотеку под вопросом. В базовый перенос её не добавлять. Сначала переносится исходный клеточный PathFinder для карты 32×32 с точной семантикой соседей, маршрута, диагоналей, flee/seek и динамической занятости. FOV и баллистика — отдельные узкие контракты, не NavigationManager со всем приложением.

Применимость альтернативной навигации оценивается только под конкретную задачу с доказанной эквивалентностью всех используемых операций и измеримой пользой. Изоляция алгоритма позволяет замену позднее, но не требует двух реализаций сейчас. Правила PSX не делают navcat обязательным здесь.

## P01: версии, declarations и окружение

Проверить registry metadata, engines, exports, types и peer dependencies **фактически записанного** набора. Если конкретная версия отсутствует/несовместима, зафиксировать проблему и исследовать поддержанный набор, не менять обязательный стек молча. Не брать latest как воспроизводимую спецификацию.

Сохранить один package manager; согласованно закрепить его версию, Node и один lockfile. Не утверждать, что lockfile/успешная установка уже есть, только по package.json. Node должен удовлетворять реальным engines всего набора; исторические минимумы не заменяют проверку.

Использовать vanilla TS setup; не добавлять React/Vue/сервер. Strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes и отдельный typecheck; без any/ts-ignore/фиктивных declarations. Все собственные type/interface контракты — ambient `web/src/types/<owner>/*.d.ts`; никаких type imports/exports. Runtime public index экспортирует значения, не типы.

Owner-local JSON доверенный и неизменяемый; не добавлять schema-validation/normalization pipeline. Внешние save/command границы и original parity tests остаются обязательными.

## Automated gate: только без браузера

Агенту запрещены browser launch/attach/automation: Chrome/Edge/Chromium, CDP, Playwright/Puppeteer и wrappers/CI, запускающие браузер. **Существующий `test:e2e` на Playwright не запускать.** P01-RULES должен согласовать прежнюю заготовку scripts/tests/config с этим правилом; в этой документационной задаче code/config сохранены.

Допустимые области автоматизации: Node unit/contract/headless scenario tests, Java oracle, typecheck, build без browser auto-open, import/policy checks, inventory/hash/provenance comparison и offline сравнение уже предоставленных кадров. Node harness для public command flow не называется доказанным browser e2e.

Целевые scripts: `build`, `typecheck`, `lint`, `test:unit`, `test:contracts`, `test:parity`, `test:tools`, `check:boundaries`; при необходимости явно отдельный headless scenario runner. `dev`/`preview` предназначены также для человека; агент не включает auto-open и не обходит запрет браузера их wrappers. Проверять реальное содержание scripts перед запуском.

Не создавать content validator вопреки правилам CORE. Policy tests должны ловить deep imports/cycles/framework use в domain, недопустимые declarations/type imports, inline GLSL и browser automation. Старый check-boundaries может покрывать лишь часть: выяснить, а не объявить всё enforced.

Отсутствующие fixtures/skip дают NOT_READY/NOT_VERIFIED, не подтверждают полный паритет. CI не публикует игру сам по себе и не запускает browser tasks по поручению агента.

## Ручной smoke-test совместимости

Сценарий подготавливает агент; **запускает человек** на конкретном commit/build:

1. Vite dev и production preview действительно открываются с Phaser 4.
2. Оригинальный sprite через project shader path сохраняет pixels/масштаб/пропорции.
3. Rex container/button/window использует оригинальные frame/text metrics.
4. Ввод идёт через command → domain → XState/projection → render, а не прямой mutation scene.
5. Повторный scene/run lifecycle не создаёт дубликатов подписок/объектов/звука.
6. Production asset URLs работают с ненулевым base path; нет missing resources, console errors или silent fallback.

Evidence: commit/build, браузер/OS, viewport/DPR, шаги/inputs, screenshots или video, observations/errors. Технический fixture не считать уже перенесённой игровой механикой. Без такого отчёта browser integration остаётся NOT_VERIFIED независимо от зелёного build.

## Первичные справочные материалы

Исторические ссылки сохранены для целевой проверки на P01, а не как отчёт об установке в этой сессии:

- Phaser: https://github.com/phaserjs/phaser
- Rex UI: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/
- XState: https://stately.ai/docs/actors
- Zustand: https://zustand.docs.pmnd.rs/reference/index
- Vite: https://vite.dev/guide/
- Navcat: https://github.com/isaac-mason/navcat

Фактические версии/результаты фиксируются в package.json, lockfile и STATUS после соответствующих проверок. Стек выбран; полный runtime паритет пока не подтверждён.
