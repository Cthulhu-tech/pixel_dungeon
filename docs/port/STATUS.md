# Фактический статус переноса

Обновлено 2026-09-26 после поручения «отлично начинай».

## 1. Текущий результат

**Реализация начата: добавлен первый изолированный участок compatibility и независимый Java oracle. Полной играбельной браузерной игры ещё нет.**

Исходный checkpoint этой сессии: `029fac6143cc09cc000b68c4349e1d0e990acc1f`.
Runtime/test files и их описание записаны в main; завершение записи основного набора до этого отчёта: `643646c8df72bb6ae04a433a212a93f5398eaa23`.

Детальная посимвольная карта, команды и ограничения: [features/random.md](features/random.md). Она детализирует P00.4/P00.5/P02, не создаёт вторую очередь вместо PLAN.

| Область | Реально сделано |
| --- | --- |
| Compatibility | Java narrowing to int; три Float overloads, два Int overloads, IntRange, NormalIntRange, chances(float[]) |
| Ownership | Экземпляр JavaRandom получает PDRandomSource; нет глобального RNG/часов/Phaser/store и import-time запуска |
| Типы | Собственный контракт в web/src/types/compatibility/random.d.ts, public runtime API через index.ts |
| Эталон | Неизменённый Random.java из закреплённой PD-classes; Git blob проверяется перед компиляцией |
| Oracle | Отдельный Java-harness с controlled draws; исходные формулы не переписаны на TS для получения expected |
| Parity | 7 tests, включая 4982 Java/TS сравнения результатов, float bits, ошибок выбора и числа draws |
| Extraction | Только модуль и его .d.ts успешно typechecked в отдельном host без DOM и остальных globals проекта |
| P01-RULES, частично | npm test:e2e теперь выдаёт BLOCKED/exit 2 вместо Playwright; добавлен regression test запрета |
| Hygiene/docs | root tmp игнорируется; temporary hosts очищаются; module/reference README содержат RU/EN описание |

Старые файлы scaffold, его UI, анимации и алгоритм grid не переписывались. Java-игра в src/, исходные assets/, res/, AndroidManifest.xml и LICENSE.txt не менялись. .gitignore дополнен только root tmp. Package scripts дополнены целевыми проверками; заявленные dependency versions сохранены.

## 2. Проверки этой сессии

Окружение реальных локальных прогонов: Node 22.16.0, npm 10.9.2, JDK 21.0.11; доступный TypeScript 5.8.3. Это **не** подтверждение установленного package.json-набора, где указан TypeScript 6.0.3.

| Команда | Результат |
| --- | --- |
| `git hash-object tests/reference/random/Random.java` | `cc6ce01ae51678da114ee1e0d26485717107704c`, совпадает с upstream blob |
| из web: `tsc -p tsconfig.compatibility.json` | PASS: strict isolated typecheck на TS 5.8.3 |
| из web: `node tools/check-compatibility-extraction.mjs` | PASS: отдельный host, только нужные module/declarations |
| из web: `npm run test:parity:random` | 7/7 PASS, 4982 comparisons, без skipped tests |
| из web: `node --test tools/browser-check-blocked.test.mjs` | 1/1 PASS |
| из web: `node tools/browser-check-blocked.mjs` | Ожидаемый BLOCKED/exit 2; браузер не запущен |

Прямой git-доступ из локального окружения не работал: `Could not resolve host: github.com`. Нужные текстовые файлы прочитаны/записаны через GitHub connector; локальные проверки выполнены на восстановленном наборе относящихся исходников, не на полном clone репозитория. Доступный TS 5.8.3 использован только для изолированной проверки; версия проекта не понижалась.

**Не выполнялись:** npm install/ci всего приложения, full typecheck/build/lint/architecture gate, запуск всей инвентаризации на обоих Git trees, полный Android build, browser launch/attach/automation и ручная visual/input/audio приёмка. Успех подсистемных проверок не переносится на эти области.

## 3. Границы доказанного

4982 — число случаев выбранной матрицы, не число игровых механик и не процент готовности. Проверено восемь wrapper methods и narrowing conversion на описанных входах. Это не exhaustive перебор IEEE значений.

Полный Random ещё не перенесён: остаются HashMap/Collection, index/oneOf/element/shuffle, production random-source implementation, его сохранение и потребление случайности остальной игрой. Совместимость Java Math.random и JS Math.random по одному seed не заявляется.

