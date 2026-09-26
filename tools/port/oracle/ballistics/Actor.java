package com.watabou.pixeldungeon.actors;

import java.util.ArrayList;

/** Test-only occupancy boundary; records exactly when the original queries actors. */
public final class Actor {
    private static final Object PRESENT = new Object();
    public static boolean[] occupied;
    public static final ArrayList<Integer> queries = new ArrayList<>();
    public static Object findChar(int cell) {
        queries.add(cell);
        return occupied[cell] ? PRESENT : null;
    }
}
