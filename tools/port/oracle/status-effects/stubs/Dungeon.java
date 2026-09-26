package com.watabou.pixeldungeon;
import com.watabou.pixeldungeon.actors.Char;
import port.oracle.StatusOracle;
public class Dungeon {
  public static Char hero;
  public static Level level;
  public static void observe(){StatusOracle.event("observe:"+StatusOracle.flags());}
  public static class Level {
    public int viewDistance;
    public Level(int distance){viewDistance=distance;}
    public void press(int pos,Char ch){StatusOracle.event("press:"+pos+":"+ch.flags()+":"+StatusOracle.members(ch));}
  }
}
