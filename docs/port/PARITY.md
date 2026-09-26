# Проверка переноса 1:1

Обновлено 2026-09-26. Это требования к доказательствам, не отчёт о пройденных tests/oracle. Фактическая готовность — [STATUS](STATUS.md); обязательный способ работы — [MANDATORY_RULES](MANDATORY_RULES.md).

## 0. Кто выполняет проверки

**Агент не запускает, не подключает и не автоматизирует браузер**: Chrome/Edge/Chromium, CDP, Playwright/Puppeteer и любые browser-starting scripts/workflows запрещены (CORE, PD-R20). Существующий `test:e2e` не является исключением.

Агент выполняет разрешённые Java/Node/headless tests, typecheck/build, source inventory/hash checks, policy/import checks и offline comparison уже предоставленных артефактов. Человек выполняет реальную browser/input/visual/audio приёмку. Отчёт привязан к commit/build, runtime/OS, viewport/DPR, настройкам, командам и времени воспроизведения.

Отсутствие ручного evidence не отменяет соответствующую проверку и не превращает её в PASS: область остаётся **NOT_VERIFIED**. Можно продолжать независимые задачи, но нельзя заявлять полный 1:1 по успешной компиляции или headless тесту presenter.

## 1. Что должно совпасть

**Правила:** порядок/стоимость ходов, движение/автодвижение, ожидание/поиск, атаки/промахи, защита/урон, смерть/возрождение, голод, эффекты, AI, drop/identification/equipment, улучшения/деградация там, где они есть в источнике, traps/plants/blobs, магазины/NPC/quests, достижения и завершения.

**Контент:** все исходные HeroClass/разновидности существ/боссов, этажи/генераторы/комнаты, предметы/их свойства, эффекты, окна/состояния, тексты, звук и изображения. Полный список определяется исходниками, не памятью о Pixel Dungeon. Редкие ветки учитываются отдельно; прохождение основного пути не доказывает полноту.

**Представление:** frames, размеры тайлов, цвет/alpha, порядок слоёв, camera/fog, рамки/controls, метрики текста, кадры/длительности анимаций, условия звука. Не заменять UI готовым современным стилем rex. Project shader policy не разрешает поменять исходные pixels.

**Состояние:** все significant run/profile/floor data, save/load, переходы и новая игра, чистые subscriptions/lifecycle. Phaser objects, handles и XState runtime instances не сохраняются как модель игры.

1:1 — совпадение наблюдаемого результата в определённых входных условиях, не совпадение Java-структуры и не сравнение разных экранов/моментов.

## 2. Независимый оригинал

Зафиксировать commit игры и PD-classes, способ сборки, Java/Android runtime, параметры, viewport/масштаб/locale, clock и ввод. Доказать совместимый original run либо Java-harness в заявленной области. Instrumentation хранить отдельно от baseline и не менять правила.

Fixture содержит provenance, initial state, commands, random draws/order и остальные внешние входы, expected checkpoints/events, при необходимости screenshot/audio timeline. Expected создаётся оригиналом. Небольшой аналитический unit expected допустим с точным объяснением, но не заменяет independent oracle для всей механики.

Нельзя получать expected тестируемой TS-функцией и считать совпадение доказанным. Fixture update требует причины и diff; автоматическое accept-all snapshots запрещено. Нормализация для сравнения допустима только для заранее объявленных несущественных внешних полей: нельзя сортировкой/округлением скрывать влияющий на игру порядок или числа.

## 3. RNG: draw trace прежде обещания общего seed

Исследованный `PD-classes/com/watabou/utils/Random.java` использует Java Math.random, float/int casts и собственные Int/IntRange/shuffle/chances. Wrapper не задаёт переносимого seed-контракта. JS Math.random с тем же названием не доказывает эквивалентность.

Ввести узкий источник draws и совместимые исходные операции. В независимом Java-harness записывать/контролируемо подавать исходные draws, не меняя места вызовов. TS воспроизводит ту же последовательность; сравниваются количество, порядок, потребители и результат. PRNG/экспорт его состояния проверять отдельно только после установления исходной платформы/алгоритма.

