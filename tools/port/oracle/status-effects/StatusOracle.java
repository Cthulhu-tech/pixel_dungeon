package port.oracle;
import java.io.*;
import java.util.*;
import java.lang.reflect.*;
import com.watabou.pixeldungeon.Dungeon;
import com.watabou.pixeldungeon.actors.*;
import com.watabou.pixeldungeon.actors.buffs.*;
import com.watabou.pixeldungeon.items.rings.RingOfElements.Resistance;
import com.watabou.utils.Bundle;
public class StatusOracle {
  public static final ArrayList<Buff> objects=new ArrayList<>();
  public static final ArrayList<String> events=new ArrayList<>();
  public static Char[] targets;
  public static int enemies,failAt;
  public static float now;
  public static void event(String text){events.add(text);if(failAt>0 && events.size()==failAt)throw new IllegalStateException("injected");}
  public static String bits(float value){return Integer.toUnsignedString(Float.floatToIntBits(value));}
  public static float number(String value){return Float.intBitsToFloat((int)Long.parseLong(value));}
  public static int key(Actor actor){return objects.indexOf(actor);}
  public static String flags(){return targets[0].flags()+"/"+targets[1].flags();}
  public static String members(Char ch){ArrayList<String> ids=new ArrayList<>();for(Buff b:ch.effects)ids.add(Integer.toString(key(b)));return String.join(",",ids);}
  static Class<? extends Buff> kind(String name)throws Exception{
    if(name.equals("Resistance"))return Resistance.class;
    return Class.forName("com.watabou.pixeldungeon.actors.buffs."+name).asSubclass(Buff.class);
  }
  static String execute(String command)throws Exception{
    String[] a=command.split(":",-1);
    switch(a[0]){
      case "new":{Buff b=kind(a[1]).getDeclaredConstructor().newInstance();objects.add(b);return Integer.toString(objects.size()-1);}
      case "attach":return Boolean.toString(objects.get(Integer.parseInt(a[1])).attachTo(targets[Integer.parseInt(a[2])]));
      case "detach":objects.get(Integer.parseInt(a[1])).detach();return "void";
      case "act":return Boolean.toString(objects.get(Integer.parseInt(a[1])).act());
      case "flag":{Char ch=targets[Integer.parseInt(a[1])];switch(a[2]){
        case "paralysed":ch.paralysed=a[3].equals("1");break;
        case "rooted":ch.rooted=a[3].equals("1");break;
        case "flying":ch.flying=a[3].equals("1");break;
        case "alive":ch.alive=a[3].equals("1");break;
        case "invisible":ch.invisible=Integer.parseInt(a[3]);break;
        case "viewDistance":ch.viewDistance=Integer.parseInt(a[3]);break;
      }return "void";}
      case "immune":{Char ch=targets[Integer.parseInt(a[1])];if(a[3].equals("1"))ch.blocked.add(kind(a[2]));else ch.blocked.remove(kind(a[2]));return "void";}
      case "level":Dungeon.level=a[1].equals("null")?null:new Dungeon.Level(Integer.parseInt(a[1]));return "void";
      case "enemies":enemies=Integer.parseInt(a[1]);return "void";
      case "fail":failAt=Integer.parseInt(a[1]);return "void";
      case "unfreeze":Paralysis.unfreeze(targets[Integer.parseInt(a[1])]);return "void";
      case "dispel":Invisibility.dispel();return "void";
      case "prolong":((Shadows)objects.get(Integer.parseInt(a[1]))).prolong();return "void";
      case "own":{Buff b=objects.get(Integer.parseInt(a[1]));Bundle data=new Bundle();b.storeInBundle(data);return bits(data.getFloat("left"));}
      case "restore":{Buff b=objects.get(Integer.parseInt(a[1]));Bundle data=new Bundle();data.put("time",b.time);data.put("left",number(a[2]));b.restoreFromBundle(data);return "void";}
      case "duration":{
        Char ch=targets[Integer.parseInt(a[2])];ch.effects.removeIf(b->b instanceof Resistance);
        if(!a[3].equals("null"))ch.effects.add(new Resistance(number(a[3])));
        Object result=kind(a[1]).getMethod("duration",Char.class).invoke(null,ch);
        return bits((Float)result);
      }
      case "info":{
        Buff b=objects.get(Integer.parseInt(a[1]));Class<?> c=b.getClass();String title=c.getMethod("toString").getDeclaringClass()==Object.class?"null":b.toString();
        String duration="null";try{Field f=c.getDeclaredField("DURATION");f.setAccessible(true);duration=bits(f.getFloat(null));}catch(NoSuchFieldException ignored){}
        return b.icon()+","+title+","+duration;
      }
      default:throw new IllegalArgumentException(command);
    }
  }
  public static void main(String[] args)throws Exception{
    BufferedReader input=new BufferedReader(new InputStreamReader(System.in));String line;
    while((line=input.readLine())!=null){
      objects.clear();targets=new Char[]{new Char(0),new Char(1)};Dungeon.hero=targets[0];Dungeon.level=new Dungeon.Level(8);enemies=0;failAt=0;now=0;
      ArrayList<String> checkpoints=new ArrayList<>();
      for(String cmd:line.split(";")){
        events.clear();String result;
        try{result=execute(cmd);}catch(InvocationTargetException e){Throwable cause=e.getCause();if(cause instanceof IllegalStateException)result="error:injected";else throw e;}
        catch(NullPointerException e){result="error:null";}catch(IllegalStateException e){result="error:injected";}
        ArrayList<String> records=new ArrayList<>();for(Buff b:objects)records.add((b.target==null?-1:b.target.index)+","+bits(b.time));
        checkpoints.add(result+"~"+flags()+"~"+members(targets[0])+"/"+members(targets[1])+"~"+String.join("/",records)+"~"+String.join(";",events));
      }
      System.out.println(String.join("\t",checkpoints));
    }
  }
}
