# P02 — Dungeon.findPath/flee policy

Дата: 2026-09-26. Седьмой последовательный участок продолжения, без изменения PLAN P00–P10.

## Source и владение

Основной source ID: `Cthulhu-tech/pixel_dungeon:src/com/watabou/pixeldungeon/Dungeon.java`.
Baseline `ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`, full-file blob `961d04ca35a903486cc9bfd2e1386cf0c0c08813`.
Symbols: private passable scratch, findPath, flee. Дополнительные исходные операции —
Level.adjacent и BArray.or; provenance в tests/reference/navigation/README.md.

Target: modules/grid/GridNavigation.ts, public grid/index.ts; types/grid/navigation.d.ts.
GridNavigation владеет только рабочей маской пути. Actor buffs/flight и world occupancy/
visibility/avoid поступают через consumer ports. PathFinder внедряется по узкому интерфейсу;
это уже перенесённый GridPathFinder, не новый backend. Raw masks/actors не изменяются.

## Сохранённые правила

NAV-001: adjacent fast path сначала проверяет Actor.findChar(to), затем pass/avoid;
visibility, flying и buffs не спрашиваются, backend не запускается. Level.adjacent использует
исходную разницу линейных индексов, не исправленный Chebyshev/corner test.
NAV-002: обычный findPath разрешает avoid при flying ИЛИ Amok ИЛИ Rage; short-circuit порядок сохранён.
NAV-003: flee разрешает avoid только при flying, затем делает текущую клетку проходимой.
NAV-004: из общей маски исключаются только видимые character positions из Actor.all,
не все существа безусловно. Источник adjacent occupancy и member projection может различаться
в исходных фазах; порт не создаёт второй canonical owner и не чинит его автоматически.
NAV-005: BArray.or идёт по длине первого массива; System.arraycopy проверяет диапазон
перед копированием. Некорректные runtime masks не нормализуются в успешный результат.

## Независимая проверка

Java fixture содержит **выбранные исходные методы в тестовой оболочке**, не целую
Android-игру. Source method bodies сохранены; оболочка и Actor/buff/trace bindings явно
обозначены. Реальный unchanged PathFinder делегируется через наблюдающий binding.
Оба reference hashes проверяются до javac. Expected вычисляют Java-методы, не TS.

`npm run test:parity:navigation`: **6/6 PASS**, **5776** Java method comparisons,
**764** одинаковых failure outcomes. Сравниваются выбранный шаг, вся переданная PathFinder
маска и порядок queries (buff/occupancy/collection/backend). Матрица: 8 worlds, 8 flight/buff
combinations, 3 visibility patterns, 15 пар клеток, find/flee и отдельные invalid boundaries.

Дополнительно: исходный adjacent avoid path; разница Amok/Rage при find/flee; invisible actor
behavior; неизменность входов; реальное подключение TurnScheduler.findChar/list через ports
без изменения clocks. Это не реализация настоящих Hero/Mob/AI и не перемещение sprite.

После добавления policy: `npm run test:kernel` — **55/55 PASS**, `npm run test:contracts` —
**14/14 PASS**, scoped kernel typecheck и extraction — PASS. Дополнительное уточнение
visibility input у adjacent regression повторно прошло в navigation suite 6/6.
Node22.16.0/npm10.9.2/JDK21.0.11/доступный TS5.8.3; full dependency install не выполнялся.

## Остаток

Нужны настоящие actor/buff/world adapters, lifecycle подключения и игровые сценарии P03.
File-level source-map aggregation остаётся P00.2. Полный Dungeon.java, Char movement и AI
не получают VERIFIED по этим двум методам. Browser/Android/gameplay integration пока открыта.
