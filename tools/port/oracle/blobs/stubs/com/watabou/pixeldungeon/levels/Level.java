package com.watabou.pixeldungeon.levels;
import java.util.HashMap;
import com.watabou.pixeldungeon.actors.blobs.Blob;
public class Level {
  public static final int WIDTH=32, HEIGHT=32, LENGTH=1024;
  public static boolean[] solid;
  public static boolean resizingNeeded;
  public static int loadedMapSize;
  public HashMap<Class<?>,Blob> blobs=new HashMap<>();
}
