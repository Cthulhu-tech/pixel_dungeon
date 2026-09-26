# Архитектура браузерного порта

Обновлено 2026-09-26: правила PSX/CORE и уточнение владельца производного Actor occupancy index.
Это целевая архитектура, не отчёт о полном внедрении. Обязательны [MANDATORY_RULES](MANDATORY_RULES.md),
актуальный [STATUS](STATUS.md) и единый [PLAN](PLAN.md).

## 1. DDD без лишней инфраструктуры

Модульный монолит с тремя предметными границами:

- **run/gameplay** — текущее прохождение и его правила. Очередь, grid, бой, items/effects и AI — внутренние переносимые модули, не микросервисы.
- **profile** — постоянный прогресс, настройки, достижения/результаты. Получает результаты run через публичные контракты, не управляет боем.
- **application/presentation** — flow, ввод, сцены/окна, воспроизведение и звук. Не определяет игровых правил.

Один Java-класс не обязан становиться модулем; модули не обязаны повторять Java-packages.
Разделение определяется ответственностью, данными и инвариантами. Shared layer нужен только
для реально общих чистых зависимостей, не свалки GameState.

## 2. Структура

```text
src/                         # исходная Java-игра, не изменять
assets/                      # исходные bytes, не изменять
res/                         # исходные Android-ресурсы, не изменять
web/
  src/
    main.ts                  # application entry
    app/
      bootstrap.ts           # composition root
      run-coordinator.ts     # порядок межмодульных операций
      flows/                 # XState orchestration
    types/
      contracts/             # минимальные общие ambient *.d.ts
      turns/
      grid/
      ...                    # owner-scoped, не global types dump
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
        shaders/             # physical *.glsl
        assets/              # owner-local visual definitions/manifests
      rex-ui/
      zustand/
      persistence/
  tests/
    unit/
    contracts/
    parity/                  # independent Java/headless comparisons
    architecture/
    manual/                  # human browser scenarios/evidence
  tools/                     # scoped typecheck/extraction/policy tools
  package.json
  tsconfig.json
  vite.config.mjs
tools/port/                  # inventory/oracle/source audit
tests/reference/             # intentional canonical reference artifacts
tmp/                         # root scratch, ignored
```

Каталоги создаются только с нужным содержимым. Внутри модуля index.ts, README и при
необходимости domain/application/ports/assets. Новые общие content/config/assets свалки
запрещены. Корневые source assets не перемещаются; owner-local manifests разрешают stable
IDs в physical source. Inventory/source-map — аудит, не runtime data owners.

## 3. Владение состоянием

| Состояние/правило | Владелец | Публичная граница |
| --- | --- | --- |
| Queue, scheduled time, current actor, continuation | turns | Команды/снимок очереди |
| Производный Actor.chars lookup, ID index | turns | findChar/findById; исходные фазы обновления |
| Terrain, explored/mapped, геометрия/FOV/path queries | grid | Cell IDs, запросы, readonly DTO |
| HP, характеристики, canonical position, AI state | actors | Actor IDs, entity commands/snapshots |
| Формулы/последовательность атаки | combat | Результаты и операции через порты владельцев |
| Items/stacks/inventory/equipment/identification | items | Stable Item IDs, commands/snapshots |
| Поля/срок жизни эффектов | effects | Modifiers/effect contracts |
| Задания/связанные диалоги | quests | Quest commands/snapshots |
| Этаж, золото, общие счётчики | run | Run commands/snapshots |
| Настройки/достижения/результаты | profile | Profile commands/snapshots |
| Boot/menu/loading/targeting/input flow | XState | Orchestration events/state |
| Derived HUD/hover/scroll/открытая вкладка | Zustand vanilla | UI read model |
| Display transforms/tween/sprite/audio handles | Phaser/rex | Derived presentation |

**Уточнение по прочитанному Actor.java:** canonical position остаётся actors, но исходный
chars[] — производный индекс очереди. TurnScheduler обновляет его в process/add/occupyCell/
freeCell; grid получает occupancy через query port и не заводит второй такой индекс.
Публичное перемещение координирует изменения в исходных фазах. Нельзя автоматически
«исправлять» stale lookup новым пересчётом при каждом запросе: это может менять исходник.
Причина и evidence — [features/turns.md](features/turns.md).

Расход предмета/урон/смерть не распределяются по независимым UI listeners. Согласованные
application-операции публикуют результаты в исходном порядке, не произвольное полусостояние.
Изменение естественного владельца документируется; не создаётся вторая копия. XState/Zustand
не являются вторыми картой/героем, save snapshots — не второй live source.

## 4. Public API, DI и ambient types

