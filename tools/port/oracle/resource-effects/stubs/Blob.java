package com.watabou.pixeldungeon.actors.blobs;
import port.oracle.ResourceOracle;
public class Blob {public static Blob seed(int pos,int volume,Class<?> kind){ResourceOracle.event("seed:"+pos+":"+volume+":"+kind.getSimpleName());return new Blob();}}
