package com.watabou.utils;
import java.util.*;
import port.oracle.ResourceOracle;
public class Bundle {
  public final Map<String,Number> values=new TreeMap<>();
  public void put(String name,float value){values.put(name,Float.valueOf(value));}
  public void put(String name,int value){values.put(name,Integer.valueOf(value));}
  public float getFloat(String name){return values.get(name).floatValue();}
  public int getInt(String name){return values.get(name).intValue();}
  public String own(){ArrayList<String> result=new ArrayList<>();for(Map.Entry<String,Number> e:values.entrySet())if(!e.getKey().equals("time"))result.add(e.getKey()+":"+(e.getValue() instanceof Float?"f"+ResourceOracle.bits(e.getValue().floatValue()):"i"+e.getValue()));return String.join(",",result);}
}
