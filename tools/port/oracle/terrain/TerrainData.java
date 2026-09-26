/* Original Terrain data exporter. Oleg Dolya's Terrain.java is compiled unchanged. */
package port.oracle;
import com.watabou.pixeldungeon.levels.Terrain;
import java.lang.reflect.Field;
import java.util.TreeMap;
public final class TerrainData {
  public static void main(String[] args) throws Exception {
    TreeMap<String,Integer> constants = new TreeMap<>();
    for (Field f : Terrain.class.getFields()) if (f.getType() == int.class) constants.put(f.getName(),f.getInt(null));
    System.out.print("{\"constants\":{"); boolean first=true;
    for (var entry:constants.entrySet()) {if(!first)System.out.print(",");first=false;System.out.print("\""+entry.getKey()+"\":"+entry.getValue());}
    System.out.print("},\"flags\":[");
    for(int i=0;i<Terrain.flags.length;i++){if(i>0)System.out.print(",");System.out.print(Terrain.flags[i]);}
    System.out.print("],\"discoveries\":{");first=true;
    for(int i=0;i<Terrain.flags.length;i++)if(Terrain.discover(i)!=i){if(!first)System.out.print(",");first=false;System.out.print("\""+i+"\":"+Terrain.discover(i));}
    System.out.println("}}");
  }
}
