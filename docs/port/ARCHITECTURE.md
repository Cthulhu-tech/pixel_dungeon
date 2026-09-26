# Архитектура браузерного порта

Обновлено 2026-09-26 после переноса правил PSX/CORE. Это целевая архитектура, не отчёт о её полном внедрении. Обязательные ограничения и provenance — [MANDATORY_RULES.md](MANDATORY_RULES.md); работа с существующей заготовкой — P01-RULES в [PLAN](PLAN.md).

## 1. DDD без лишней инфраструктуры

Модульный монолит с тремя предметными границами:

- **run/gameplay** — текущее прохождение и его правила. Очередь, grid, бой, items/effects и AI — внутренние переносимые модули, не искусственные микросервисы.
- **profile** — постоянный прогресс, настройки, достижения/результаты. Получает результаты run через публичные контракты, не управляет боем.
- **application/presentation** — flow, ввод, сцены/окна, визуальное воспроизведение и звук. Не определяет игровых правил.

Один Java-класс не обязан становиться отдельным модулем; один модуль не обязан повторять Java-package. Разделение определяется ответственностью, данными и инвариантами. Новый shared layer допустим только для реально общих чистых зависимостей, не как свалка GameState.

## 2. Целевая структура

```text
src/                         # исходная Java-игра: не изменять
assets/                      # исходные bytes: не изменять
res/                         # исходные Android-ресурсы: не изменять
web/
  src/
    main.ts                  # единственный application entry
    app/
      bootstrap.ts           # composition root
      run-coordinator.ts     # согласованный порядок межмодульных операций
      flows/                 # XState orchestration
    types/
      contracts/             # минимальные общие ambient *.d.ts
      turns/                 # declarations владельца
      grid/
      ...                    # остальные владельцы, не единый globals dump
    modules/
      compatibility/
      turns/
      grid/
      generation/
      actors/
      combat/
      items/
      effects/
      quests/
      run/
      profile/
    adapters/
      phaser/
        shaders/             # физические *.glsl
        assets/              # owner-local visual definitions/manifests
      rex-ui/
      zustand/
      persistence/
  tests/
    unit/
    contracts/
    parity/                  # безбраузерное сравнение с независимым oracle
    architecture/
    manual/                  # сценарии и provenance ручной browser-приёмки
  package.json
  tsconfig.json
  vite.config.mjs             # существующий файл; переименование не самоцель
tools/port/                  # inventory/oracle/сверка исходников
tests/reference/             # канонические эталоны с provenance
 tmp/                        # фактически root tmp/, временное, Git ignored
```

В схеме `tmp/` находится в корне репозитория (пробел перед ним не часть имени). Каталоги создаются только с нужным кодом/данными. Внутри модуля: `index.ts`, README, при необходимости `domain/`, `application/`, `ports/`, `assets/`. Новые общие `src/content`/`config`/`assets` свалки запрещены. Исходный корневой assets не перемещается: physical source может оставаться общим, owner-local manifests связывают его со стабильными IDs. Inventory/source-map — документы аудита, не runtime owners.

## 3. Владение состоянием

| Состояние/правило | Владелец | Публичная граница |
| --- | --- | --- |
| Queue, scheduled time, current actor, continuation | turns | Команды/снимок очереди |
| Terrain, occupancy index, explored/mapped, геометрия | grid | Cell IDs, запросы, readonly DTO |
| HP, характеристики, canonical position, AI state | actors | Actor IDs, entity commands/snapshots |
| Формулы и последовательность разрешения атаки | combat | Результаты и операции через порты владельцев |
| Item instances, stacks, inventory/equipment, identification | items | Stable Item IDs, commands/snapshots |
| Поля и срок жизни эффектов | effects | Модификаторы и effect contracts |
| Статус заданий/связанных диалогов забега | quests | Quest commands/snapshots |
| Этаж, золото и общие счётчики прохождения | run | Run commands/snapshots |
| Постоянные настройки, достижения/результаты | profile | Profile commands/snapshots |
| Boot/menu/loading/targeting/input flow | XState | Orchestration state/events |
| Derived HUD data, hover/scroll/открытая вкладка | Zustand vanilla | UI read model |
| Display transforms, tween, sprite/audio handles | Phaser/rex | Derived presentation |

Позиция в actors — истина; occupancy grid — обслуживаемый индекс. Move — одна согласованная application-операция: проверка, изменение владельца и индекса, публикация целого результата. Нельзя отдавать наружу промежуточное полусостояние. Аналогично расход предмета/урон/смерть не распределяются по независимым UI listeners.

Обнаруженный аудитом естественный иной владелец уточняется документированным решением, а не добавлением второй копии данных. XState/Zustand не становятся вторыми картой/героем. Сохранения — checkpoints владельцев, не live source of truth.

## 4. Public API, DI и ambient types

Runtime значения пересекают границу только через `index.ts`. Dependencies направлены от composition/application к публичным API, от adapters к портам/DTO, от module application к своему domain и узким consumer ports. Домен не зависит от framework/browser/адаптера. Deep import соседа и циклы запрещены.

Собственные `type`/`interface`/type-only контракты объявляются **только** в `web/src/types/<owner>/*.d.ts`; типы не импортируются/не экспортируются/не re-export. Применяются глобальные owner-однозначные имена, например `PDGridQuery`, а не универсальные `State`/`Config`. Runtime entrypoints экспортируют классы/функции/значения, не type-only declarations. Старый вариант структуры `src/contracts/*.ts` для объявлений типов больше не является целевым.

