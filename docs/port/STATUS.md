# Фактический статус переноса

Обновлено 2026-09-26. Поручение: продолжать последовательно, задачу за задачей.
PLAN P00–P10 остаётся единственной очередью. Полной играбельной игры пока нет.

## Текущий checkpoint: завершена следующая задача Random

Начало продолжения: `93aa9b7dba5e78fbe7e471ce49f137e839ffb8ce`.
Сохранена предыдущая scalar-реализация. Добавлены остальные восемь wrapper операций:
collectionIndex, oneOf, element, elementWithin, collectionElement, weightedKey,
shuffle и shufflePair. Изолированный модуль без Phaser/DOM/global RNG; типы owner-scoped.

В независимом Java-harness используются прежние неизменённые Random.java и controlled
draws. Новый harness экспортирует фактический HashMap порядок и частичные мутации массивов.
Порядок коллекции передаётся TS как явный вход, не выдумывается из JS Map/Set.

| Проверка | Фактический результат |
| --- | --- |
| Новый collection suite | 6/6 PASS, 4260 original-Java comparisons |
| Старый scalar + новый collection suite вместе | 13/13 PASS, 4982 + 4260 = 9242 comparisons; 0 skips |
| `tsc -p tsconfig.compatibility.json` | PASS; strict без DOM |
| `node tools/check-compatibility-extraction.mjs` | PASS; только модуль/его declarations в отдельном host |

Команда общего RNG-прогона: `node --experimental-strip-types --test tests/parity/random.test.mjs tests/parity/random-collections.test.mjs` из web. `test:parity:random` обновлён на оба suite.

Окружение: Node 22.16.0, JDK 21.0.11, локальный TS 5.8.3. Через временный локальный symlink
использован доступный compiler, не выполнена установка заявленного TS 6.0.3 и остальных
npm packages. Версии проекта не менялись. Полный clone недоступен из-за DNS GitHub;
относящиеся текстовые файлы восстановлены через connector, исходные blobs сверены.

Не запускались: общий npm install/ci, full typecheck/build/architecture gate, Android
application, браузер или browser automation. Успех подсистемы не означает их прохождение.

## Что именно подтверждено и что нет

Все 16 методов исходного Random wrapper теперь имеют реализации и scoped Java evidence.
Production PRNG, его сохранение, порядок коллекций конкретного Android runtime и поток draws
всей игры ещё открыты. Поэтому весь Random.java/весь P02 не получают полный VERIFIED.
`docs/port/features/random.md` содержит symbol mapping и границы доказательства.
File-level source-map/generated summary пока не агрегируют новый evidence; P00.2 открыт.

Сохранены RNG-001 (weighted array bounds), RNG-002 (разный расход draws у пустых
коллекций/массивов/map) и RNG-003 (частичная мутация paired shuffle). Нет fallback,
автоматической нормализации весов или отката исходной частичной мутации.

## Текущие области плана

| Область | Состояние |
| --- | --- |
| P00.1/P00.2 | inventory/source-map уже есть; semantic coverage и aggregation открыты |
| P00.3–P00.5 | Random компилируется изолированно; оба oracle suite работают; полный Android/PD-classes не подтверждён |
| P00.6 | коллекции владельцев, saves, clocks, callback phases ещё требуют аудита |
| P01/P01-RULES | scaffold существует; общий toolchain, type imports, shaders и остальные policy gates открыты |
| P01.5 | extraction compatibility прошёл на доступном compiler |
| P02 | random wrapper расширен; следующим переносится исходный PathFinder с Java oracle |
| P03–P10 | завершение не подтверждено; full visual/gameplay parity NOT_VERIFIED |

Ничего не создаётся заново вместо существующих inventory/web. Старый `test:e2e` ранее
заменён явным blocker/exit 2; прямой запуск оставшихся Playwright файлов также запрещён.
Общий `test:parity` не заменён ложным PASS всего проекта.

## История и неприкосновенные источники

- Baseline: `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, Pixel Dungeon 1.9.1/74.
- PD-classes candidate: `c0b690a4163020963e70a58a7d4f27965dc8f134`.
- `6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60`: первоначальные документы.
- `6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2`: inventory, source-map, workflow и web scaffold уже существовали.
- `029fac6143cc09cc000b68c4349e1d0e990acc1f`: согласованный план и адаптация PSX/CORE правил.
- `93aa9b7dba5e78fbe7e471ce49f137e839ffb8ce`: scalar Random, 7/7 tests и 4982 comparisons; browser blocker 1/1, tmp ignore.

Исходные src/assets/res/AndroidManifest/LICENSE не изменены. Изменения этой задачи:
Random runtime, его declarations, новый Java/test host, package script и документация.
Новых assets, шейдеров, UI или сохранений нет. Временное только root tmp, не build inputs.

Следующий участок: исходный PathFinder, независимое сравнение точного пути/шага/отступления,
а затем соседние алгоритмы grid. Browser evidence по-прежнему ручной и пока отсутствует.
