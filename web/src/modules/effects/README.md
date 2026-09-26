# Effects / Базовые операции эффектов

Source: actors/buffs/Buff.java and FlavourBuff.java at
ce7f241515fd5c040fcf18b4beb5b7a49d9d535f. Public API: index.ts.
Own contracts: web/src/types/effects/buffs.d.ts. No framework/DOM/clock singleton.

Buff owns its attached target reference and stable exact class ID, NOT the character's
collection, HP, flags or turn time. PDBuffClock delegates to the existing TurnScheduler.
Buff and FlavourBuff structurally satisfy its participant contract; base Actor hooks are
intentionally empty. Base act deactivates; FlavourBuff act detaches. Neither starts a timer.

При иммунитете attachTo возвращает false до смены target. После detach исходник сохраняет
target; повторный detach снова вызывает remove. Нельзя превращать это в новый idempotent
игровой переход. Идемпотентность application teardown обеспечивается его владельцем.

BuffOperations ports append/affect and their duration overloads, prolong and both detach
helpers. Append creates a new instance; affect asks the target owner for the first matching
instance. Matching inheritance and collection order belong to that owner, not JS Set or
constructor names. AffectFor adds duration; prolong postpones until max(old time, now+duration).
Append deliberately ignores false attach, as the source does; an immune unattached instance
can therefore receive a clock value. Do not silently replace this with null or a new grant.

Original append catches Java Exception, not Error. The explicit factory-boundary error port
classifies these outcomes and reports caught failures; only the original diagnosed path
returns null. Fatal/unclassified errors propagate. Duration helpers still fail on a null
result. This is preservation of a named source branch, not a generic fallback or suppressed
application error. Factories/error classification must be wired explicitly in production.

Проверки: полный hash-pinned Buff/FlavourBuff компилируется с test-only Char/Actor/UI ports;
504 последовательности / 4032 checkpoints плюс целевые contracts. Отдельные integration
tests используют настоящий TurnScheduler. Exact-class immunity проверяется на его границе.

Это не полный каталог эффектов, не Char.buffs/add/remove/updateSpriteState и не BuffIndicator.
Иконки/тексты принадлежат presentation; конкретные Poison/Paralysis/etc и save codecs ещё
требуют переноса. Не объявлять весь effects/P06 готовым. Evidence и commands:
docs/port/features/movement-buffs.md; актуальный результат CI — docs/port/STATUS.md.

Extraction: modules/effects plus only types/effects and their public injected ports.
Run npm run typecheck:effects and npm run check:extraction:effects; tests never open a browser.
