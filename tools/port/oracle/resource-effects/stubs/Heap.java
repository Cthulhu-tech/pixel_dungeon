package com.watabou.pixeldungeon.items;
import port.oracle.ResourceOracle;
public class Heap {
  public final ItemSprite sprite=new ItemSprite();
  public static void burnFX(int pos){ResourceOracle.event("burnFX:"+pos);}
  public static class ItemSprite {public void drop(){ResourceOracle.event("dropPlayback");}}
}
