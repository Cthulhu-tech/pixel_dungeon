package com.watabou.pixeldungeon.actors;
import port.oracle.BuffOracle;
/** Test-only clock port. Real scheduler integration is checked separately. */
public abstract class Actor {
    public float time;
    public abstract boolean act();
    protected void spend(float duration) {
        BuffOracle.event("spend:"+BuffOracle.id(this)+":"+Float.floatToIntBits(duration));
        time+=duration;
    }
    protected void postpone(float duration) {
        BuffOracle.event("postpone:"+BuffOracle.id(this)+":"+Float.floatToIntBits(duration));
        if(time<BuffOracle.now+duration)time=BuffOracle.now+duration;
    }
    protected void diactivate() {
        BuffOracle.event("deactivate:"+BuffOracle.id(this));time=Float.MAX_VALUE;
    }
}
