package com.watabou.utils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/** Test-only host for the unmodified, hash-checked original Random.java. */
public final class RandomOracle {
    private static String floatBits(float value) {
        return "f:" + Integer.toUnsignedString(Float.floatToRawIntBits(value));
    }

    private static String evaluate(String method, String[] args) {
        switch (method) {
            case "cast": return "i:" + (int)Double.parseDouble(args[0]);
            case "float": return floatBits(Random.Float());
            case "floatTo": return floatBits(Random.Float(Float.parseFloat(args[0])));
            case "floatBetween": return floatBits(Random.Float(Float.parseFloat(args[0]), Float.parseFloat(args[1])));
            case "intTo": return "i:" + Random.Int(Integer.parseInt(args[0]));
            case "intBetween": return "i:" + Random.Int(Integer.parseInt(args[0]), Integer.parseInt(args[1]));
            case "intRange": return "i:" + Random.IntRange(Integer.parseInt(args[0]), Integer.parseInt(args[1]));
            case "normalIntRange": return "i:" + Random.NormalIntRange(Integer.parseInt(args[0]), Integer.parseInt(args[1]));
            case "weightedIndex":
                float[] weights = new float[args.length];
                for (int i = 0; i < args.length; i++) weights[i] = Float.parseFloat(args[i]);
                return "i:" + Random.chances(weights);
            default: throw new IllegalArgumentException("Unknown oracle method: " + method);
        }
    }

    public static void main(String[] ignored) throws Exception {
        try (BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            for (String line; (line = input.readLine()) != null;) {
                String[] fields = line.split("\t", -1);
                if (fields.length != 3) throw new IllegalArgumentException("Expected method, arguments, draws");
                String[] args = fields[1].isEmpty() ? new String[0] : fields[1].split(",");
                String[] draws = fields[2].isEmpty() ? new String[0] : fields[2].split(",");
                Math.reset(draws);
                String result;
                try {
                    result = evaluate(fields[0], args);
                } catch (ArrayIndexOutOfBoundsException error) {
                    result = "error:array-bounds";
                }
                System.out.println(result + "\t" + Math.consumed());
            }
        }
    }
}

/** Same-package binding shadows java.lang.Math ONLY inside this isolated oracle. */
final class Math {
    private static double[] values;
    private static int position;

    static void reset(String[] input) {
        values = new double[input.length];
        position = 0;
        for (int i = 0; i < input.length; i++) {
            values[i] = Double.parseDouble(input[i]);
            if (!Double.isFinite(values[i]) || values[i] < 0 || values[i] >= 1) {
                throw new IllegalArgumentException("Invalid random tape value");
            }
        }
    }

    public static double random() {
        if (position >= values.length) throw new IllegalStateException("Oracle draw tape exhausted");
        return values[position++];
    }

    static int consumed() { return position; }
}
