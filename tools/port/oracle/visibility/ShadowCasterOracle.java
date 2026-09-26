package port.oracle;

import com.watabou.pixeldungeon.mechanics.ShadowCaster;
import com.watabou.pixeldungeon.levels.Level;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/** Original shadow algorithm; the shared test Level supplies dimensions and blockers only. */
public final class ShadowCasterOracle {
    private static boolean[] mask(String bits) {
        boolean[] value = new boolean[bits.length()];
        for (int i = 0; i < bits.length(); i++) value[i] = bits.charAt(i) == '1';
        return value;
    }
    private static String bits(boolean[] value) {
        StringBuilder output = new StringBuilder(value.length);
        for (boolean cell : value) output.append(cell ? '1' : '0');
        return output.toString();
    }
    private static String cast(int x, int y, boolean[] output, int radius) {
        try { ShadowCaster.castShadow(x, y, output, radius); return "ok"; }
        catch (ArrayIndexOutOfBoundsException error) { return "error:array-bounds"; }
    }
    public static void main(String[] ignored) throws Exception {
        try (BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            for (String line; (line = input.readLine()) != null;) {
                String[] f = line.split("\\|", -1);
                if (f.length != 6) throw new IllegalArgumentException("Expected six fields");
                Level.losBlocking = mask(f[5]);
                boolean[] visible = new boolean[1024]; Arrays.fill(visible, Boolean.parseBoolean(f[4]));
                if (f[0].equals("alias")) visible = Level.losBlocking;
                if (f[0].equals("repeat")) cast(16, 16, visible, 8);
                String result = cast(Integer.parseInt(f[1]), Integer.parseInt(f[2]), visible, Integer.parseInt(f[3]));
                System.out.println(result + "\t" + bits(visible) + "\t" + bits(Level.losBlocking));
            }
        }
    }
}
