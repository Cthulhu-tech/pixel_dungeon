package com.watabou.pixeldungeon.actors.hero;
import com.watabou.pixeldungeon.items.Item;
import port.oracle.ResourceOracle;
public class Belongings {
  public final Backpack backpack;
  public Belongings(Hero hero){backpack=new Backpack(hero.index);}
  public Item randomUnequipped(){ResourceOracle.event("item:"+backpack.owner);return backpack.item;}
  public void discharge(){ResourceOracle.event("discharge:"+backpack.owner);}
  public static class Backpack {public final int owner;public Item item;public boolean accept=true;public Backpack(int index){owner=index;}}
}
