package android.util;

import java.util.HashMap;
/** Test-only keyed-lookup boundary; no iteration or Android implementation is claimed. */
public final class SparseArray<T> {
    private final HashMap<Integer,T> values = new HashMap<>();
    public void put(int key, T value) { values.put(key, value); }
    public T get(int key) { return values.get(key); }
    public void remove(int key) { values.remove(key); }
    public void clear() { values.clear(); }
}
