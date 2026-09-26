package com.watabou.utils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.stream.Collectors;

/** Exercises unmodified Random.java; exports observed HashMap order, never invents it. */
public final class RandomCollectionsOracle {
    private static Integer[] integers(String csv) {
        if (csv.isEmpty()) return new Integer[0];
        return Arrays.stream(csv.split(",", -1))
            .map(v -> v.equals("null") ? null : Integer.valueOf(v)).toArray(Integer[]::new);
    }

    private static String csv(Integer[] values) {
        return Arrays.stream(values).map(String::valueOf).collect(Collectors.joining(","));
    }

    public static void main(String[] ignored) throws Exception {
        try (BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            for (String line; (line = input.readLine()) != null;) {
                String[] f = line.split("\t", -1);
                if (f.length != 6) throw new IllegalArgumentException("Expected six fields");
                Integer[] first = integers(f[1]);
                Integer[] second = integers(f[2]);
                Integer[] order = new Integer[0];
                Math.reset(f[5].isEmpty() ? new String[0] : f[5].split(","));
                String result;
                try {
                    switch (f[0]) {
                        case "collectionIndex": result = "v:" + Random.index(Arrays.asList(first)); break;
                        case "oneOf": result = "v:" + Random.oneOf(first); break;
                        case "element": result = "v:" + Random.element(first); break;
                        case "elementWithin": result = "v:" + Random.element(first, Integer.parseInt(f[4])); break;
                        case "collectionElement": result = "v:" + Random.element(Arrays.asList(first)); break;
                        case "shuffle": Random.shuffle(first); result = "ok"; break;
                        case "shufflePair": Random.shuffle(first, second); result = "ok"; break;
                        case "shuffleSame": Random.shuffle(first, first); result = "ok"; break;
                        case "weightedKey":
                            String[] weights = f[3].isEmpty() ? new String[0] : f[3].split(",");
                            if (weights.length != first.length) throw new IllegalArgumentException("Weight count mismatch");
                            HashMap<Integer, Float> map = new HashMap<>();
                            for (int i = 0; i < first.length; i++) map.put(first[i], Float.parseFloat(weights[i]));
                            order = map.keySet().toArray(new Integer[0]);
                            result = "v:" + Random.chances(map);
                            break;
                        default: throw new IllegalArgumentException("Unknown method: " + f[0]);
                    }
                } catch (ArrayIndexOutOfBoundsException error) {
                    result = "error:array-bounds";
                }
                System.out.println(result + "\t" + csv(first) + "\t" + csv(second)
                    + "\t" + Math.consumed() + "\t" + csv(order));
            }
        }
    }
}
