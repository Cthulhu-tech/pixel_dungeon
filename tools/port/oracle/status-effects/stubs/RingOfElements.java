package com.watabou.pixeldungeon.items.rings;
import com.watabou.pixeldungeon.actors.buffs.Buff;
import port.oracle.StatusOracle;
public class RingOfElements {
  public static class Resistance extends Buff {
    public float factor;
    public Resistance(float factor){this.factor=factor;}
    public float durationFactor(){StatusOracle.event("factor");return factor;}
  }
}
