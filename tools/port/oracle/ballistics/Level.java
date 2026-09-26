package com.watabou.pixeldungeon.levels;

/** Test-only input boundary, NOT the production Level implementation.
 * Dimensions copied from pinned Level.java (32x32); flags are supplied by the fixture. */
public final class Level {
    public static final int WIDTH = 32;
    public static final int HEIGHT = 32;
    public static boolean[] passable;
    public static boolean[] avoid;
    public static boolean[] losBlocking;
}