Проверить exclusive/inclusive bounds, float casts, нулевые/граничные веса, порядок суммирования, пустые коллекции, shuffle, NormalIntRange и исходное поведение ошибок. Не подменять их привычным «исправленным» алгоритмом.

Аудировать random calls в sprites/effects: если они потребляют общий поток, разделение gameplay/cosmetic изменит результат. Сохранить consumption/order через адаптер либо доказать независимость прежде разделения. Headless replay учитывает draws presentation. Потенциальная frame-dependency оригинала записывается вместе с presentation schedule; её нельзя скрыть удобным новым RNG.

## 4. Java ↔ JavaScript и клеточные алгоритмы

Проверять существенные места: int division truncation к нулю (не Math.floor для отрицательных), Java cast, signed 32-bit arithmetic/shifts, float32-rounding каждой влияющей операции/присваивания (не один fround в конце), float/double, порядок суммирования, special values и сравнения. `Float.MIN_VALUE/MAX_VALUE` не заменять `Number.MIN_VALUE/MAX_VALUE`. Проверить enum/IDs/strings/serialization и порядок коллекций.

В Actor исходный HashSet и выбор первого минимального time могут влиять на ties. JS Set insertion order не является доказанной заменой. Записать выбор исходного runtime, исследовать стабильность; для непредсказуемого между запусками порядка честно определить область паритета. Не вводить новый tie-breaker молча и не обещать универсальную bit-exact повторяемость.

Порядок соседей Level, углы/диагонали, стены/двери/опасности, занятые клетки и flee/seek проверяются отдельно. Одинаковая длина не означает одинаковый путь. Не менять PathFinder/ShadowCaster/Ballistica на A*/BFS/navmesh/готовый plugin без проверки всей наблюдаемой семантики.

## 5. Время и callback-фазы

Логическое время принадлежит turns. Проверить partial action costs, speeds, actor add/remove, buffs/blobs и ties. Не вводить real-time simulation/catch-up из PSX/CORE вместо исходной очереди.

Actor.process() ждёт движущийся sprite, а `next()` продолжает очередь. У каждого действия сопоставить mutation phases и callbacks. Renderer подтверждает continuation ID, а не вычисляет правило. Headless playback воспроизводит тот же порядок. Тестировать двойные/поздние ack, scene interruption, restart, новый run и отсутствие зависшего хода; stale callbacks не мутируют новое состояние.

Dungeon.switchLevel() вычисляет nightMode по локальному часу. ClockPort/fixture задаёт час, включая границу 07:00; нельзя просто удалить внешнюю зависимость ради детерминизма.

Ручное сравнение браузера при 30/60/144 FPS, throttling/background/resume выполняется при одинаковых внешних входах и recorded schedule, где он значим. Агент может анализировать присланный trace, но не запускать capture. Новых ходов из-за browser frame timing быть не должно; исходные обнаруженные связи документируются.

## 6. Матрица проверок

| Область | Обязательные случаи |
| --- | --- |
| Random/числа | Recorded draws, bounds, float32, weights, shuffle, consumption |
| Turns | Несколько speeds, ties, postpone, removal, buffs, death, continuations |
| Grid | 32×32 boundaries, diagonals/corners, doors, occupied cells, flee/seek |
| FOV/Ballistica | Стены/углы/двери, свет/темнота, исходные правила видимости, path/stop |
| Generation | Каждый generator/room, несколько traces, required placements, stairs/traps/heaps |
| Combat/AI | Отличающиеся attack/defence/AI ветки, resistance, death side effects, boss phases |
| Items/effects | Каждый вид, identification/stack/equip/use/drop/throw, сочетания/expiry |
| Run/profile | NPC/quests/trade, endings, badges/rankings, переходы/новая игра |
| Save | Все виды/state, stable references, round trip, floor switch, corruption, явно поддержанные imports |
| UI/input | Каждое окно/control state, cancel/targeting, inventory, journal/settings/messages/input locking |
| Lifecycle | Menu/restart/reload/new run, pause/resume, cleanup, stale async |

