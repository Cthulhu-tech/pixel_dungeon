# Контекст полного переноса Pixel Dungeon

Полностью перенести существующий Pixel Dungeon 1:1 в браузер на strict TypeScript/JavaScript + Vite + Phaser 4 + XState + Zustand vanilla + phaser4-rex-plugins. Navcat — отдельный кандидат. Код следует SOLID/KISS/DRY/OOP/DDD; самостоятельная логика изолирована и выносится вместе с явными dependencies, а не всем приложением.

Цель — исходная игра, включая редкие ветки, весь контент, интерфейс, графику и звук. Новые механики/ребаланс/редизайн не входят в перенос. Внутреннюю Java-структуру менять можно; наблюдаемое поведение — нельзя.

## Навигация

| Документ | Назначение |
| --- | --- |
| [AGENTS.md](../../AGENTS.md) | Обязательный вход, маршрутизация контекста и критические ограничения |
| [MANDATORY_RULES.md](MANDATORY_RULES.md) | Правила из PSX/CORE, их источники и явные адаптации к Pixel Dungeon |
| [PLAN.md](PLAN.md) | Записанный план P00–P10: результат этапа, зависимости, критерии готовности |
| [STATUS.md](STATUS.md) | Фактическое состояние, evidence, блокеры и следующий шаг |
| [ARCHITECTURE.md](ARCHITECTURE.md) | DDD/ownership, APIs, declarations, lifecycle, extraction |
| [PARITY.md](PARITY.md) | Независимые проверки original behavior, визуального/звукового соответствия |
| [STACK.md](STACK.md) | Роли библиотек, toolchain, запрет browser automation, ручной smoke-test |
| [source-baseline.json](source-baseline.json) | Закреплённая исходная идентичность и снимок начального аудита |
| [source-map.json](source-map.json) | Уже существующий реестр соответствий; полнота behavioral coverage проверяется отдельно |

PLAN — одна действующая очередь, STATUS — текущие факты. Readiness-поля раннего baseline manifest и исторический отчёт не отменяют новые факты STATUS. Нет второй очереди в Issues/переписке; source-map не объявляет DONE только по наличию target file.

## Обновление 26 сентября 2026: сначала план и правила

Согласованный порядок записан в PLAN: **полный перечень → границы/стек → точное ядро → первый законченный сценарий → весь контент → итоговая приёмка**. UI и сохранения начинаются на первом сквозном сценарии, а не откладываются до конца.

Обязательные правила прочитаны в `Cthulhu-tech/psx` и `Cthulhu-tech/core-`, их commits закреплены в MANDATORY_RULES. В порт перенесены boundaries/one owner, composition/lifecycle, strict quality, trusted owner-local JSON, owner-scoped ambient `.d.ts`, физические GLSL, shader-only non-UI WebGL presentation, отсутствие hidden fallback, запрет агентского запуска браузера, targeted verification и честный статус.

Специфические WebGPU/React/3D/LOD, число save slots, gameplay content/баланс и task IDs других игр не переносятся. Java compatibility и исходная очередь Pixel Dungeon сохраняются. Browser evidence получает человек; агент выполняет безбраузерные проверки и анализирует evidence. Недостающая visual проверка остаётся NOT_VERIFIED.

В main уже есть inventory/source-map и начальный web scaffold. Не удалять и не создавать их с нуля. Новая P01-RULES приводит существующую реализацию к принятым правилам; изменение документов не считается внедрением политики в code/tests. В этой сессии code/config не менялись и runtime checks не запускались.

## Закреплённый оригинал

| Факт | Источник |
| --- | --- |
| Игра | `Cthulhu-tech/pixel_dungeon@ce7f241515fd5c040fcf18b4beb5b7a49d9d535f` |
| Корневое дерево baseline | `ef7b1ef7568c2aa15c3d8c527e9e6004901e4c8a` |
| Manifest | `com.watabou.pixeldungeon`, 1.9.1, versionCode 74 |
| Исходный стек/корни | Java/Android; `src/`, `assets/`, `res/` |
| Внешняя библиотека | README указывает `watabou/PD-classes` |
| Candidate PD-classes | `c0b690a4163020963e70a58a7d4f27965dc8f134`; совместимость original/harness требует evidence |
| Grid | Level: WIDTH=32, HEIGHT=32, определённые массивы соседей |
| Turns | Actor: Java float time, HashSet, sprite.isMoving, next() |
| Random | Исследованный PD-classes wrapper: Java Math.random и float/int casts |
| Внешнее время | Dungeon.switchLevel: nightMode по локальному часу |
| Уведомления | Прочитанные Java headers: GPL version 3 or later; сохранить LICENSE/авторство, отдельно проверить assets |

Эти исходные наблюдения не являются доказательством запуска или полного аудита поведения. Точное происхождение всегда repository/commit/path/symbol. Не заменять pin свежим upstream HEAD и не обещать общий seed Java/JS до проверки RNG.

## Размещение и переносимость

Исходные `src/`, `assets/`, `res/`, AndroidManifest/лицензия остаются неизменными. Новый runtime — `web/`; definitions/manifests — у module/adapter owner; project types — `web/src/types/<owner>/*.d.ts`; GLSL — у presentation owner. Runtime entrypoints экспортируют значения, не types. Module extraction включает только нужные declarations/dependencies и проверяется в отдельном Node host.

Инструменты аудита — `tools/port/`; канонические эталоны с provenance — `tests/reference/`; намеренно сохраняемые компактные отчёты — `tests/reports/`. Scratch/logs/raw captures — root `tmp/`, Git ignored. Не коммитить dist/node_modules/browser profiles или копии worktrees. Не создавать пустые каталоги/новые движки/редакторы ради схемы.

## Реестр соответствий

Существующий source-map проверяется и расширяется на P00. File-level запись не заменяет отдельные branches/content/UI states. Для каждого поведения требуется source, owner, target files, зависимости и проверки. Целевая запись:

```json
{
  "id": "stable-source-feature-id",
  "source": {
    "repository": "owner/repo",
    "commit": "full-sha",
    "path": "path",
    "symbols": []
  },
  "ownerModule": "module-name",
  "targetFiles": [],
  "testFiles": [],
  "referenceArtifacts": [],
  "status": "TODO",
  "notes": ""
}
```

Это пример данных, не runtime schema-validator и не заявление о реализованном behavioral mapping. Совместимое расширение существующего writer/readers делается одной P00-задачей, без сброса статусов.

Статусы: TODO, IN_PROGRESS, IMPLEMENTED_UNVERIFIED, VERIFIED, BLOCKED. Явно согласованное platform exclusion сохраняется с причиной и решением; строка не удаляется для улучшения покрытия. Расхождения/наблюдаемые баги оригинала ведутся в `discrepancies.md` при его создании P00.2. Покрытие выводится из реестра/evidence, не количества TS-файлов.
