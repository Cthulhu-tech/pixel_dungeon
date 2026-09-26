package com.watabou.noosa.audio;
import port.oracle.ResourceOracle;
public class Sample {public static final Sample INSTANCE=new Sample();public void play(String name){ResourceOracle.event("sound:"+name);}}
