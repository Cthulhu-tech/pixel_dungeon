package com.watabou.pixeldungeon.levels;
import com.watabou.pixeldungeon.actors.Char;
import com.watabou.pixeldungeon.items.*;
import port.oracle.ResourceOracle;
public class Level {
  public static boolean[] water=new boolean[1024],flamable=new boolean[1024];
  public int viewDistance=8;
  public void press(int pos,Char ch){ResourceOracle.event("press:"+pos);}
  public Heap drop(Item item,int cell){ResourceOracle.event("drop:"+cell+":"+item.getClass().getSimpleName());return new Heap();}
}
