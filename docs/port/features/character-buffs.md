# P03/P05/P06 — коллекция эффектов персонажа

Источник: `actors/Char.java` из baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`,
blob `65bb59224b2574caa7939cc030d65ad68e31a9fd`. Это детализация PLAN, не новая очередь.

## Реализация

`actors/CharacterBuffs` переносит девять исходных методов: обе формы `buffs`, `buff`,
`isCharmedBy`, `add`, обе формы `remove`, `onRemove`, `updateSpriteState`.
Коллекцией владеет персонаж, target принадлежит Buff, часы — TurnScheduler. Runtime types
находятся в owner-scoped `types/actors/buffs.d.ts`; класс не импортирует framework или соседей.
Новый classId не определяется по минифицированному имени конструктора.

Сохранены повторные эффекты при duplicate add, Actor.remove для отсутствующего элемента,
первый результат поиска с учётом наследования, вызов id даже без Charm, фильтр в отдельном
наборе, snapshot перед detachAll и исходный порядок визуальных событий/ошибок.
Shadows считается Invisibility без подписи; Light добавляется в updateSpriteState, но не
новой веткой базового add. У remove/update нет придуманного null-sprite fallback.

Порядок основной коллекции и нового filtered HashSet — явные зависимости. Нельзя считать
JS Set автоматическим воспроизведением Android HashSet. В Java-тесте основная коллекция
LinkedHashSet задаёт входной порядок; фильтр — настоящий HashSet с test-owned hashes 0..7.
TS получает соответствующую стратегию. Production identity order остаётся открытой P00.6.

Статусные строки извлечены без изменения в `actors/assets/buff-labels.en.json`.
Presentation получает ключи; исходные слова проверяются в сравнении с Java, не переписаны.

## Независимый oracle

`CollectionOracle.java.tmpl` задаёт только соседей и входы. Тест проверяет hash полного
исходного Char.java и вставляет в test-only shell девять неизменённых методов напрямую
через существующий extractor. Ни один expected не вычисляется TypeScript-портом.
Матрица: **475 сценариев / 10235 последовательных checkpoints** с порядком событий,
membership, позицией, invisible counter, queries, отсутствующим sprite и injected failures.
Подклассы и расхождение порядка find/filtered-set проверяются отдельно.

Четыре интеграционных теста подключают реальные Buff/FlavourBuff, CharacterHealth,
CharacterTime и TurnScheduler к новой коллекции. Проверены add/expiry, отсутствие второго
таймера, снятие Frost до изменения HP и detach эффектов до освобождения клетки при смерти.
Это всё ещё не полные конкретные Frost/Poison/Hero/Mob implementations.

## Выполнено локально

Полный repository snapshot получен из Git bundle CI artifact `10902809718`, run
`36234060850`, source head `0ec2fcc0c9b28820d14f16fac9516e1ce2656600`. SHA256 ZIP и вложенных
bundle/tar совпали с artifact metadata/report. Установленные packages извлечены из этого
же CI без повторного исполнения install scripts. В отличие от прежних сессий это полный
checkout, не вручную восстановленный subset. Node22.16.0/JDK21.0.11/actual TypeScript6.0.3.

- `npm run typecheck:character`: PASS.
- `npm run check:extraction:character`: PASS, включая negative declaration control.
- `node --experimental-strip-types --test tests/parity/character-buffs.test.mjs`: 5/5 PASS.
- `node --experimental-strip-types --test tests/contracts/character-buffs-turns.test.mjs`: 4/4 PASS.
- `npm run test:kernel`: **99/99 PASS**, 0 skipped. Включает новые и прежние тесты.

Новый CI code checkpoint проверяется после публикации, не приписывается локальному прогону.
Реальный renderer/input/audio не запускался; это не доказательство визуального соответствия.
Весь Char.java и этапы P03/P05/P06 не объявляются завершёнными по этой выбранной матрице.
