# P02/P03/P05/P06 — движение, двери и базовый lifecycle Buff

Дата: 2026-09-26. Детализация единого PLAN; не отдельная очередь.
Исходный checkpoint работы: 72aa779af97b012badc17a396fceabaed9f6c97c.
Baseline игры: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.

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
исходной flattened adjacency; random neighbour order, short-circuit flags и ранний return
сохранены. Door.leave наблюдает старую позицию, enter — новую; heap не даёт закрыть дверь.
Видимость NPC применяется после дверей, герой не получает эту запись sprite.visible.
Дальнейшее согласование occupancy выполняется в исходной фазе, не придуманным eager update.

GridDoors не владеет картой: set/updateMap/observe/visible/audio проходят явные порты.
Звук enter проверяет видимость ПОСЛЕ observe. Частичные изменения перед ошибкой внешнего
порта не откатываются новым способом. Полный Level.set/FOV не заменён test-only портами.

Buff owns target, target owner owns membership, TurnScheduler owns time. Base act deactivates;
FlavourBuff expires by detaching. Retarget/rejected attach/repeated detach retain source
semantics. Append ignores immunity rejection; affect reuses first matching buff; spend adds,
prolong postpones. Source append's caught Exception becomes an explicitly reported null,
while fatal errors propagate; duration helpers preserve their null-dereference outcome.
No silent generic fallback, global store, framework import or independent timer was added.

## Проверки и границы

- Movement reference содержит шесть выбранных методов, а не весь Char/Level/Door runtime.
  Source-token test сверяет их с hash-pinned original files из полного checkout.
- Локально movement.test: 6/6 PASS, 1702 Java comparisons (включая geometry и error phases).
- Buff oracle компилирует ПОЛНЫЕ неизменённые Buff.java/FlavourBuff.java из src/; оба blob
  локально совпадают. Tests: 6/6 PASS, 504 sequences /4032 ordered checkpoints. Icon исключён.
- Локальные scoped typecheck movement/effects: PASS на доступном TS5.8.3; Node22.16.0,
  npm10.9.2, JDK21.0.11. Это восстановленный subset, не полный clone (git DNS unavailable).
- Новые movement-source и movement-buffs-turns integration tests, extraction и installed
  TS6 проверяются CI. До чтения фактических jobs их результат NOT_VERIFIED.

Команды: npm run test:parity:movement; npm run test:parity:buffs;
node --experimental-strip-types --test tests/contracts/movement-buffs-turns.test.mjs;
npm run typecheck:movement; npm run typecheck:effects;
npm run check:extraction:movement; npm run check:extraction:effects.
Общий test:kernel включает новые и прежние tests; test:contracts частично пересекается с ним.

Не готово: полный Char buff collection/appearance, конкретные эффекты и Hero/Mob overrides,
реальные уровни/ввод/анимации, production error-class mapping/factories, save codecs и
Android HashSet order. Source-map aggregation остаётся P00.2; целый Char/Level/Buff/P03/P06
НЕ объявлены VERIFIED. Браузер не запускается. Общий app compiler blocker — отдельный P01.1.