P00 дополняет матрицу по source-map. File-level inventory не равен behavioral coverage. Проверки state/commands автоматизируются без браузера; actual presentation/input/audio — ручная evidence, не исключение из матрицы.

## 7. Графика, shaders, текст, звук

Для каждого исходного изображения сохранить source hash, dimensions/alpha и frame definitions. Любая atlas/font conversion — воспроизводимый tool и mapping; не менять вручную pixels/пропорции. Исходное logical resolution/layout/scaling извлекаются из кода, не угадываются.

Один Phaser WebGL canvas. Non-UI использует project shader path; исходники project stages — отдельные owner-local GLSL, без host-string generation. UI через rex/Phaser. Общий shader может обслуживать исходные sprites; политика не требует нового арта или shader на каждый предмет. Статические tests должны запрещать inline GLSL/второй renderer/Canvas fallback; они не доказывают реальный GPU-output.

Человек снимает кадры на фиксированных viewport/DPR/camera/locale/draws/presentation time. Offline comparison агентом разрешено. Статические pixel-art области должны совпадать точно; специфический GPU/растризационный tolerance разрешается только после локального обоснования/решения. Нельзя широким threshold скрыть другой шрифт, crop или сдвиг окна.

Анимации: frame sequence, старт, duration, callback-фаза и порядок. Звук: исходный asset, trigger/loop/volume/pitch. Browser autoplay unlock — явная платформа, не причина удалить звук/поменять музыку. Sample-identical вывод разных устройств не обещается; сравниваются контролируемые параметры и ручное воспроизведение.

Тексты извлекаются в stable locale keys без перефразирования/новых языков в рамках 1:1. Тесты semantics/provenance/asset equality не должны превращаться в запрещённый validator/normalizer авторского JSON.

## 8. Сохранения и платформенные границы

Исследовать исходные Bundle/class aliases/split game-depth files и все fields. Browser physical storage может отличаться при сохранении наблюдаемого поведения. Stable persisted IDs вместо минифицированных constructor names/handles. Внешний save envelope может иметь версию; это не версия внутреннего repository JSON shape.

Новый slot и existing restore — разные операции. Missing required fields/corruption не лечатся hidden defaults, reset или silent fallback. Оригинальная numeric/serialization compatibility разрешена, поскольку без неё не выполнить порт; поддержанные преобразования выполняются в одном явном persistence boundary с fixtures, не в параллельных legacy readers.

Импорт существующих Java saves — отдельная проверяемая задача P00/P09. Пока не исследован/не реализован — UNKNOWN/UNSUPPORTED. До финальной приёмки реализовать нужные варианты либо записать явное решение о границе, не исключать молча.

Android intents/back/orientation/vibration/filesystem/focus/resume/audio unlock — platform mapping. Замены ввода/хранилища оформлять адаптерами; изменение доступной функции/поведения требует решения. Существенный открытый разрыв не совместим с заявлением полного 1:1. Асинхронная запись на unload не считается доказанно завершённой.

## 9. Готовность и evidence

**VERIFIED части:** все относящиеся source branches найдены, поведение реализовано, independent fixtures пройдены, необходимое ручное presentation evidence получено, значимых открытых расхождений нет, mapping/docs актуальны. Чистая доменная часть может быть VERIFIED по своим headless fixtures; это не распространяется автоматически на её UI.

**Полный перенос:** полный source/content/UI реестр закрыт VERIFIED либо явно согласованными platform exclusions; все классы/этажи/боссы/предметы/окна проверены; основные и редкие сценарии пройдены; saves/cleanup подтверждены; typecheck/build/architecture/extraction gates проходят; необходимые ручные browser проверки выполнены; лицензии/исходники/границы поставки указаны.

До этого: «частичный порт» или «реализовано, паритет не проверен». Зелёный build, первый этаж, наличие test files и высокий line coverage не означают 1:1. Отсутствующая ручная проверка явно остаётся открытой; запрет браузерной автоматизации не превращается в исключение из качества.
