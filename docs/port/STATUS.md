# Фактический статус переноса

Обновлено 2026-09-26. Текущее поручение: **записать согласованный план и взять обязательные правила из PSX/CORE**. В этой сессии изменяется документация, не реализация игры.

## 1. Что записано

- `PLAN.md`: результат каждого этапа P00–P10, четыре реестра, зависимости, первый законченный сценарий, параллельное развитие content/UI/saves, конкретные условия приёмки и формат задачи.
- `MANDATORY_RULES.md`: применимые обязательные правила PSX/CORE, source commits, ограничения типов/JSON/shaders/browser, ownership/lifecycle/quality и таблица явных адаптаций.
- `AGENTS.md`: обязательный вход и маршрутизация нового контекста.
- `ARCHITECTURE.md`, `STACK.md`, `PARITY.md`, `README.md`: согласованы с новыми правилами; нет прежнего требования агенту запускать Playwright ради готовности.
- Этот STATUS: исправлено устаревшее утверждение, что inventory/source-map/web ещё отсутствуют; сохранена граница между наличием кода и его проверкой.

Источники правил: `Cthulhu-tech/psx@9adcf519b8e47c3bdbc5e5c52b78f418715e597f` и `Cthulhu-tech/core-@8b8d7aed0808d2f809de542e77c47f7e53b91915`. Прочитаны обязательные entrypoints/правила, PRE_TASK и относящиеся контекстные разделы. Физические configs/assets и private project content этих игр не переносились. Источники правил не являются зависимостями приложения.

## 2. Реальное состояние main до документальных изменений

Проверенный checkpoint: `6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2`.

Сравнение с прежним docs-only commit `6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60` показало 23 последующих commit и добавленные результаты:

| Область | Что присутствует | Что этим НЕ доказано |
| --- | --- | --- |
| Аудит | tools/port/inventory.mjs и inventory.test.mjs | Полнота поведенческой инвентаризации/результаты теста |
| Реестры | generated/inventory.json, summary.json, source-map.json | Покрытие всех branch/content/UI states или игровое соответствие |
| Workflow | .github/workflows/port-audit.yml | Успешное выполнение всех jobs; workflow не запускался нами в этой сессии |
| Web scaffold | package.json, npm settings, Vite/TS files, entry, smoke scene, flow/store, grid module | Рабочая игра, совместимость объявленных версий или готовый P01 |
| Tests/tools | unit/contract files, check-boundaries, parity gate, Playwright config/test | Прохождение tests, достаточность новых policy gates или visual parity |

Прочитаны package.json и audit workflow. В package.json объявлены exact версии/конфигурация npm; установка/registry compatibility не проверялись. Существующий `test:e2e` вызывает Playwright: **не запускать** по новому PD-R20. Старый test/config в этой документационной сессии не удалялся.

Наличие заготовки не следует обнулять: исходная работа сохраняется. Переход от прежнего NOT_STARTED к наличию scaffold не означает VERIFIED.

## 3. Выполненные и невыполненные проверки этой сессии

**Выполнено:** чтение актуальных GitHub refs/files, сравнение старого docs checkpoint с существующей заготовкой, чтение источников обязательных правил и текущих target docs, запись согласованных документов через GitHub. Проверки этой задачи относятся к документации и её связи с фактическим деревом.

**Не выполнялись:** npm install, запуск inventory/tests, typecheck, lint, build, parity/extraction tests, Android/Java oracle, browser launch/attach/automation, ручной visual/audio тест. Результаты прежних запусков не исследованы и не приписываются этой сессии. Проценты готовности не рассчитаны.

Исходные `src/`, `assets/`, `res/`, AndroidManifest/LICENSE, существующие tools/runtime/tests/config/workflows и generated JSON этой задачей не изменялись. Никаких утверждений, что новые правила уже enforced существующими tests, нет.

## 4. Открытые области

| ID | Область | Факт / следующий шаг |
| --- | --- | --- |
| B01 | PD-classes | Candidate закреплён; build/runtime compatibility требует независимого evidence P00.3/P00.4 |
| B02 | RNG/Java semantics | Wrapper, casts и draw order требуют fixtures; одинаковый seed не предполагается |
| B03 | Turns | HashSet ties, float time и animation continuations требуют differential tests |
| B04 | Полнота | File-level inventory/source-map существуют; сверить поведение/контент/все UI states на P00.1/P00.2 |
| B05 | Toolchain | Versions объявлены; install/build/совместимость и lockfile evidence надо проверить на P01 |
| B06 | Visual/runtime evidence | Полноценная browser проверка остаётся ручной; отсутствующее evidence — NOT_VERIFIED |
| B07 | Saves/platform | Bundle/import/aliases/полная platform mapping ещё требуют обследования и tests |
| B08 | Новые rules vs scaffold | P01-RULES: browser scripts, global declarations, shader/JSON/owner boundaries и policy tests привести к новой редакции |
| B09 | Legacy audit metadata | Readiness-поля старого source-baseline.json — снимок первоначального аудита, не текущий прогресс; сверить с writer/readers на P00 без смены source identity |

Не заменять блокеры заглушками, не ослаблять checks и не запускать запрещённый browser. Блокируется только зависимая часть; независимая разрешённая работа продолжается.

## 5. Статусы этапов

| Область | Статус |
| --- | --- |
| Согласованный план и обязательный контекст | WRITTEN; это не implementation |
| P00 | IN_PROGRESS: inventory/source-map уже есть; полнота/evidence требуют проверки |
| P01 | IN_PROGRESS: scaffold есть; integration/rule compliance не подтверждены |
| P01-RULES | TODO: документация не заменяет исправления code/config и gates |
| P02–P10 | Завершение не подтверждено; не назначать VERIFIED по наличию начального grid module |
| Полный порт | NOT_COMPLETE |
| Полный игровой/визуальный паритет | NOT_VERIFIED |

## 6. Следующий конкретный шаг

После отдельного поручения продолжить реализацию: сверить существующие P00.1/P00.2, дополнить четыре реестра и evidence; затем P01-RULES и независимая подготовка oracle P00.3–P00.6. Не создавать inventory/web заново. Не переходить к массовому контенту раньше согласованных контрактов и точного ядра.

Browser smoke/visual/input/audio сценарии подготавливает агент, выполняет человек. Полученное evidence указывает source/build revision и воспроизводимые условия; пока его нет, соответствующий пункт открыт.

## 7. История контекста

Первичный этап от 2026-09-26 создал восемь файлов контекста в commit `6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60`, закрепил оригинал `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f` и candidate PD-classes. Тогда web/source-map ещё не были созданы. Это историческое состояние, не текущий итог main.

Сохраняемые source facts: Pixel Dungeon 1.9.1/74, grid 32×32, Java float scheduler/HashSet, sprite/next continuation, Java Math.random wrapper и local-hour nightMode. Эти наблюдения не доказывают полного oracle/parity. Исходная идентичность не менялась.

## Шаблон дальнейшего отчёта

```text
Дата / рабочий commit:
ID задачи PLAN / owner:
Реально изменённые файлы и поведение:
Source / reference fixture / provenance:
Команда проверки -> фактический результат (или NOT_RUN + причина):
Ручное browser evidence -> источник/commit/условия (или NOT_VERIFIED):
Статус паритета и policy compliance:
Открытые расхождения/блокеры:
Следующий конкретный шаг:
```
