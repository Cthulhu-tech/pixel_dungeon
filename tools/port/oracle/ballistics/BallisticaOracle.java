package port.oracle;

import com.watabou.pixeldungeon.mechanics.Ballistica;
import com.watabou.pixeldungeon.levels.Level;
import com.watabou.pixeldungeon.actors.Actor;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.stream.Collectors;

/** Calls the byte-identical algorithm with explicit test-only world inputs. */
public final class BallisticaOracle {
    private static boolean[] mask(String bits) {
        boolean[] value = new boolean[bits.length()];
        for (int i = 0; i < bits.length(); i++) value[i] = bits.charAt(i) == '1';
        return value;
    }
    private static String cast(int from, int to, boolean magic, boolean hitChars) {
        try { return "cell:" + Ballistica.cast(from, to, magic, hitChars); }
        catch (ArrayIndexOutOfBoundsException error) { return "error:array-bounds"; }
    }
    public static void main(String[] ignored) throws Exception {
        try (BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            for (String line; (line = input.readLine()) != null;) {
                String[] f = line.split("\\|", -1);
                if (f.length != 9) throw new IllegalArgumentException("Expected nine fields");
                Level.passable = mask(f[5]); Level.avoid = mask(f[6]); Level.losBlocking = mask(f[7]);
                Actor.occupied = mask(f[8]); Actor.queries.clear();
                Ballistica.trace = new int[32]; Ballistica.distance = 0;
                if (f[0].equals("repeat")) cast(33, 45, false, false);
                String result = cast(Integer.parseInt(f[1]), Integer.parseInt(f[2]), Boolean.parseBoolean(f[3]), Boolean.parseBoolean(f[4]));
                String trace = Arrays.stream(Ballistica.trace).mapToObj(String::valueOf).collect(Collectors.joining(","));
                String queries = Actor.queries.stream().map(String::valueOf).collect(Collectors.joining(","));
                System.out.println(result + "\t" + Ballistica.distance + "\t" + trace + "\t" + queries);
            }
        }
    }
}
