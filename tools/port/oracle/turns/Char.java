package com.watabou.pixeldungeon.actors;

import java.util.HashSet;
import java.util.LinkedHashSet;
import com.watabou.pixeldungeon.actors.buffs.Buff;
/** Test-only character inputs used by original Actor instanceof/callback branches. */
public class Char extends ProbeActor {
    public int pos;
    public boolean alive = true;
    public final Sprite sprite = new Sprite();
    public final HashSet<Buff> attached = new LinkedHashSet<>();
    public Char(String name) { super(name); }
    public HashSet<Buff> buffs() { return attached; }
    public boolean isAlive() { return alive; }
    public static final class Sprite { public boolean isMoving; }
}