Runtime значения пересекают границу через index.ts. Composition/application зависят от
публичных API, adapters — от портов/DTO, module application — от своего domain/consumer ports.
Домен не зависит от framework/browser/adapter. Deep imports и циклы запрещены.

Собственные type/interface/type-only contracts только в web/src/types/<owner>/*.d.ts,
без type imports/exports/re-exports. Имена owner-однозначные, например PDGridQuery, не State.
Runtime entrypoints экспортируют значения/классы/фабрики. Старый src/contracts/*.ts для
типов не является целевым layout.

Globals не разрешают чужое состояние или скрытые type dependencies. README перечисляет
нужные declarations; isolated compilation включает только их и реальные чистые зависимости.
Проверка должна поймать связь, которую обычный tsc со всеми globals мог бы скрыть.

DI — конструкторы/фабрики в bootstrap, не service locator или ненужный DI framework.
Coordinator соединяет consumer ports без циклов. Критический порядок операций задаётся явно;
typed local events сообщают факты, не заменяют порядок случайной очередностью listeners.

## 5. Команда → правило → представление

```text
input/rex -> semantic command -> application coordinator
          -> turns + операции владельцев
          -> ordered results/events/presentation requests
          -> UI projection + Phaser playback
```

Правило определяет допустимость/цену; UI показывает и отправляет запрос. Недоверенные
commands/save/import проверяются на границе. Trusted authored JSON не проходит дополнительную
schema-validation/normalization/default injection; runtime state отдельно. Parity проверяет
смысл против оригинала, не вводит новый content validator.

XState не подменяет Actor.time/combat и не обязан создавать actor на каждого monster.
Zustand vanilla — адаптер UI projections, публичны read/subscribe, не gameplay setState.
Derived revisions — runtime metadata; постоянные preferences принадлежат profile.

## 6. Animation continuations и порядок коллекций

Actor.process проверяет sprite.isMoving, Actor.next продолжает обработку. Нельзя заранее
рассчитать всё действие и лишь потом проиграть картинку. Continuation содержит action ID,
run/level generation и ожидаемое завершение; domain/application определяет фазу мутации,
renderer подтверждает запрос. Повторные/устаревшие acknowledgments отвергаются. Restart/dispose
очищает pending work. Raw TurnScheduler.next — domain API, не незащищённый renderer callback.

Commit урона/расхода определяется исходным callback path. Headless playback воспроизводит
тот же порядок. Новые frame dependencies запрещены; исходная связь RNG/visual schedule
исследуется отдельно, а не скрывается разделением потоков наугад.

PDTurnMembership передаёт порядок обхода как явную зависимость. В scheduler oracle он
контролируется LinkedHashSet через reflection; это не доказательство Android HashSet parity.
Production collection-order adapter и полная actor integration остаются открытыми.

## 7. Rendering, ресурсы и lifecycle

Один Phaser4 WebGL canvas/runtime, rex UI внутри. Non-UI графика использует project shader
path, UI освобождён только от собственного dedicated shader. Все свои stages — owner-local
.glsl, без генерации/конкатенации source в host. Original textures/pixels сохраняются.
Нет React/DOM UI, второго renderer/canvas fallback или независимого loop.

Импорт не создаёт ресурсы/подписки/flows. Application и run scopes разделены. Init идёт
providers first, teardown consumers first; dispose идемпотентен. Partial startup rollback
освобождает достигнутые стадии. Requests дедуплицированы; generations отклоняют stale results.
Shared resources не уничтожаются первым закрывшимся потребителем.

Агент проверяет lifecycle безбраузерными контрактами/build, не запускает браузер. Реальное
renderer/input/audio поведение требует human evidence. Это ограничение агента, не игры.

## 8. Извлечение и качество

Модуль имеет public runtime entrypoint, README/licenses, dependencies, owner types и
нужные assets/fixtures/tests. Нет скрытых scene/store/process.env/application paths.
Минимальный host копирует только модуль и его реальные чистые зависимости, не всё приложение.
Общий tools/module-extraction.mjs выполняет один механизм; wrappers явно задают владельцев.
Standalone turns extraction включает только turns, kernel — compatibility/grid/turns.

Dispose нужен для реальных ресурсов, не фиктивно для чистого алгоритма. Readonly snapshots
не требуют defensive freezing/cloning authored JSON. SOLID/KISS/DRY/OOP/DDD не требуют
класса на число или интерфейса на функцию. Entity защищает инварианты, различающиеся исходные
эффекты не сливаются ради DRY. Нет god managers/components, universal effect DSL и будущих абстракций.

P01-RULES проверяет imports/cycles, ownership, ambient types, no type imports/inline GLSL,
authored content validators/browser automation/import-time effects. Extraction дополняет
graph check. Наличие старого check-boundaries не доказывает enforcement всех новых правил.
