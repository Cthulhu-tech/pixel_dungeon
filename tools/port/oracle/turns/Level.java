package com.watabou.pixeldungeon.levels;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import com.watabou.pixeldungeon.actors.mobs.Mob;
import com.watabou.pixeldungeon.actors.blobs.Blob;
/** Test-only ordered level inputs; not generation or production Level. */
public final class Level {
    public static final int LENGTH = 1024;
    public final HashSet<Mob> mobs = new LinkedHashSet<>();
    public final LinkedHashMap<Integer,Blob> blobs = new LinkedHashMap<>();
}
