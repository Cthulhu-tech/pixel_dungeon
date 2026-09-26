# P01.1 / P01-RULES — компилируемый каркас приложения

Дата 2026-09-26. Исходный checkpoint bbfc127564638b528e0d9a198facebd5e56675a2.
Это продолжение PLAN, не новая очередь и не полный игровой экран.

## Решение о зависимостях

Обязательные библиотеки сохранены. Выбран опубликованный набор Phaser **4.1.0**,
phaser4-rex-plugins **4.2.0**, XState **4.38.3**, Zustand **5.0.15**, TypeScript **6.0.3**,
Vite **8.3.1**. Предыдущий Phaser4.2.1/XState5.33.2/full rex UI не проходил strict compile.
Кандидат независимо разрешён и проверен CI probe run36238380348, artifact10905122217;
теперь API приложения адаптирован к нему и полная сборка проверена, а не только probe.
Это явный выбор совместимого набора в рамках исходного запроса без фиксированного major
XState; не понижение TS, не skipLibCheck, не patch vendor declarations и не Phaser3 fallback.

XState создаётся через createMachine/interpret внутри createShellController, не при import.
Роль библиотеки неизменна: lifecycle/orchestration, не игровые часы/AI/HP. Rex подключается
через фактически используемый plugins/button.js, не UI barrel с несовместимыми Mesh/Mask
декларациями неиспользуемых компонентов. Полные оригинальные окна ещё предстоит перенести.
Playwright dependency и старые browser config/test удалены; test:e2e остаётся blocker.

## Владение и lifecycle

Composition root — app/bootstrap.ts, явный вызов mountApplication из HTML entry.
main.ts экспортирует вход без запуска. Zustand — runtime UI projection, собственные типы
в types/app/shell.d.ts. Нет DOM-кнопок/статуса поверх canvas; весь текущий экран Phaser WebGL.
FAIL — отдельный terminal state, не готовность/новая игра. Controller start/dispose идемпотентны,
поздние события после dispose не публикуются. Scene снимает подписки/keyboard handlers при
shutdown. Rex adapter принимает display target на оставшийся срок жизни и уничтожает его
вместе с component: vendor shutdown сам оставляет pointer listeners до destroy target.

Оригинальный amulet.png загружается один раз по texture key и рисуется ShaderQuad.
Оба проектных shader stage — физические owner-local GLSL; output просто texture sample.
Это один инфраструктурный quad, не масштабируемый renderer всего уровня. Визуальная
ориентация/alpha, реальные input/restart/context-loss требуют ручного browser evidence.

## Локальные проверки на полном checkout

Source/dependency artifact10905087352 (run36238380348) получен через connector.
SHA256 ZIP0606c25edf312fd506c34506560d99548c6e8abf93b6cc01fc1d19e2daa18e88;
source bundle38c7b8a96797bc847985acefe346e3384db3215a2f8ca9df40397467153c6d8f;
dependency tar0231f1ae11a3fb9b869c920d6a9cfc329b856cd50d0d15b95fb66dc79ac0f0bc.
Candidate ZIP0e82d4b48ce25fa8d239a26424b13256761d82acb45794eaa03b7878f54c8a3e;
tar ae8998c8c573bc70a72ff260b05ab97d395316270ef690debf93f4194446b614.
Все hashes проверены. Локальный набор использует фактические published package bytes,
не vendor edits; Node22.16.0/npm10.9.2/JDK21.0.11/TS6.0.3.

- npm run build: PASS (full strict tsc + Vite8.3.1). Warning о большом bundle сохранён.
- npm run test:application: 5/5 PASS, реальные XState/Zustand без браузера.
- npm run test:tools: 18/18 PASS, в том числе негативные проверки типов/GLSL.
- npm run check:boundaries: PASS; no type import/export, types только owner .d.ts,
  shader imports только из собственного adapters/<owner>/shaders/*.glsl.
- npm run test:kernel: 120/120 PASS; test:contracts: 53/53 PASS (пересечение наборов).

Canonical lockfile пока НЕ записан: следующий CI должен разрешить новый package.json,
сохранить фактический npm lock и подтвердить npm ci после его включения. Старый lock из
исходного debug artifact не выдаётся за lock нового набора. CI новой правки ещё не прочитан.

## Остаток

Полноценный P01 integration/visual gate остаётся NOT_VERIFIED без ручной приёмки. Это не
играбельный P03. Не выполнен полный browser lifecycle/context-loss и не перенесены оригинальные
окна/bitmap fonts. Все gameplay owners и исходный baseline сохранены. Renderer массовых
тайлов/анимаций, production composition, saves и полный parity продолжаются по PLAN.
