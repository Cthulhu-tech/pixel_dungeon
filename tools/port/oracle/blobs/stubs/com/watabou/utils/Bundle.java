package com.watabou.utils;
import java.util.HashMap;
public class Bundle {
  private final HashMap<String,Object> data=new HashMap<>();
  public void put(String key,int value){data.put(key,value);}
  public void put(String key,int[] value){data.put(key,value);}
  public int[] getIntArray(String key){return (int[])data.get(key);}
  public int getInt(String key){return (int)data.get(key);}
}
