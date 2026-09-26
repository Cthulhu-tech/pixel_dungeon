# P01.1/P01.4 — точные входы компиляции и проверка границ

Дата 2026-09-26. Workflow дополнен сохранением inputs в commit
`0ec2fcc0c9b28820d14f16fac9516e1ce2656600`. Не новая очередь: задачи остаются в PLAN.

## Полный воспроизводимый snapshot для диагностики

Run `36234060850`; artifact `10902809718`,
`port-debug-inputs-0ec2fcc0c9b28820d14f16fac9516e1ce2656600`.
SHA256 ZIP: `a72ce925ded55944a5dd5e8f5efccdd8f824bf7270cf14b851154e244dcf5166`.
SHA256 source bundle: `4217cf528c4f9d52c826a13b9ade5050fcfaafa98a47f0ca5faa48ca23eae925`.
SHA256 resolved packages tar: `9a0235c41f59675e1859b7da386dfb7a47758968d92cb5ccd8702c307a68cd69`.
Все три значения проверены после скачивания через GitHub connector. Source bundle содержит
полную достижимую Git-историю HEAD, но не credentials/config/untracked files. Dependencies
получены существующим npm install --ignore-scripts; archive не запускает lifecycle scripts.
Artifact retention — один день; это debugging input, не release/дистрибутив игры.

Локальный checkout теперь полный: head совпадает с workflow, исходный baseline доступен как
Git object. Установленный compiler — TS6.0.3, прежний локальный TS5.8.3 больше не подменяет
эту проверку. ZIP и archives хранятся локально; runtime/repo не зависят от наличия artifact.

## Найденный ложный отказ boundary checker

Первый полный локальный `check:boundaries` отказал на имени метода TurnScheduler.process:
старый checker считал любой Identifier с именем process обращением к Node global process.
Исправлено различение property/declaration names и настоящих global reads. Регрессии
проверяют метод process/port.fetch и продолжающийся запрет process.env, {process}, Date.now,
globalThis. Остальные import/cycle/any/random checks сохранены. Это статический policy gate,
не security sandbox и не полная реализация ещё открытого P01-RULES.

- `node --test tools/check-boundaries.test.mjs`: 8/8 PASS.
- `npm run check:boundaries`: PASS после исправления причины.
- `npm run build`: FAIL/exit2, **31 diagnostic**, все в Phaser/rex/XState declarations.

Shared gate failure больше не скрыт ранним app compile failure, но сам app blocker пока
не устранён. No skipLibCheck, fake types, disable-strict или engine substitution.
Canonical lockfile и исправление полного toolchain остаются самостоятельной частью P01.1.
