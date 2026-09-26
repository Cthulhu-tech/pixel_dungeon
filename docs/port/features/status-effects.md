# P03/P05/P06 — конкретные статусные эффекты

Baseline: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f, actors/buffs/*.java.
Предыдущий checkpoint: f0d28682724eca00f14cec85e58bbf2d6a48bcee. Это часть единого PLAN.

## Что перенесено

16 конкретных классов: Cripple, Slow, Speed, Vertigo, Amok, Rage, Sleep, MindVision,
Awareness, Blindness, Light, Paralysis, Roots, Levitation, Invisibility, Shadows.
Исходные icon/title/duration извлечены в effects/assets/status-effects.json; значения
не нормализуются и не проходят content-schema pipeline. Types только owner-scoped .d.ts.

CharacterStatus — единственный владелец paralysed/rooted/flying/invisible/viewDistance.
Это исходные mutable flags, не значения, каждый раз заново вычисляемые из множества Buff.
Например, повторный detach Invisibility может сделать counter отрицательным; исходное
поведение сохранено, как и signed int overflow. Snapshot не является новым Char-save:
большая часть этих полей в исходнике восстанавливается прикреплением эффектов.

Paralysis снимает флаг только после удаления и отсутствия других Paralysis/Frost.
Roots проверяет полёт до базового attach; Levitation снимает только первые Roots.
Посадка сначала сбрасывает flying, затем вызывает press и только потом снимает buff.
Invisibility увеличивает counter после исходных add-эффектов и уменьшает перед remove.
Shadows сохраняет порядок sound/observe, расход двух actor ticks, short-circuit expiry,
проверку видимых врагов и собственное Bundle-поле left. Сохранение left отделено от clock/id;
это не готовый импорт Java Bundle или полное сохранение игры.

Light наблюдает мир после назначения радиуса, а при detach делает это до снятия эффекта.
MindVision/Awareness/Blindness наблюдают после снятия. У MindVision.distance в оригинале
нет собственного save field; оно не добавлено в новый save молча. Простые эффекты используют
действительную базовую FlavourBuff expiry, не новый timer или placeholder.

## Независимая проверка

Oracle компилирует ПОЛНЫЕ неизменённые исходные Buff/FlavourBuff и все 16 классов;
Git blob каждого проверяется перед компиляцией. Target/clock/level/UI/ring neighbors —
явные тестовые входы. Frost в этой конкретной матрице — только query neighbor, не утверждение
о готовом Frost с преобразованием предмета. Числа и events expected берутся из Java.

390 последовательностей / **6465 checkpoints**: состояния флагов, membership/target,
clock float bits, наблюдение/звук/press, immunity, повторные attach/detach, исключения и
частичные изменения, durationFactor, left save/restore, short-circuit queries. Проверены
исходные иконки/названия и объявленные DURATION. Восемь интеграционных тестов связывают
реальные CharacterBuffs/CharacterStatus/Health/TurnScheduler с конкретными эффектами.

## Фактический локальный результат

Полный checkout + actual TS6.0.3 из ранее проверенного CI artifact. Node22.16.0/JDK21.0.11.
- test:parity:status-effects: 1/1 PASS, 390 sequences /6465 checkpoints.
- tests/contracts/status-effects.test.mjs: 8/8 PASS.
- typecheck:effects, typecheck:character, check:extraction:effects: PASS.
- test:kernel: **108/108 PASS**, 0 skipped.
- check-boundaries regression: 9/9 PASS; check:boundaries: PASS.

Gate научился принимать JSON только у владельца modules/<owner>/assets; deep imports
чужого контента и imports данных из shared contracts не разрешены. Это не JSON validator.
Общий app build всё ещё имеет прежние vendor declaration errors. Strict не ослаблен.
Для отдельного исследования опубликованных Phaser4/XState/rex declarations добавлен
безбраузерный diagnostic probe: он НЕ меняет pins и НЕ заменяет ошибку основного build.
Результат его CI до чтения run не объявляется успешным.

## Осталось

Полный каталог effects, actor/item/world production composition, реальные Hero/Mob/Level,
сохранения и ручная browser-приёмка. Иконки/текст проверены как данные, не как отрисовка.
Изолированная matrix с соседними портами не доказывает готовность всей игры 1:1.
