/* Full pinned Blob.java runs unchanged; this subclass exposes test snapshots only. */
package port.oracle;
import java.io.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import com.watabou.pixeldungeon.actors.blobs.Blob;
import com.watabou.pixeldungeon.levels.Level;
import com.watabou.utils.Bundle;

public class BlobOracle extends Blob {
  static boolean[] bits(String value){boolean[] b=new boolean[value.length()];for(int i=0;i<b.length;i++)b[i]=value.charAt(i)=='1';return b;}
  static int[] ints(String value){return value.isEmpty()?new int[0]:Arrays.stream(value.split(":")).mapToInt(Integer::parseInt).toArray();}
  static String array(int[] a){StringJoiner s=new StringJoiner(",");for(int v:a)s.add(Integer.toString(v));return s.toString();}
  String digest() throws Exception {
    String state=Integer.toUnsignedString(Float.floatToRawIntBits(time))+"|"+volume+"|"+array(cur)+"|"+array(off);
    return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(state.getBytes(StandardCharsets.UTF_8)));
  }
  String stored(){Bundle b=new Bundle();storeInBundle(b);int[] data=b.getIntArray("cur");return data==null?"null":b.getInt("start")+":"+array(data);}
  public static void main(String[] args) throws Exception {
    BufferedReader reader=new BufferedReader(new InputStreamReader(System.in,StandardCharsets.UTF_8));
    for(String line;(line=reader.readLine())!=null;){
      String[] parts=line.split("\\|",-1);Level.solid=bits(parts[0]);BlobOracle b=new BlobOracle();StringJoiner results=new StringJoiner("\t");
      for(String command:parts[1].split(";",-1)){
        String[] op=command.split(",",-1);String result="ok";
        try{switch(op[0]){
          case "s":b.seed(Integer.parseInt(op[1]),Integer.parseInt(op[2]));break;
          case "c":b.clear(Integer.parseInt(op[1]));break;
          case "a":result="act:"+b.act();break;
          case "w":result="save:"+b.stored();break;
          case "r": {
            Bundle bundle=new Bundle();if(!op[1].equals("none")){bundle.put("start",Integer.parseInt(op[1]));bundle.put("cur",ints(op[2]));}
            Level.resizingNeeded=!op[3].equals("none");Level.loadedMapSize=Level.resizingNeeded?Integer.parseInt(op[3]):0;
            b.restoreFromBundle(bundle);break;
          }
          case "b":Level.solid=bits(op[1]);break;
          default:throw new IllegalArgumentException(command);
        }}catch(IndexOutOfBoundsException e){result="bounds";}
        results.add(result+"|"+b.digest());
      }
      System.out.println(results);
    }
  }
}
