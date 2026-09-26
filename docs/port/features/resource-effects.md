# P03/P05/P06 — ресурсные эффекты, урон и взаимодействия с предметами

Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, `actors/buffs/*.java`.
Это детализация единого PLAN. Исходные файлы не изменены; runtime находится в `web/`.

## Реализовано

15 конкретных классов: Poison, Bleeding, Barkskin, Fury, Ooze, Regeneration, Hunger,
SnipersMark, Charm, Terror, GasesImmunity, Weakness, Combo, Frost, Burning.
Вместе с предыдущими 16 это все 31 top-level concrete class в исходном actors/buffs,
но НЕ все эффекты игры: nested item/ring buffs и actors/blobs остаются отдельной работой.

Собственные поля left/level/object имеют read/restore API согласно исходным Bundle methods.
Barkskin/Combo/Ooze не получают новых собственных save fields, отсутствующих в оригинале.
Целевой actor, inventory, terrain, game-over, награды и presentation подключаются узкими
портами. Тестовые соседи не являются production Hero/Level/Item или готовой игрой.

Poison сохраняет float32 left/3, damage/spend/decrement/expiry и Doom. Bleeding сохраняет
случайное ослабление, вычисление splash после center/bloodColor, int overflow/division и
проверку именно Dungeon.hero, а не любого Hero. PI взят из PointF (3.1415926f), не Math.PI.
Ooze сохраняет water query и на мёртвом персонаже. Fury может detach перед spend.
Regeneration обновляет HP через его владельца и addCurrent без damage callbacks;
задержка и проверка голода/бонусов совпадают с исходными стадиями.

Hunger: исходные пороги 260/360, голод/сытость, Rogue/Shadows cadence, задержка сообщения и
обновления состояния, HP=1 при параличе, float32/NaN и Doom. Иконка/название динамичны.
Terror.recover использует Char.remove, а не новую ветку detach. Weakness сохраняет порядок
Hero cast, weakened и discharge. Combo сохраняет переполнение int и fractional postpone.

Frost снимает Burning после paralysis flag и преобразует ровно исходный случай сырого мяса.
Burning сохраняет Light prolong, урон, Scroll/Meat/Thief branches, fire spread, dead-target
continuation, порядок RNG/expiry/water/flight, частичные изменения и события смерти.
Настоящие реализации inventory/food/level будут подключаться следующими задачами: эти порты
не означают, что полные предметы уже перенесены.

## Контент и владение

Effect metadata/messages — owner-local effects/assets JSON, без нормализаторов и defaults.
Исходные ResultDescriptions выделены в run/assets и доступны через публичный resultDescription;
эффекты не дублируют эти строки. CharacterHealth.addCurrent сохраняет signed32 add напрямую,
не превращает лечение в отрицательный damage и не снимает Frost.

## Независимый oracle и результаты

Oracle компилирует все 33 полных исходных Buff/FlavourBuff/concrete files, исходные Assets и
ResultDescriptions; Git hash каждого проверяется. Random.java — точная закреплённая копия,
контролируемые draws инструментируются только в scratch. Char/Item/Hero/World stubs задают
внешние входы и записывают события; их границы явно перечислены в tests/support.

Матрица: **1150 последовательностей /9191 checkpoint**. Сравниваются типовые и крайние
числа, HP/HT, flags, target/membership, clocks, own saves, RNG draws, item branches,
статус/лог/звук/частицы/смерть, exception classes и промежуточные изменения.
Java expected не получены TypeScript-кодом. Текст stack trace не обещан идентичным.

Фактические локальные проверки на полном checkout + actual TypeScript6.0.3,
Node22.16.0/JDK21.0.11:
- test:parity:resource-effects: 1/1 PASS, 1150 sequences /9191 checkpoints.
- resource-effects contracts: 11/11 PASS с реальными доступными владельцами.
- test:kernel: **120/120 PASS**, 0 skipped.
- test:contracts: **53/53 PASS**, 0 skipped; пересекается с kernel.
- typecheck:effects, typecheck:character, typecheck:run: PASS.
- check:extraction:effects (с compatibility), check:extraction:character: PASS.
- check:boundaries: PASS.

Новый CI после публикации читается отдельно. Нельзя приписывать эти локальные результаты
ещё не прочитанному workflow. App build и ручная browser-приёмка не доказываются этой матрицей.

## Осталось

Production Char/Hero/Mob/Level/Items composition, nested buffs/blobs, полноценные save codecs,
случайность/порядок коллекций платформы, визуальные эффекты/шрифты/звук и все завершения игры.
Полные P03/P05/P06 не закрыты, source-map требует агрегации, проценты готовности не выдуманы.
