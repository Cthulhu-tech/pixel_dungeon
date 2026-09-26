# P03/P06 — observation memory and base Blob field

Source baseline ce7f241515fd5c040fcf18b4beb5b7a49d9d535f is unchanged.
Parent checkpoint: 3c7d979a2e9b22d801b91a92d69b4c7249a85879.
This is evidence for PLAN, not a new queue or a claim of a completed playable game.

## Source mapping

| Source | Owner / implementation |
| --- | --- |
| Dungeon.java, blob961d04ca35a903486cc9bfd2e1386cf0c0c08813, observe | run/RunObservation |
| Level.visited/mapped and BArray.or, blobdec22b52f08c99a0b9b2fd3953b6169960726a5e | grid/LevelExploration |
| actors/blobs/Blob.java, blobd53cbdec9e0915375e25a53efebb8ead610bf70c | effects/BlobField: act/evolve/seed/clear/store/restore/trim |

RunObservation owns the stable current hero visibility, separate from LevelSight's reusable
actor FOV scratch. LevelExploration owns a level's visited and mapped runtime buffers.
Observation calls updateHeroFieldOfView -> full-range-checked copy -> visited OR -> afterObserve.
No active level is an early return. Failure phases and Java short-circuit reads are retained;
partial visitation before a bounds error is not rolled back. Mapped cells are not automatically
visited or visible. No Phaser imports, visual listeners or second writable map were added.

BlobField owns current/off concentration buffers and volume. The scheduler owns its clock.
Act spends one source TICK before checking volume; evolution sums cardinal neighbors with
Java int32 overflow and truncation, then swaps buffers. Border/off history, non-positive volume
and partial failures are deliberately not normalized away. Subclasses can extend evolve before
the source swap. Save projection emits only the source positive bounding range, or no fields;
restore remains additive, including original loadedMapSize resizing. This is decoded own-state
support, NOT full Bundle/import compatibility. Clock/id persistence remains with turns.

## Independent tests

ObservationOracle extracts the actual observe method from hash-pinned Dungeon.java and compiles
it with unchanged BArray.java. The neighboring Level/Scene provide scripted inputs and event
records only. No expected values come from TypeScript. Blob oracle compiles full unchanged
Blob.java and BArray.java; explicit Actor/Level/Bundle/Emitter neighbors are test adapters.
The full original Actor is not claimed by that oracle; separate integration uses real TurnScheduler.
Original fixed dimensions32x32 and TICK1 are tested; arbitrary dimensions are not a parity claim.

Local full checkout / actual Node22.16.0, npm10.9.2, JDK21.0.11, installed TS6.0.3:
- observation:5/5 PASS,420 sequences /2520 original-Java checkpoints.
- blobs:6/6 PASS,320 sequences /2894 original-Java checkpoints.
- kernel:144/144 PASS,0 skipped; contracts:53/53 PASS (overlapping sets).
- full strict build, boundaries, typecheck:run, effects/kernel extraction:PASS.
- Real integrations: hero visibility survives another actor FOV; visited persists after moving;
  real terrain blocks gas; real scheduler advances gas ticks without a new loop.
No browser was started. The existing bundle-size warning is not suppressed.

Commands: npm run test:parity:observation; npm run test:parity:blobs;
npm run test:kernel; npm run test:contracts; npm run build; npm run check:boundaries;
npm run typecheck:run; npm run check:extraction:effects; npm run check:extraction:kernel.

## Boundaries still open

afterObserve is a synchronous port, not implemented fog rendering. Concrete gas/fire interactions,
Blob static class factory/use/tileDesc, production actor/item composition, full saved-game format,
level creation and manual visual acceptance remain separate unfinished tasks. The compiled
original Blob contains those methods but this suite does not invoke or claim their parity.
Full source-map aggregation is P00.2; do not mark all Dungeon/Level/Blob VERIFIED.