Ambient declarations не дают права обращаться к чужому состоянию или полагаться на всю библиотеку global types. README перечисляет declaration dependencies; isolated compilation подключает лишь свой owner и явно нужные общие declarations. Проверка границ должна обнаруживать скрытую type dependency, даже когда обычный проектный tsc её не замечает.

DI — конструктор/фабрика в bootstrap; никаких service locator/DI framework без необходимости. При взаимных потребностях coordinator связывает consumer-owned порты, не создавая module cycle. Критический порядок операций явный; typed local events сообщают уже произошедшие факты и не заменяют определённую очередность случайным порядком subscribers.

## 5. Команда → правило → представление

```text
input/rex -> typed semantic command -> application coordinator
          -> turns + операции доменных владельцев
          -> ordered results/events/presentation requests
          -> UI projection + Phaser playback
```

Допустимость действия и его цену определяет владелец правила; UI лишь показывает доступность и отправляет запрос. Недоверенные команды/save/import проверяются у входной границы. **Доверенный authored JSON не проходит schema-validation/normalization/default injection**: исходные таблицы потребляются напрямую, runtime state хранится отдельно. Паритетные тесты сравнивают смысл с оригиналом, не добавляют новый content validator.

XState управляет сценариями приложения, но не подменяет Actor.time, не рассчитывает combat и не обязан создавать XState actor на каждого monster. Доменный Actor и actor XState — разные понятия.

Zustand `createStore` через `zustand/vanilla` — адаптер UI projections. Потребителю выдаются чтение/подписка, не публичный gameplay setState. Derived revisions допустимы как runtime metadata. Постоянные preferences принадлежат profile; локальное UI-состояние не дублирует их.

## 6. Оригинальные animation continuations

Actor.process() в исходнике проверяет `sprite.isMoving`; `Actor.next()` продолжает обработку. Нельзя автоматически считать всё действие заранее и потом воспроизводить картинку.

Continuation protocol содержит action/continuation ID, run/level generation и ожидаемое завершение. Domain/application решает фазу мутации и продолжение; renderer подтверждает уже запрошенное воспроизведение. Повторные/устаревшие подтверждения отвергаются без второго хода. При restart/dispose pending work очищается владельцем.

Commit урона/расхода предмета определяется исходным callback path, не удобством новой архитектуры. Headless playback даёт тот же порядок подтверждений без браузера. Цены действий/RNG/results не получают новых frame dependencies; связи RNG/визуального расписания, существующие в оригинале, исследуются по PARITY, не скрываются разделением потоков наугад.

## 7. Rendering, ресурсы и lifecycle

Один Phaser 4 WebGL runtime/canvas; rex UI внутри него. Вся non-UI графика использует project shader path, UI освобождён лишь от собственного dedicated shader. Свои shader stages — отдельные owner-local `.glsl`; host source не генерирует/не склеивает GLSL. Существующие оригинальные sprite textures сохраняются; shader policy не оправдывает новый стиль. Не добавлять React/DOM UI, второй renderer, canvas fallback или собственный loop.

Импорт не создаёт ресурсы/подписки/flows. Application scope и run scope разделены. Init — dependencies first; teardown — consumers first; dispose повторяем и безопасен. Startup rollback освобождает только достигнутые стадии. Resource requests дедуплицируются; generation guards не дают старому async result попасть в новый run. Общие ресурсы не уничтожаются первым закрывшимся потребителем.

Агент проверяет lifecycle контрактами и build, **не запускает браузер**. Реальное renderer/input/audio поведение требует ручного evidence. Политика не запрещает browser game для игрока; она ограничивает способы работы агента.

## 8. Контракт выноса модуля

Модуль готов к выносу, когда имеет public runtime entrypoint, README/лицензии, перечисленные dependencies, owner declarations, нужные assets/fixtures и тесты. Нет скрытых ссылок на scene/store/process.env/application paths.

Контрольная проверка копирует в минимальный Node host только модуль, его `types/<owner>`, необходимые чистые contracts/dependencies и данные; запускает typecheck и domain tests без Phaser/DOM и общего application bootstrap. Копирование всего проекта ради зелёного теста не доказывает переносимость. На каждом этапе такую проверку проходит хотя бы затронутый самостоятельный модуль.

`dispose()` обязателен для реально приобретаемых ресурсов, не для чистого алгоритма ради шаблона. Структурное `readonly` state не требует defensive cloning/freezing авторского JSON.

## 9. Практика и автоматические ограничения

SOLID/KISS/DRY/OOP/DDD не требуют класса на каждое число и интерфейса на каждую функцию. Entity защищает инварианты; различающиеся исходные эффекты остаются различающимися. Нет Anemic GameManager со всеми mutations, god components, универсального effect DSL и абстракций на будущее.

P01-RULES должен проверить imports/cycles, single-owner boundaries, ambient declaration placement, отсутствие type imports/exports, inline GLSL, authored content validators, запрещённой browser automation и import-time side effects. Extraction test дополняет обычный import graph. Наличие прежнего `check-boundaries.mjs` не доказывает, что все эти новые политики уже enforced.
