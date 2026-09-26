package com.watabou.pixeldungeon.actors;
import java.util.ArrayList;
import java.util.HashSet;
import com.watabou.pixeldungeon.actors.buffs.Buff;
import port.oracle.BuffOracle;
/** Test-only target port, NOT the game's Char or production buff membership policy. */
public class Char {
    public final int id;
    public final ArrayList<Buff> members=new ArrayList<>();
    public Char(int id){this.id=id;}
    public HashSet<Class<?>> immunities(){
        BuffOracle.event("immune:"+id);
        HashSet<Class<?>> result=new HashSet<>();
        if((BuffOracle.flags&(1<<id))!=0)result.add(BuffOracle.Probe.class);
        return result;
    }
    public void add(Buff buff){
        BuffOracle.event("add:"+id+":"+BuffOracle.id(buff)+":"+buff.target.id);
        if(!members.contains(buff)){members.add(buff);buff.time+=BuffOracle.now;}
        if((BuffOracle.flags&4)!=0)throw new IllegalStateException("append");
        if((BuffOracle.flags&8)!=0)throw new AssertionError("fatal");
    }
    public void remove(Buff buff){BuffOracle.event("remove:"+id+":"+BuffOracle.id(buff));members.remove(buff);}
    public <T extends Buff> T buff(Class<T> type){
        BuffOracle.event("find:"+id);
        for(Buff b:members)if(type.isInstance(b))return type.cast(b);
        return null;
    }
}
