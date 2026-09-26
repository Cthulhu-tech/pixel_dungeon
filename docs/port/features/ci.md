# P01.1 / P01.4 — безбраузерная CI-проверка

Дата: 2026-09-26. Workflow port-verification.yml и registry audit добавляются после
checkpoint `dbb00c5e29ef9b6554574e1d53c2e3979e31ffaf`.
Наличие workflow не является доказательством его успешного запуска.

## Исправление неподтверждённых сообщений

Предыдущая попытка создать CI commit использовала несуществующий tree SHA и завершилась
422; update_ref также завершился ошибкой. Проверка реального main подтвердила, что он
оставался на dbb00c5. Сообщения в чате об успешных CI jobs, доступности всех npm pins и
ошибке baseUrl не подтверждены фактическими ответами GitHub и отозваны. По ним нельзя
менять tsconfig или отмечать build/registry VERIFIED. Исправленная запись использует
существующий tree и проверенные action refs. Дальнейшие результаты принимаются только
по фактически полученным run/job IDs, head SHA и логам соответствующего запуска.

## Назначение и границы

Локальный npm registry запрос завершился ETIMEDOUT; это не доказывает отсутствие версии.
Pins не заменяются. Два независимых jobs:

- kernel: полный GitHub checkout, Node22.16.0/JDK21; исходные Java сравнения, contracts
  и тесты инструментов. Не зависит от установки Phaser/Vite.
- dependencies: точный audit всех npm metadata, затем install --ignore-scripts,
  effective tsc config, build, существующий boundary gate и extraction.

Permissions contents:read, нет git push, deployment, auto-open, browser automation или
install scripts. PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1. Action v4 refs закреплены по чтению
GitHub: checkout 11d5960a326750d5838078e36cf38b85af677262,
setup-node 49933ea5288caeca8642d1e84afbd3f7d6820020,
setup-java cf277c60eb25467037889841efdb72551f06f6c3.

Пока canonical lockfile не получен и не проверен, используется npm install, не npm ci.
Этот временный diagnostic job не закрывает воспроизводимость зависимостей P01.1.
Старый port-audit workflow не изменён.

## Audit tool

web/tools/audit-dependency-pins.mjs проверяет внешний registry, не authored game content.
Точное совпадение name/version и distribution metadata обязательно; failures явные,
остальные независимые pins всё равно проверяются. Report scope:
REGISTRY_PIN_EXISTENCE_NOT_RUNTIME_COMPATIBILITY. Он хранится в ignored root tmp и CI
summary. Отсутствующие engines не означают совместимость. Package.json не переписывается.

Локальный реальный прогон audit unit tests + contract-entry regression: 6/6 PASS,
0 skipped. Unit metadata внедрены как тестовые входы, не доказательство реальных пакетов.
Последние сохранённые локальные kernel/contract результаты — STATUS.md (55/55 и14/14).
Full CI installation/build/registry evidence на момент этого коммита отсутствует.
