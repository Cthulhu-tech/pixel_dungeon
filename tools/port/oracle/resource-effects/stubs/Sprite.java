package com.watabou.pixeldungeon.actors;
import com.watabou.utils.PointF;
import port.oracle.ResourceOracle;
public class Sprite {
  final Char owner;public boolean visible=true;
  public Sprite(Char ch){owner=ch;}
  public PointF center(){ResourceOracle.event("center:"+owner.index);return new PointF(12.5f,19.25f);}
  public int blood(){ResourceOracle.event("blood:"+owner.index);return 123456;}
  public Sprite emitter(){ResourceOracle.event("emitter:"+owner.index);return this;}
  public void burst(Object factory,int count){ResourceOracle.event("burst:"+owner.index+":"+count);}
}
