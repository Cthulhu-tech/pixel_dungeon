package com.watabou.noosa.audio;
import port.oracle.StatusOracle;
public class Sample {
  public static final Sample INSTANCE=new Sample();
  public void play(String name){StatusOracle.event("sound:"+name+":"+StatusOracle.flags());}
}
