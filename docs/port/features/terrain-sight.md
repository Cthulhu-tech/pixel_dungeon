# P02/P03/P04 — terrain state and Level sight

Checkpoint: `93ceeb7c68bfe875909c25644a2a2229b069a108`. Baseline remains
`ce7f241515fd5c040fcf18b4beb5b7a49d9d535f`. This details PLAN, not a second task queue.

| Original | Target / verified scope |
| --- | --- |
| Terrain.java, blob 24e0f646968cca87bf9e41e2efb83adf08304f35 | grid/terrain.ts + assets/terrain.json: constants, all 256 flags slots, discover switch |
| Level.java, blob c92488406814f6fb270c77799213200b8a72decb | TerrainGrid: buildFlagMaps, getWaterTile, destroy, cleanWalls, set |
| Level.java, same blob | LevelSight: updateFieldOfView; existing gridDistance reused |
| Painter.java, blob fd0d43b1658b6e994e9ae8f0de17a78ee713e023 | TerrainGrid.paint: first set overload |
| ShadowCaster.java, blob 566fc3b7725ec80d773b2571df4b7491e16b1ba0 | Existing GridShadowCaster, now composed with Level sight |

The Java oracle compiles full unchanged Terrain and ShadowCaster. Selected Level and Painter
methods are extracted verbatim from hash-checked original files into an explicit test host.
No TS result supplies expected output. Level constants/neighbor declarations are likewise
extracted from the source. Dummy actors/mobs/heaps only provide input/query logs; they are not
production replacements. Hashes guard the complete source, not a hand-edited reference copy.

## Preserved behavior

TerrainGrid alone owns terrain and nine derived masks. Runtime map ownership transfers at
construction; read ports borrow masks, snapshots are detached. Build clears passable/avoid on
outer rows/columns, then stitches water and pit art IDs. Set writes map before flags and does
not reapply boundary clamping. Water in set uses the ID predicate, while build uses LIQUID;
unused ID64 demonstrates the distinction. Destroy checks adjacent water in original order.
No implicit clean/FOV/turn updates are introduced. Existing doors drive this owner through ports.

LevelSight is per-level, reuses its output between actors and uses the real ported caster.
Blindness/Shadows/alive checks preserve short circuit and repeated alive queries. Sensing
intersects the ENTIRE FOV with discoverable; Java boolean &= still reads the right operand
when the left bit is false. MindVision creature neighborhoods and Awareness heaps are revealed
AFTER that intersection. Huntress reveals only mobs at distance2. Neighbor write order and
partial writes before bounds errors match. Dead actors retain original local sense behavior.

## Local evidence (full checkout, not reconstructed file subset)

Source/dependencies came from GitHub CI run36250243190 artifact10908891344 for the exact
checkpoint. ZIP SHA256: `93f157ac6672e2bd50214fe4a9b0b0f5dd62c1da887fcc4a17215dab390676dd`.
Bundle/tar hashes verified against included manifest; checkout HEAD equals checkpoint.
Node22.16.0, npm10.9.2, JDK21.0.11, installed TypeScript6.0.3/Vite8.3.1.
No local fresh npm install/ci or browser execution is claimed.

- Terrain suite: 6/6 PASS, 357 sequences /2214 original-Java checkpoints; hashes cover full
  map plus all nine masks, including partial errors. Full 256-entry data table matches Java.
- Level sight: 6/6 PASS, 2608 original-Java cases; all1024 output cells and ordered queries.
- Integration checks use real TerrainGrid/GridDoors/GridShadowCaster, not dummy replacements.
- Full checkpoint commands/results are maintained in STATUS.md; suites overlap, totals are
  not percentages or exhaustive coverage of IEEE/int32 values or every possible world.

Commands: npm run test:parity:terrain; npm run test:parity:level-sight;
npm run build; npm run check:boundaries; npm run check:extraction:kernel.

To reproduce content, compile TerrainData.java with pinned Terrain.java into ignored tmp,
run port.oracle.TerrainData, pretty-print its JSON with two-space indentation and a final newline.
The parity suite independently rebuilds and compares it. This is source parity, not an authored
JSON schema validator. No shader, original asset bytes, source Java or dependencies were changed.

## Limits

This does not finish full Level, Dungeon.observe, visited/mapped saves, terrain texts, level
builders, traps/press, real Hero/Mob/Item composition or browser presentation. Keep full
Level.java/P03/P04 unverified. Source-map file aggregation remains P00.2; the table above is
symbol evidence. A successful build is not visual/input/audio parity.
