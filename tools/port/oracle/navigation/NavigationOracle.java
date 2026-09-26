package port.oracle;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

/** Provides inputs, observes queries, and delegates geometry to the unchanged PathFinder. */
public final class NavigationOracle {
    public static final ArrayList<String> events = new ArrayList<>();
    public static String usedMask = "-";
    private static boolean[] mask(String bits) {
        boolean[] value = new boolean[bits.length()];
        for (int i = 0; i < bits.length(); i++) value[i] = bits.charAt(i) == '1';
        return value;
    }
    public static String bits(boolean[] flags) {
        StringBuilder b = new StringBuilder(flags.length);
        for (boolean flag : flags) b.append(flag ? '1' : '0');
        return b.toString();
    }
    public static void main(String[] ignored) throws Exception {
        try (BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            for (String line; (line = input.readLine()) != null;) {
                String[] f = line.split("\\|", -1);
                if (f.length != 9) throw new IllegalArgumentException("Expected nine fields");
                int from = Integer.parseInt(f[1]), to = Integer.parseInt(f[2]), flags = Integer.parseInt(f[3]);
                boolean[] pass = mask(f[4]), visible = mask(f[6]); Level.avoid = mask(f[5]);
                Actor.present = mask(f[7]); Actor.members.clear();
                if (!f[8].isEmpty()) for (String pos : f[8].split(",")) {
                    Actor.members.add(pos.equals("n") ? new Actor() : new Char(Integer.parseInt(pos), 0));
                }
                events.clear(); usedMask = "-";
                java.lang.reflect.Field scratch = NavigationReference.class.getDeclaredField("passable");
                scratch.setAccessible(true); scratch.set(null, new boolean[1024]);
                com.watabou.utils.PathFinder.setMapSize(1, 1);
                com.watabou.utils.PathFinder.setMapSize(32, 32);
                Char character = new Char(from, flags);
                String result;
                try {
                    result = "s:" + (f[0].equals("find")
                        ? NavigationReference.findPath(character, from, to, pass, visible)
                        : NavigationReference.flee(character, from, to, pass, visible));
                } catch (ArrayIndexOutOfBoundsException error) {
                    result = "error:array-bounds";
                }
                System.out.println(result + "\t" + String.join(",", events) + "\t" + usedMask);
            }
        }
    }
}

/** Input-only actor collection/lookup, not the game scheduler. */
class Actor {
    static final ArrayList<Actor> members = new ArrayList<>();
    static boolean[] present;
    static final Object FOUND = new Object();
    static Object findChar(int cell) {
        NavigationOracle.events.add("char:" + cell);
        return present[cell] ? FOUND : null;
    }
    static Iterable<Actor> all() {
        NavigationOracle.events.add("all");
        return members;
    }
}
class Char extends Actor {
    final int pos;
    final boolean flying;
    private final int flags;
    Char(int pos, int flags) { this.pos = pos; this.flags = flags; this.flying = (flags & 1) != 0; }
    Object buff(Class<?> kind) {
        NavigationOracle.events.add("buff:" + kind.getSimpleName());
        return (flags & (kind == Amok.class ? 2 : 4)) != 0 ? FOUND : null;
    }
}
final class Amok {}
final class Rage {}

/** Observability binding only; the selected source still calls PathFinder unchanged. */
final class PathFinder {
    static int getStep(int from, int to, boolean[] passable) {
        NavigationOracle.events.add("step"); NavigationOracle.usedMask = NavigationOracle.bits(passable);
        return com.watabou.utils.PathFinder.getStep(from, to, passable);
    }
    static int getStepBack(int current, int threat, boolean[] passable) {
        NavigationOracle.events.add("back"); NavigationOracle.usedMask = NavigationOracle.bits(passable);
        return com.watabou.utils.PathFinder.getStepBack(current, threat, passable);
    }
}
