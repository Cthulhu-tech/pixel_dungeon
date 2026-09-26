package com.watabou.pixeldungeon;
import com.watabou.pixeldungeon.actors.hero.Hero;
import com.watabou.pixeldungeon.levels.Level;
import port.oracle.ResourceOracle;
public class Dungeon {
  public static Hero hero;
  public static Level level;
  public static int depth=17;
  public static void observe(){ResourceOracle.event("observe:"+ResourceOracle.flags());}
  public static void fail(String text){ResourceOracle.event("fail:"+text);}
}
