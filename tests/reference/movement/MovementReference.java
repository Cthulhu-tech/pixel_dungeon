/* Selected original methods. Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Sources: Char.java, Level.java, levels/features/Door.java at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Surrounding classes are test inputs. Source-token gate checks all six method bodies.
 */
package port.oracle;

class Char {
    public int pos;
    public boolean flying;
    public Sprite sprite = new Sprite();
    boolean vertigo;
    public Object buff(Class<?> type) { MovementOracle.event("buff"); return vertigo ? new Object() : null; }

    public void move( int step ) {
        if (Level.adjacent( step, pos ) && buff( Vertigo.class ) != null) {
            step = pos + Level.NEIGHBOURS8[Random.Int( 8 )];
            if (!(Level.passable[step] || Level.avoid[step]) || Actor.findChar( step ) != null) {
                return;
            }
        }
        if (Dungeon.level.map[pos] == Terrain.OPEN_DOOR) {
            Door.leave( pos );
        }
        pos = step;
        if (flying && Dungeon.level.map[pos] == Terrain.DOOR) {
            Door.enter( pos );
        }
        if (this != Dungeon.hero) {
            sprite.visible = Dungeon.visible[pos];
        }
    }

    public int distance( Char other ) {
        return Level.distance( pos, other.pos );
    }
}
class Level {
    static final int WIDTH = 32;
    static final int[] NEIGHBOURS8 = {+1, -1, +WIDTH, -WIDTH, +1+WIDTH, +1-WIDTH, -1+WIDTH, -1-WIDTH};
    static boolean[] passable, avoid, occupied;
    int[] map;
    HeapLookup heaps = new HeapLookup();
    static void set(int cell, int terrain) {
        MovementOracle.event("set:" + cell + ":" + terrain);
        Dungeon.level.map[cell] = terrain;
    }

    public static int distance( int a, int b ) {
        int ax = a % WIDTH;
        int ay = a / WIDTH;
        int bx = b % WIDTH;
        int by = b / WIDTH;
        return Math.max( Math.abs( ax - bx ), Math.abs( ay - by ) );
    }

    public static boolean adjacent( int a, int b ) {
        int diff = Math.abs( a - b );
        return diff == 1 || diff == WIDTH || diff == WIDTH + 1 || diff == WIDTH - 1;
    }
}
class Door {
    public static void enter( int pos ) {
        Level.set( pos, Terrain.OPEN_DOOR );
        GameScene.updateMap( pos );
        Dungeon.observe();
        if (Dungeon.visible[pos]) {
            Sample.INSTANCE.play( Assets.SND_OPEN );
        }
    }

    public static void leave( int pos ) {
        if (Dungeon.level.heaps.get( pos ) == null) {
            Level.set( pos, Terrain.DOOR );
            GameScene.updateMap( pos );
            Dungeon.observe();
        }
    }
}
class Terrain { static final int DOOR=5, OPEN_DOOR=6; }
class Vertigo { }
class Sprite { boolean visible = true; }
class Actor {
    static Object findChar(int cell) {
        MovementOracle.event("query:"+cell);
        return Level.occupied[cell] ? new Object() : null;
    }
}
class HeapLookup {
    Object get(int cell) {
        MovementOracle.event("heap:"+cell);
        return MovementOracle.heap ? this : null;
    }
}
class Dungeon {
    static Level level;
    static Char hero;
    static boolean[] visible;
    static void observe() {
        MovementOracle.event("observe:"+MovementOracle.subject.pos);
        if (MovementOracle.observeMode!=0) java.util.Arrays.fill(visible, MovementOracle.observeMode==1);
    }
}
class GameScene { static void updateMap(int cell) { MovementOracle.event("update:"+cell); } }
class Assets { static final String SND_OPEN="open"; }
class Sample {
    static final Sample INSTANCE=new Sample();
    void play(String id) { MovementOracle.event("sound:"+id); }
}
class Random {
    static int Int(int max) { MovementOracle.event("random:"+max); return MovementOracle.roll; }
}
