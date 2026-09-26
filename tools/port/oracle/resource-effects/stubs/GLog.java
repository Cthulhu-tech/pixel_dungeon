package com.watabou.pixeldungeon.utils;
import java.util.Locale;
import port.oracle.ResourceOracle;
public class GLog {
  public static void n(String text,Object... args){ResourceOracle.event("negative:"+String.format(Locale.ROOT,text,args));}
  public static void w(String text,Object... args){ResourceOracle.event("warning:"+String.format(Locale.ROOT,text,args));}
  public static void p(String text,Object... args){ResourceOracle.event("positive:"+String.format(Locale.ROOT,text,args));}
}
