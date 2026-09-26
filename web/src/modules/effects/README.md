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

Базовые операции сами по себе не доказывают полный effects/P06 или BuffIndicator.
Коллекция Char перенесена отдельно в actors; конкретные классы описаны ниже.
Production composition, полные save codecs и отображение ещё открыты. Evidence и commands:
docs/port/features/movement-buffs.md; актуальный результат CI — docs/port/STATUS.md.

Extraction: modules/effects + modules/compatibility and only their owner declarations/data.
Run npm run typecheck:effects and npm run check:extraction:effects; tests never open a browser.

## Concrete status effects / Конкретные состояния

SimpleStatuses, ControlStatuses, VisionStatuses and Invisibility implement the first 16
source status classes. Original display metadata/constants belong to assets/status-effects.json;
statusInfo is a readonly API to trusted data. JSON is loaded directly without defaults,
normalization or schema validation. Domain imports no UI engine. Source-specific side-effect
order, duration arithmetic, target retention and repeated detach behavior are preserved.
Shadows.ownState/restoreOwnState represent only its original left field; turns owns clock/id.
MindVision.distance is not silently persisted. CharacterStatus owns the actual target flags.

Verification and exact scope: docs/port/features/status-effects.md. Extraction copies only
effects and owner declarations/data; TypeScript resolveJsonModule is enabled for these trusted
imports. Damage/resource effects are described below. Full item/actor/world integration remains
separate PLAN work, not generic behavior silently substituted by these classes.

## Resource, damage and item-interaction effects

Poison, Bleeding, Barkskin, Fury, Ooze, Regeneration, Hunger, SnipersMark, Charm, Terror,
GasesImmunity, Weakness, Combo, Frost and Burning cover the other 15 top-level concrete
classes in the original actors/buffs directory. Nested ring/item effects and blobs remain
separate work. This source-file accounting is not a claim that all effect integrations work.

Own source Bundle fields (left/level/object) are exposed as owner checkpoints; base time/id
remain in turns. Do not invent persisted Barkskin/Combo state absent from their source.
Each effect uses typed ports for actual actor, item, level and ending operations. Test ports
are not substituted for missing production Hero/inventory/trap behavior. Death descriptors
belong to run/assets; effect status/messages belong to effects/assets.

See docs/port/features/resource-effects.md for full-class Java oracles, real-owner integration
and uncovered runtime boundaries. Pure extraction includes compatibility's numeric function
and its required owner declarations; it never imports renderer or the global application.
