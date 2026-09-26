package port.oracle;

import com.watabou.utils.PathFinder;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.stream.Collectors;

/** No rewritten algorithm: calls the pinned original and exports its full distance buffer. */
public final class PathFinderOracle {
    private static String path(PathFinder.Path path) {
        return path == null ? "p:null" : "p:" + path.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    public static void main(String[] ignored) throws Exception {
        try (BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            for (String line; (line = input.readLine()) != null;) {
                String[] f = line.split("\\|", -1);
                if (f.length != 7) throw new IllegalArgumentException("Expected seven fields");
                int width = Integer.parseInt(f[1]), height = Integer.parseInt(f[2]);
                int from = Integer.parseInt(f[3]), to = Integer.parseInt(f[4]), limit = Integer.parseInt(f[5]);
                boolean[] passable = new boolean[f[6].length()];
                for (int i = 0; i < passable.length; i++) passable[i] = f[6].charAt(i) == '1';
                // A different area resets the original static buffers for an independent case.
                PathFinder.setMapSize(1, 1);
                PathFinder.setMapSize(width, height);
                String result;
                try {
                    switch (f[0]) {
                        case "find": result = path(PathFinder.find(from, to, passable)); break;
                        case "step": result = "s:" + PathFinder.getStep(from, to, passable); break;
                        case "back": result = "s:" + PathFinder.getStepBack(from, to, passable); break;
                        case "same":
                            PathFinder.buildDistanceMap(to, passable, limit);
                            result = path(PathFinder.find(to, to, passable)); break;
                        case "reshape":
                            PathFinder.setMapSize(height, width);
                            PathFinder.buildDistanceMap(to, passable, limit); result = "map"; break;
                        case "resize":
                            PathFinder.setMapSize(2, 3);
                            PathFinder.setMapSize(width, height);
                            PathFinder.buildDistanceMap(to, passable, limit); result = "map"; break;
                        case "unlimited":
                            java.lang.reflect.Method method = PathFinder.class.getDeclaredMethod("buildDistanceMap", int.class, boolean[].class);
                            method.setAccessible(true); method.invoke(null, to, passable); result = "map"; break;
                        case "map": PathFinder.buildDistanceMap(to, passable, limit); result = "map"; break;
                        default: throw new IllegalArgumentException("Unknown operation: " + f[0]);
                    }
                } catch (ArrayIndexOutOfBoundsException error) {
                    result = "error:array-bounds";
                }
                String distances = Arrays.stream(PathFinder.distance).mapToObj(String::valueOf).collect(Collectors.joining(","));
                System.out.println(result + "\t" + distances);
            }
        }
    }
}
