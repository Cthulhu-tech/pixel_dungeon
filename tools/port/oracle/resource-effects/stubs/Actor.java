package com.watabou.pixeldungeon.actors;
import com.watabou.utils.Bundle;
import port.oracle.ResourceOracle;
public class Actor {
  public static final float TICK=1f;
  public float time=0;
  protected void spend(float duration){time+=duration;ResourceOracle.event("spend:"+ResourceOracle.key(this)+":"+ResourceOracle.bits(duration));}
  protected void postpone(float duration){time=Math.max(time,ResourceOracle.now+duration);ResourceOracle.event("postpone:"+ResourceOracle.key(this)+":"+ResourceOracle.bits(duration));}
  protected void diactivate(){time=Float.MAX_VALUE;ResourceOracle.event("inactive:"+ResourceOracle.key(this));}
  public float cooldown(){ResourceOracle.event("cooldown:"+ResourceOracle.key(this));return time-ResourceOracle.now;}
  public boolean act(){return false;}
  public void storeInBundle(Bundle b){b.put("time",time);}
  public void restoreFromBundle(Bundle b){time=b.getFloat("time");}
}
