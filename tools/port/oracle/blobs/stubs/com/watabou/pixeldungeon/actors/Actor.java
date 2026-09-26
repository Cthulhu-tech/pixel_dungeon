package com.watabou.pixeldungeon.actors;
import com.watabou.utils.Bundle;
public class Actor {
  public static final float TICK=1f;
  public float time;
  public void spend(float value){time+=value;}
  public boolean act(){return false;}
  public void storeInBundle(Bundle b){}
  public void restoreFromBundle(Bundle b){}
}
