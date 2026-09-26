package com.watabou.pixeldungeon.actors;

import java.util.ArrayDeque;
import com.watabou.pixeldungeon.Dungeon;
import port.oracle.TurnOracle;
/** Scripted actor behavior is TEST INPUT, not an alternative scheduler or game actor. */
public class ProbeActor extends Actor {
    public final String name;
    public final ArrayDeque<String> actions = new ArrayDeque<>();
    public ProbeActor(String name) { this.name = name; }
    public void spendValue(float value) { spend(value); }
    public void postponeValue(float value) { postpone(value); }
    public float cooldownValue() { return cooldown(); }
    public void deactivateValue() { diactivate(); }
    @Override protected void onAdd() { TurnOracle.events.add("add(" + name + ")"); }
    @Override protected void onRemove() { TurnOracle.events.add("remove(" + name + ")"); }
    @Override protected boolean act() {
        TurnOracle.events.add("act(" + name + ")");
        if (++TurnOracle.actCalls > 10000) throw new IllegalStateException("Unbounded test action script");
        if (actions.isEmpty()) return false;
        String[] a = actions.removeFirst().split(",");
        switch (a[0]) {
            case "S": spend(Float.parseFloat(a[1])); if (a[3].equals("1")) next(); return a[2].equals("1");
            case "R": Actor.remove(this); return a[1].equals("1");
            case "K": spend(Float.parseFloat(a[1])); Dungeon.hero.alive = false; return a[2].equals("1");
            case "N": next(); return a[1].equals("1");
            case "A": Actor.add(TurnOracle.actors.get(a[1])); spend(Float.parseFloat(a[2])); return a[3].equals("1");
            case "M": ((Char)this).pos = Integer.parseInt(a[1]); spend(Float.parseFloat(a[2])); return a[3].equals("1");
            case "C": Actor.clear(); return a[1].equals("1");
            case "D": diactivate(); return a[1].equals("1");
            default: throw new IllegalArgumentException("Unknown scripted action " + a[0]);
        }
    }
}
