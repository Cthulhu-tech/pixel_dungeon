# Run / Исходы прохождения и наблюдение

Public runtime API is index.ts; own types are types/run/*.d.ts. This is not yet a full
run coordinator. No domain imports of Phaser/DOM/storage/XState or mutable global Dungeon.

resultDescription reads assets/result-descriptions.en.json extracted verbatim from original
ResultDescriptions.java at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f. Placeholders and wording
are preserved. Effects send a reason through a port rather than duplicating ending messages.
Formatting and actual fail/save/end-screen integration remain separate tasks.

RunObservation ports Dungeon.observe through PDObservationLevel. It owns the transferred
current hero-visible buffer; its caller relinquishes mutation. A level updates hero FOV and
remembers visibility through its public API; afterObserve is called afterward. Null level
returns unchanged. Full source range is checked before copy, while later memory/presentation
errors do not roll back committed data. visible is a read-only borrow; snapshot is detached.

LevelSight owns reusable per-actor FOV. LevelExploration owns visited/mapped for a level.
The composition root binds these to RunObservation's narrow operations. Querying a monster's
FOV must not mutate stable hero visibility. No new frame loop, event bus or subscription.

Required files for extraction: this module, types/run declarations and its JSON. Enable
resolveJsonModule. Evidence: docs/port/features/observation-blobs.md and resource-effects.md.
The source observe method is extracted from hash-pinned Dungeon.java into a Java oracle with
unchanged BArray; Level/Scene neighbors supply inputs, not production game implementations.
Full level switching, fog rendering, persistence and manual browser acceptance remain open.
