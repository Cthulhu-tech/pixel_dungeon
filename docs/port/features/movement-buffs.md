# P02/P03/P05/P06 — движение, двери и базовый lifecycle Buff

Дата: 2026-09-26. Детализация единого PLAN; не отдельная очередь.
Исходный checkpoint: 72aa779af97b012badc17a396fceabaed9f6c97c.
Code commit: cb79abd7cba228b96bff16ed5ff61a27a9337f64.
Baseline игры: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.

## Соответствие исходнику

| Source | Symbols / target |
| --- | --- |
| actors/Char.java, blob65bb59224b2574caa7939cc030d65ad68e31a9fd | move/distance → actors/CharacterMovement |
| levels/Level.java, blobc92488406814f6fb270c77799213200b8a72decb | adjacent/distance/NEIGHBOURS8 → grid/geometry; reused by GridNavigation |
| levels/features/Door.java, blob5afc45e71ba1f2b7722e2cd02b12e2cc18e1cd5e | enter/leave → grid/GridDoors |
| actors/buffs/Buff.java, blob3d481d04c2ae5e5ddd45c920c56ba1afefffaef4 | attachTo/detach/act + append/affect/prolong/detach helpers → effects/Buff + BuffOperations |
| actors/buffs/FlavourBuff.java, blobd653eb17a57b9aa6ad8ab844097e0db9e4770140 | act → effects/FlavourBuff |

## Сохранённое поведение

CharacterMovement — единственный владелец своей canonical position. Базовый Char.move не
валидирует обычный шаг, не списывает время, не вызывает next и не обновляет Actor.chars.
Не путать его с полным Hero.move/handle и операцией игрока. Vertigo проверяется только при
исходной flattened adjacency; порядок случайного соседа, short-circuit flags и ранний return
сохранены. Door.leave наблюдает старую позицию, enter — новую; heap не даёт закрыть дверь.
Видимость NPC применяется после дверей, герой не получает эту запись sprite.visible.
Occupancy обновляется в исходной фазе scheduler, не новым eager update внутри Char.move.

GridDoors не владеет картой: set/updateMap/observe/visible/audio проходят явные порты.
Звук enter проверяет видимость ПОСЛЕ observe. Частичные изменения перед ошибкой внешнего
порта не откатываются новым способом. Полный Level.set/FOV не заменён test-only портами.
GridNavigation использует общий gridAdjacent; прежние 5776 navigation cases повторно прошли.

Buff owns target, target owner owns membership, TurnScheduler owns time. Base act deactivates;
FlavourBuff expires by detaching. Retarget/rejected attach/repeated detach retain source
semantics. Append ignores immunity rejection; affect reuses first matching buff; spend adds,
prolong postpones. Original append's caught Exception becomes an explicitly reported null,
while fatal errors propagate; duration helpers preserve their null-dereference outcome.
No silent generic fallback, global store, framework import or independent timer was added.

## Реальный CI из полного checkout — прочитан после завершения

Run: 36225450263, workflow Port verification (no browser), head cb79abd7cba228b96bff16ed5ff61a27a9337f64.
Kernel job108358475470: SUCCESS. Node22.16.0/npm10.9.2/Temurin javac21.0.12.1.

| Команда / проверка | Подтверждённый результат |
| --- | --- |
| npm run test:kernel | 90/90 PASS, 0 failed, 0 skipped; прежнее ядро и новые проверки |
| movement-source.test.mjs | PASS: hashes полных Char/Level/Door и executable tokens шести выбранных методов |
| movement.test.mjs | 6/6 PASS, 1702 selected-Java comparisons |
| buffs.test.mjs | 6/6 PASS, 504 sequences /4032 original-Java checkpoints |
| movement-buffs-turns.test.mjs | 4/4 PASS с настоящим TurnScheduler |
| npm run test:contracts | 30/30 PASS, 0 skipped; пересекается с test:kernel |
| contract-entrypoint regression | 1/1 PASS |
| registry audit fixtures | 5/5 PASS; не доказательство runtime-совместимости |

Интеграции подтвердили: position меняется без неявного spend/next; occupancy сохраняется до
исходного rebuild; Vertigo использует реальное occupancy; expiry удаляет buff из scheduler,
base buff деактивируется; append/affect/prolong работают через существующее actor time.
Нельзя складывать 90 и 30 как число уникальных тестов; cases/checkpoints не процент готовности.

Dependency job108358475302: FAILURE в общем приложении, но независимые scopes SUCCESS.
Установлено46 packages без install scripts/browser; actual compiler TypeScript6.0.3.
Успешны typecheck:character, check:extraction:character, typecheck:movement, typecheck:effects,
typecheck:kernel, check:extraction:movement, check:extraction:effects, check:extraction:kernel.
Character extraction также проверил negative control без owner declarations. Movement scope
проверяет перечисленные position/geometry/door файлы, не всё приложение; kernel extraction
отдельно проверяет compatibility/grid/turns. DOM/Phaser и посторонние globals не подключались.

Затем npm run build завершился exit2 в tsc: прежние Phaser TS2526/TS2416, rex missing
BitmapMask/WebGLPipeline/Pipelines/Mesh/imports/NameInputDialog и XState StateSchema с
exactOptionalPropertyTypes. Vite build и последующий общий boundary gate не выполнялись.
Никакие skipLibCheck, any, fake typings, downgrade или отключение strict не добавлены.
Canonical lockfile отсутствует; npm install не выдаётся за воспроизводимый npm ci.

## Независимость эталона и локальные прогоны

MovementReference содержит шесть выбранных методов, не весь Char/Level/Door runtime.
Соседние объекты задают входы, random index и observe/failure hooks. Они не являются
production Hero/Mob/Level. Committed reference blob4a3d31008c400ae4af78739abfb5ef0f633c973e
и BuffOracle blobe980c70e29abfd34854e7177a07bd3c2e5f61002 проверены чтением после записи.
Buff oracle компилирует ПОЛНЫЕ неизменённые Buff.java/FlavourBuff.java из src/ с hash gates;
Actor/Char/UI — явные test-only ports. Expected не вычисляются TS-реализацией; icon исключён.

Локально до CI: movement.test6/6, buffs.test6/6 и scoped tsc movement/effects PASS на
Node22.16.0/npm10.9.2/JDK21.0.11/available TS5.8.3. Использован восстановленный subset,
не полный clone: прямой git DNS недоступен. Полный source-token test, scheduler integration
и установленный TS6 подтверждены именно CI, а не приписаны локальному subset.

## Команды и остатки

npm run test:parity:movement; npm run test:parity:buffs;
node --experimental-strip-types --test tests/contracts/movement-buffs-turns.test.mjs;
npm run typecheck:movement; npm run typecheck:effects;
npm run check:extraction:movement; npm run check:extraction:effects.

Не готово: Char buff collection/add/remove/updateSpriteState, конкретные эффекты и Hero/Mob
movement overrides, реальные уровни/ввод/анимации, production error-class mapping/factories,
save codecs и Android HashSet order. Source-map aggregation остаётся P00.2; целые
Char/Level/Buff/P03/P06 НЕ объявлены VERIFIED. Browser acceptance остаётся ручной и отсутствует.
