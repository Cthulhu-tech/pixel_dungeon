# Application shell / Сценарии приложения

bootstrap.ts — единственный composition root текущего browser shell; вызывается явно.
shell-flow.ts создаёт экземпляр XState4 machine/interpreter через createShellController.
Import ничего не запускает. start идемпотентен, dispose снимает subscription и останавливает
interpreter; дальнейшие события игнорируются. После dispose start запрещён. FAIL не READY.

Контракты: types/app/shell.d.ts, не глобальный runtime store. Тут нет HP/карты/часов и нет
права менять игровые правила. Smoke restart не является перезапуском игрового забега.
Tests/application использует actual XState/Zustand, а не заглушки библиотек.

English: Explicit construction/start/disposal. XState orchestrates the shell, not turns.
Zustand receives read-only projections. Full browser lifecycle still needs human evidence.
