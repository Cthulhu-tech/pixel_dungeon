package com.watabou.pixeldungeon.items.rings;
import com.watabou.pixeldungeon.actors.buffs.Buff;
import port.oracle.ResourceOracle;
public class RingOfElements {public static class Resistance extends Buff {public float factor;public float durationFactor(){ResourceOracle.event("factor");return factor;}}}
