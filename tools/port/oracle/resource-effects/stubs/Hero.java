package com.watabou.pixeldungeon.actors.hero;
import com.watabou.pixeldungeon.actors.Char;
import com.watabou.pixeldungeon.actors.buffs.Hunger;
import port.oracle.ResourceOracle;
public class Hero extends Char {
  public interface Doom {void onDeath();}
  public boolean weakened=false;
  public HeroClass heroClass=HeroClass.WARRIOR;
  public Belongings belongings=new Belongings(this);
  public Hero(int index){super(index);}
  public boolean isStarving(){ResourceOracle.event("starving:"+index);Hunger h=buff(Hunger.class);return h!=null&&h.isStarving();}
  public void interrupt(){ResourceOracle.event("interrupt:"+index+":"+ResourceOracle.ownAll());}
  public int visibleEnemies(){ResourceOracle.event("enemies");return ResourceOracle.enemies;}
}
