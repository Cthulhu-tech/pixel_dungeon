package com.watabou.utils;
import java.util.*;
public class Bundle {
  private final Map<String,Float> values=new LinkedHashMap<>();
  public void put(String name,float value){values.put(name,value);}
  public float getFloat(String name){return values.get(name);}
}
