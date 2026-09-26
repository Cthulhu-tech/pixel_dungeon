# P00.4 / P00.5 / P02 — Actor scheduler

Дата: 2026-09-26. Пятый последовательный участок текущего продолжения, в едином PLAN.
Перенесена scheduler-семантика исходного Actor; существа/бой и renderer integration не объявляются готовыми.

## Source и mapping

File ID: `Cthulhu-tech/pixel_dungeon:src/com/watabou/pixeldungeon/actors/Actor.java`.
Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, blob `2f91dd22a194d2d2a83f22c56930695a702100d8`.
Reference tests/reference/turns/Actor.java — те же bytes, hash проверяется до javac.
Target: web/src/modules/turns/TurnScheduler.ts, index.ts; declarations types/turns/scheduler.d.ts.

| Original | TS responsibility |
| --- | --- |
| time, spend, postpone, cooldown, diactivate | scheduler-owned float32 clocks и методы |
| id, storeInBundle/restoreFromBundle поля | id/clockOf/restoreClock; это НЕ Bundle codec |
| all/ids/current/now | injected membership order, private ID index/current/time |
| clear/fixTime/init | clear/fixTime/initialize с original order и hero delay -2^-149 |
| process/next | process/next через participant behavior, character playback и hero-alive ports |
| add/addDelayed/remove + callbacks | исходный registration/removal order, direct buffs registration |
| chars/occupyCell/freeCell/findChar | derived occupancy lookup в turns, не второй canonical position owner |
| findById/all | keyed read-only query и detached membership list |

Это уточняет архитектуру: derived Actor chars index принадлежит turns, grid получает query
через порт, не создаёт дубликат. Canonical position остаётся actors. Фазы обновления lookup
сохраняются по исходнику, а не автоматически исправляются при каждом чтении позиции.

## Oracle и пределы проверки

Неизменённый Actor компилируется с test-only Char/Mob/Buff/Blob/Level/Dungeon/Statistics,
SparseArray и primitive Bundle. Они подают scripted inputs и наблюдают hooks, но не
реализуют очередь вместо оригинала. Duration подтверждена как float чтением Statistics.java.

Порядок all устанавливается через reflection в LinkedHashSet и подаётся TS membership port.
Это проверка очереди при **одинаковом заданном порядке**, а не универсальная эмуляция Android
HashSet/identity hash. Реальный порядок коллекций остаётся открытым P00.6. Нельзя закрывать
whole-file integration на основании этого isolated harness.

## Фактические результаты

`node --experimental-strip-types --test tests/parity/turns.test.mjs`: **6/6 PASS**,
**106 scenarios / 4129 checkpoints**, 4 одинаковых bounds failures; 0 skipped.
Каждый checkpoint сравнивает canonical float bits (NaN canonicalized), clocks/cooldowns,
current/now, duration, member order, ID allocation/lookup, occupancy и callbacks.
Cases: fractional/large/negative times, NaN/Infinity, repeated add/remove, init/buffs,
spending/postpone, moving, next, death, callbacks that add/remove/move/clear, duplicate IDs,
ID overflow, equal times, clear/current quirk и source partial state on bounds errors.

Совместный kernel run: **36/36 PASS** — 32112 прежних algorithm cases + 4129 scheduler
checkpoints. Strict kernel typecheck и separate compatibility/turns/kernel extraction прошли.
Повторяющийся extraction host вынесен в tools/module-extraction.mjs; wrappers сохраняют
явные owner lists. Для standalone turns не копируются grid, compatibility или чужие globals.

Окружение Node22.16.0, JDK21.0.11, доступный TS5.8.3; project versions не менялись и не
устанавливались. Файлы восстановлены через GitHub connector из-за DNS clone limitation.
Нет full application build/architecture gate, настоящего Bundle codec, Android/Phaser запуска.

## Следующий участок

Защищённые continuation IDs/generations для renderer acknowledgment, cancellation и stale
callbacks. Raw scheduler.next остаётся внутренним domain action, не выдаётся renderer.
Далее — интеграция с настоящими Actor/Char/Level/AI и source collection owners. Source-map
aggregation P00.2, общий toolchain P01 и human visual evidence по-прежнему открыты.
