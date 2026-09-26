# Pixel Dungeon web port / Браузерный порт

Полный оригинал пока не перенесён. Текущий экран — только инфраструктурная проверка;
UI/input/audio/visual parity не подтверждены. Состояние: ../docs/port/STATUS.md.

Node >=22.12.0; npm10.9.2. Из web/: `npm install --ignore-scripts`, `npm run build`.
После появления canonical lock использовать `npm ci --ignore-scripts`.
`npm run test:application` проверяет настоящие XState/Zustand в Node.
`npm run test:kernel` требует JDK21 и сравнивает с независимым Java.
`npm run test:tools` / `npm run check:boundaries` проверяют статические ограничения.

Браузер запускает только человек: `npm run dev` или `npm run preview` без auto-open.
Ручной сценарий: tests/manual/infrastructure.md. Агент не запускает браузер/Playwright.
Временное только в ../tmp; исходные Java/assets не изменяются.

## English

This is an incomplete port, not a playable 1:1 release. The current screen is an explicitly
labelled infrastructure check. Use the commands above from web/. Java parity needs JDK21.
XState owns application flow; Zustand owns UI projections; Phaser/rex own presentation.
No browser automation is permitted. A human must perform the manual checklist; passing a
build is not visual/input/audio evidence. Restore progress from the single PLAN and STATUS.
