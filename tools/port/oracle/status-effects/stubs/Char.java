package com.watabou.pixeldungeon.actors;
import java.util.*;
import com.watabou.pixeldungeon.actors.buffs.*;
import port.oracle.StatusOracle;
public class Char extends Actor {
  public int index,pos=33,invisible=0,viewDistance=8;
  public boolean paralysed=false,rooted=false,flying=false,alive=true;
  public LinkedHashSet<Buff> effects=new LinkedHashSet<>();
  public HashSet<Class<?>> blocked=new HashSet<>();
  public Char(int index){this.index=index;}
  public HashSet<Class<?>> immunities(){StatusOracle.event("immunities:"+index);return blocked;}
  public void add(Buff b){effects.add(b);StatusOracle.event("add:"+index+":"+StatusOracle.key(b)+":"+flags());}
  public void remove(Buff b){effects.remove(b);StatusOracle.event("remove:"+index+":"+StatusOracle.key(b)+":"+flags());}
  public <T extends Buff>T buff(Class<T> c){StatusOracle.event("find:"+index+":"+c.getSimpleName());for(Buff b:effects)if(c.isInstance(b))return c.cast(b);return null;}
  public boolean isAlive(){StatusOracle.event("alive:"+index);return alive;}
  public String flags(){return (paralysed?1:0)+","+(rooted?1:0)+","+(flying?1:0)+","+invisible+","+viewDistance;}
  public int visibleEnemies(){StatusOracle.event("enemies");return StatusOracle.enemies;}
}
