# P01.4 — запуск общего contract suite

Дата: 2026-09-26. Исправление обнаружено при приёмке P02 continuation gate.
Не новая очередь работ; PLAN остаётся единственным backlog.

## Причина и исправление

Старый `test:contracts` вызывал `node --test tests/contracts/*.test.mjs`.
Новый contract suite импортирует TypeScript-модули; на проверенном Node 22.16.0 без
`--experimental-strip-types` он завершался ERR_UNKNOWN_FILE_EXTENSION для turns/index.ts.
Целевой script уже содержал флаг и проходил, но это не доказывало общий npm entry.

Общий script теперь также содержит `--experimental-strip-types`. Package versions не
менялись. Исходный ui-model.test.mjs сохранён byte-identical, blob
`2bf0bab0cb2debba6a41bc5c0374b4368453de8d`; он проверяет импорт grid в чистом Node.

Regression: `web/tools/contracts-entrypoint.test.mjs` читает фактический script, проверяет
его безопасную точную команду и запускает её отдельным процессом. Проверяет не только exit0,
но и вывод конкретного continuation test, отсутствие failures/skips. Дочерний test runner
не наследует NODE_TEST_CONTEXT родителя: иначе Node диагностирует рекурсивный запуск и
пропускает файлы. Этот случай был обнаружен при создании regression; пустой вывод не был
принят за успешную проверку.

## Реальные результаты

- RED: `node --test tests/contracts/turn-continuations.test.mjs` — exit1, неизвестное .ts extension.
- GREEN: `npm run test:contracts` — 14/14 PASS: 13 continuation tests + прежний grid import test.
- `node --test tools/contracts-entrypoint.test.mjs` — 1/1 PASS, реально исполнил общий contract entry.
- `npm run test:kernel` — 49/49 PASS, 0 skips.
- `npm run typecheck:kernel` и три `check:extraction:*` — PASS на доступном TS5.8.3.

Окружение Node22.16.0/npm10.9.2/JDK21.0.11; полный dependency set из package.json не установлен.
49 kernel tests и 14 contracts пересекаются; их нельзя складывать как уникальные проверки.
Это не full app build/typecheck, не browser/Android acceptance и не content schema validation.
Raw logs остались в игнорируемом root tmp. В репозитории сохраняются тест, script и этот отчёт.
