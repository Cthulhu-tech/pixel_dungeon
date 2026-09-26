package com.watabou.utils;

import java.util.HashMap;
/** Test-only primitive field bag, NOT a source save codec. Missing fields fail explicitly. */
public final class Bundle {
    private final HashMap<String,Number> values = new HashMap<>();
    public void put(String key, float value) { values.put(key, value); }
    public void put(String key, int value) { values.put(key, value); }
    public float getFloat(String key) { return values.get(key).floatValue(); }
    public int getInt(String key) { return values.get(key).intValue(); }
}
