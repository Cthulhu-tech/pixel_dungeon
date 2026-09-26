package com.watabou.pixeldungeon.actors;
import java.util.*;
import com.watabou.pixeldungeon.actors.buffs.*;
import com.watabou.pixeldungeon.actors.hero.Hero;
import port.oracle.ResourceOracle;
public class Char extends Actor {
  public int index,pos=33,HP=10,HT=10,invisible=0,viewDistance=8;
  public boolean paralysed=false,rooted=false,flying=false;
  public Sprite sprite=new Sprite(this);
  public LinkedHashSet<Buff> effects=new LinkedHashSet<>();
  public HashSet<Class<?>> blocked=new HashSet<>();
  public Char(int index){this.index=index;}
  public HashSet<Class<?>> immunities(){ResourceOracle.event("immunities:"+index);return blocked;}
  public void add(Buff b){effects.add(b);ResourceOracle.event("add:"+index+":"+ResourceOracle.key(b)+":"+flags());}
  public void remove(Buff b){effects.remove(b);ResourceOracle.event("remove:"+index+":"+ResourceOracle.key(b)+":"+flags());}
  public <T extends Buff>T buff(Class<T> c){ResourceOracle.event("find:"+index+":"+c.getSimpleName());for(Buff b:effects)if(c.isInstance(b))return c.cast(b);return null;}
  public <T extends Buff>HashSet<T> buffs(Class<T> c){ResourceOracle.event("filter:"+index+":"+c.getSimpleName());HashSet<T> result=new LinkedHashSet<>();for(Buff b:effects)if(c.isInstance(b))result.add(c.cast(b));return result;}
  public boolean isAlive(){ResourceOracle.event("alive:"+index);return HP>0;}
  public void damage(int amount,Object src){ResourceOracle.event("damage:"+index+":"+amount+":"+ResourceOracle.key((Actor)src));HP-=amount;if(ResourceOracle.doom&&this instanceof Hero&&HP<=0&&src instanceof Hero.Doom)((Hero.Doom)src).onDeath();}
  public String flags(){return HP+","+HT+","+(paralysed?1:0)+","+(rooted?1:0)+","+(flying?1:0)+","+invisible+","+viewDistance;}
}
