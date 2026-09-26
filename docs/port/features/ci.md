# P01.1 / P01.4 — реальная безбраузерная CI-проверка

Дата: 2026-09-26. Первый подтверждённый workflow commit:
`109fb364a05724c78cc3545e6c783b5c9752b824`.
Run `36219646875`, head SHA совпадает; jobs `108342347365` (kernel),
`108342347290` (dependencies). Оба завершились FAILURE, а не успешной приёмкой.

## Результаты первого реального запуска

Kernel из полного checkout нашёл hash mismatch в tests/reference/pathfinding/PathFinder.java:
сохранённый blob 68bf394f3563c4f98c74e4f42a3dfe67eaad762a отличается от закреплённого
оригинального d58524776566aaf0d835200a6c797ba65a3d61fa. Локально тестировался правильный
blob, но запись полного текста в GitHub изменила пробельные байты. Hash gate правильно
заблокировал приёмку. В текущей правке восстановлен ТОЧНЫЙ исходный blob через create_blob
с проверкой returned SHA, затем tree ссылается на этот SHA. Expected hash и тесты не ослаблены.
Повторный CI после исправления ещё должен быть проверен отдельно.

Dependency job: audit всех семи exact pins прошёл, npm install --ignore-scripts добавил
46 пакетов. Это реальное подтверждение существования заявленных версий и установки, но
не runtime compatibility и не воспроизводимый npm ci (canonical lockfile ещё не сохранён).

Установлен TypeScript6.0.3; actual tsconfig blob
1ed9ea2a3d402d5fe29dc120dcf661e5462c0703, baseUrl отсутствует. `npm run build` остановился
на typecheck с ошибками vendor declarations:
- Phaser: TS2526 в phaser.d.ts и несовместимый SubmitterMeshToQuad.run (TS2416).
- rex: отсутствующие Phaser BitmapMask/WebGLPipeline/Pipelines/Mesh, два unresolved
  mesh imports и несовместимые NameInputDialog declarations.
- XState: setup.d.ts StateSchema constraints при exactOptionalPropertyTypes (TS2344).

Vite build, boundary gate и installed-compiler extraction НЕ выполнялись после этой ошибки.
Не добавлены skipLibCheck/ignoreDeprecations, fake typings или downgrade для скрытия ошибок.
P01.1 остаётся BLOCKED в части полного strict app compile; нужно подобрать подтверждённый
набор/разобрать upstream contract, не менять обязательный Phaser4 стек молча.

## Отозванные неподтверждённые сообщения

Более ранняя попытка CI commit использовала несуществующий tree и завершилась 422;
main оставался dbb00c5e29ef9b6554574e1d53c2e3979e31ffaf. Сообщения в чате об успешном
запуске и ошибке baseUrl не имели доказательства и отозваны. Реальными являются только
run/jobs, перечисленные выше. При обновлениях сверять head SHA и фактические ответы API.

## Границы workflow

Два независимых jobs: kernel (Node22.16.0/JDK21, без npm engine packages) и dependencies
(registry audit, install, actual compiler config, build, boundaries, extraction).
Permissions contents:read; нет git push, публикации, браузера, auto-open или install scripts.
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1, test:e2e не вызывается. Старый port-audit не менялся.
Actions pinned по прочитанным GitHub refs: checkout11d5960a326750d5838078e36cf38b85af677262,
setup-node49933ea5288caeca8642d1e84afbd3f7d6820020,
setup-java cf277c60eb25467037889841efdb72551f06f6c3.

## Registry audit

Инструмент проверяет внешние name/version/tarball/integrity, не authored game content.
Каждая ошибка явная; остальные независимые pins проверяются, итоговый exit остаётся nonzero.
Scope REGISTRY_PIN_EXISTENCE_NOT_RUNTIME_COMPATIBILITY. Report в ignored tmp и CI summary.
Отсутствие engines — unknown, не доказательство совместимости. Package.json не переписывается.
Локальные unit fixtures audit + contract-entry regression: 6/6 PASS; unit fixtures сами
по себе не подтверждают существование пакетов. Такое подтверждение получено первым CI выше.
