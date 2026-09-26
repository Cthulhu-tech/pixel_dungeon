package com.watabou.pixeldungeon.actors;
import com.watabou.utils.Bundle;
import port.oracle.StatusOracle;
public class Actor {
  public static final float TICK=1f;
  public float time=0;
  protected void spend(float duration){time+=duration;StatusOracle.event("spend:"+StatusOracle.key(this)+":"+StatusOracle.bits(duration));}
  protected void postpone(float duration){time=Math.max(time,StatusOracle.now+duration);StatusOracle.event("postpone:"+StatusOracle.key(this)+":"+StatusOracle.bits(duration));}
  protected void diactivate(){time=Float.MAX_VALUE;StatusOracle.event("inactive:"+StatusOracle.key(this));}
  public boolean act(){return false;}
  public void storeInBundle(Bundle b){b.put("time",time);}
  public void restoreFromBundle(Bundle b){time=b.getFloat("time");}
}
