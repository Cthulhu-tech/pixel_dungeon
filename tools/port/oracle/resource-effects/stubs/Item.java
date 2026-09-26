package com.watabou.pixeldungeon.items;
import com.watabou.pixeldungeon.actors.hero.Belongings.Backpack;
import port.oracle.ResourceOracle;
public class Item {
  public Item detach(Backpack backpack){ResourceOracle.event("detachItem:"+backpack.owner+":"+getClass().getSimpleName());backpack.item=null;return this;}
  public boolean collect(Backpack backpack){ResourceOracle.event("collect:"+backpack.owner+":"+getClass().getSimpleName());if(backpack.accept){backpack.item=this;return true;}return false;}
  @Override public String toString(){ResourceOracle.event("itemName:"+getClass().getSimpleName());return getClass().getSimpleName();}
}