Выявленный RNG-001: исходный chances(float[]) может выходить за границы на пустых/нулевых weights и при float32 rounding до полной суммы. Исход неуспешного выбора сохранён, fallback не добавлен. Java exception text/stack не обещаны идентичными JS RangeError. Подробности и регрессии находятся в feature evidence.

File-level source-map/generated summary пока не регенерированы и не агрегируют новый посимвольный отчёт. Это открытая часть P00.2; не ставить VERIFIED всему Random.java и не сбрасывать существующие строки. Полнота source/content/UI реестров по-прежнему не подтверждена.

## 4. Этапы и оставшиеся блокеры

| Этап/область | Статус и остаток |
| --- | --- |
| План и обязательные правила | Сохранены; PLAN остаётся единственной очередью |
| P00.1/P00.2 | IN_PROGRESS: inventory/source-map существуют; аудит полноты и агрегирование feature evidence остаются |
| P00.3 | Random reference компилируется изолированно; совместимость всей PD-classes с Android-игрой не подтверждена |
| P00.4/P00.5 | Первый numeric/Random oracle реализован и проверен; остальные эталоны нужны |
| P00.6 | HashSet ties, callback phases, saves, clocks и presentation random ещё требуют полного обследования |
| P01 | IN_PROGRESS: full package installation/lockfile/build/integration не подтверждены |
| P01-RULES | Частично: заблокирован npm browser entry; старые type imports, contracts placement, shader-only path и остальные policy tests остаются |
| P01.5 | Extraction нового compatibility проверен локальным TS; целевой набор npm versions и общий gate ещё не проверены |
| P02 | IN_PROGRESS: первая numeric/Random часть реализована; очередь Actor, pathfinding/FOV/ballistics не перенесены |
| P03–P10 | Завершение не подтверждено; первый полный игровой сценарий ещё отсутствует |
| Полный перенос / полный паритет | NOT_COMPLETE / NOT_VERIFIED |

Старые Playwright test/config и dev dependency пока сохранены, не запускались; изменён только npm entry, теперь завершающийся с явным запретом. Нельзя запускать их напрямую или через workflow. Общий test:parity не превращён в ложный PASS всей игры.

## 5. Следующий конкретный участок по PLAN

Согласовать P00.2 file-level inventory с новым symbol-level evidence, продолжить P01-RULES для существующих type imports/контрактов и реального toolchain. В ядре — оставшиеся Random array/collection операции с отдельной проверкой порядка; затем исходные PathFinder/Actor fixtures. Независимая подготовка эталонов не ждёт ручной browser-проверки, но массовый контент не начинается без согласованных контрактов.

## 6. Сохранённая история

- Эталон игры: `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, Pixel Dungeon 1.9.1 / 74. Candidate PD-classes: `c0b690a4163020963e70a58a7d4f27965dc8f134`. Source identity не менялась.
- `6f4ffdfd40fb31d00625ea24e4285ff2dbee0b60`: первоначальный контекст; тогда web/source-map отсутствовали.
- `6cc1858e1534b3b826e2ae0cf25e1bf52b2dd1d2`: уже присутствовали inventory tool/tests, generated inventory/summary/source-map, audit workflow, web scaffold и тестовые файлы. Они не созданы заново и не обнулены.
- `029fac6143cc09cc000b68c4349e1d0e990acc1f`: согласованный план и правила из PSX `9adcf519b8e47c3bdbc5e5c52b78f418715e597f` / CORE `8b8d7aed0808d2f809de542e77c47f7e53b91915`. Приватные configs/assets не переносились.

Исходные наблюдения сохраняются: grid 32×32; float scheduler/HashSet; sprite/next continuation; Java Math.random wrapper; local-hour nightMode. Они не доказывают полного паритета.

## Шаблон следующего отчёта

```text
Дата / рабочий commit:
ID задачи PLAN / owner:
Реально изменённые файлы и поведение:
Source / reference fixture / provenance:
Команда -> фактический результат (либо NOT_RUN и причина):
Версии инструментов и область проверки:
Ручное browser evidence (либо NOT_VERIFIED):
Открытые расхождения/блокеры:
Следующий конкретный шаг:
```
