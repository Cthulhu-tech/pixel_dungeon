package com.watabou.utils;
/** Test-only signature boundary for compiling the unchanged Actor source. */
public interface Bundlable {
    void storeInBundle(Bundle bundle);
    void restoreFromBundle(Bundle bundle);
}
