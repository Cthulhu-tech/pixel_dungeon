package port.oracle;
import java.io.*;
import java.util.*;
import java.lang.reflect.*;
import com.watabou.pixeldungeon.Dungeon;
import com.watabou.pixeldungeon.actors.*;
import com.watabou.pixeldungeon.actors.hero.*;
import com.watabou.pixeldungeon.actors.mobs.Thief;
import com.watabou.pixeldungeon.actors.buffs.*;
import com.watabou.pixeldungeon.items.*;
import com.watabou.pixeldungeon.items.food.*;
import com.watabou.pixeldungeon.items.scrolls.Scroll;
import com.watabou.pixeldungeon.items.rings.RingOfElements.Resistance;
import com.watabou.pixeldungeon.items.rings.RingOfMending.Rejuvenation;
import com.watabou.pixeldungeon.items.rings.RingOfSatiety.Satiety;
import com.watabou.pixeldungeon.levels.Level;
import com.watabou.utils.Bundle;
public class ResourceOracle {
  public static final ArrayList<Buff> objects=new ArrayList<>();
  public static final ArrayList<String> events=new ArrayList<>();
  public static Char[] targets;
  public static int enemies,failAt,draws;
  public static float now;
  public static boolean doom,captureFood;
  public static double[] tape;
  public static void event(String text){events.add(text);if(failAt>0&&events.size()==failAt)throw new IllegalStateException("injected");}
  public static String bits(float value){return Integer.toUnsignedString(Float.floatToIntBits(value));}
  public static float number(String value){return Float.intBitsToFloat((int)Long.parseLong(value));}
  public static int key(Actor actor){if(!(actor instanceof Buff))return -1;int i=objects.indexOf(actor);if(i>=0)return i;objects.add((Buff)actor);return objects.size()-1;}
  public static double random(){event("rng:"+draws);if(draws>=tape.length)throw new IllegalArgumentException("tape");return tape[draws++];}
  public static String flags(){ArrayList<String> state=new ArrayList<>();for(Char ch:targets)state.add(ch.flags());return String.join("/",state);}
  public static String ownAll(){ArrayList<String> state=new ArrayList<>();for(Buff b:objects){Bundle save=new Bundle();b.storeInBundle(save);state.add(save.own());}return String.join("/",state);}
  static String itemKind(Item item){return item==null?"null":item.getClass().getSimpleName();}
  static String targetState(Char ch){
    ArrayList<String> members=new ArrayList<>();for(Buff b:ch.effects)members.add(Integer.toString(key(b)));
    String own=ch instanceof Hero?(((Hero)ch).weakened?"1":"0")+","+((Hero)ch).heroClass+","+itemKind(((Hero)ch).belongings.backpack.item)+","+(((Hero)ch).belongings.backpack.accept?1:0):ch instanceof Thief?itemKind(((Thief)ch).item):"-";
    return ch.flags()+","+ch.pos+","+(ch.sprite.visible?1:0)+";"+own+";"+String.join(",",members);
  }
  static Class<? extends Buff> kind(String name)throws Exception{
    if(name.equals("Resistance"))return Resistance.class;if(name.equals("Rejuvenation"))return Rejuvenation.class;if(name.equals("Satiety"))return Satiety.class;
    return Class.forName("com.watabou.pixeldungeon.actors.buffs."+name).asSubclass(Buff.class);
  }
  static Item item(String name){switch(name){case "null":return null;case "Scroll":return new Scroll();case "MysteryMeat":return new MysteryMeat();default:return new Item();}}
  static String execute(String command)throws Exception{
    String[] a=command.split(":",-1);
    switch(a[0]){
      case "new":{Buff b=kind(a[1]).getDeclaredConstructor().newInstance();return Integer.toString(key(b));}
      case "attach":return Boolean.toString(objects.get(Integer.parseInt(a[1])).attachTo(targets[Integer.parseInt(a[2])]));
      case "detach":objects.get(Integer.parseInt(a[1])).detach();return "void";
      case "act":return Boolean.toString(objects.get(Integer.parseInt(a[1])).act());
      case "flag":{Char ch=targets[Integer.parseInt(a[1])];switch(a[2]){
        case "HP":ch.HP=Integer.parseInt(a[3]);break;case "HT":ch.HT=Integer.parseInt(a[3]);break;
        case "pos":ch.pos=Integer.parseInt(a[3]);break;case "sprite":ch.sprite.visible=a[3].equals("1");break;
        case "paralysed":ch.paralysed=a[3].equals("1");break;case "rooted":ch.rooted=a[3].equals("1");break;
        case "flying":ch.flying=a[3].equals("1");break;case "invisible":ch.invisible=Integer.parseInt(a[3]);break;
        case "rogue":((Hero)ch).heroClass=a[3].equals("1")?HeroClass.ROGUE:HeroClass.WARRIOR;break;
      }return "void";}
      case "immune":{Char ch=targets[Integer.parseInt(a[1])];if(a[3].equals("1"))ch.blocked.add(kind(a[2]));else ch.blocked.remove(kind(a[2]));return "void";}
      case "terrain":{int p=targets[Integer.parseInt(a[1])].pos;Level.water[p]=a[2].equals("1");Level.flamable[p]=a[3].equals("1");return "void";}
      case "item":{Char ch=targets[Integer.parseInt(a[1])];captureFood=false;Item item=item(a[2]);captureFood=true;if(ch instanceof Hero)((Hero)ch).belongings.backpack.item=item;else ((Thief)ch).item=item;return "void";}
      case "collect":((Hero)targets[Integer.parseInt(a[1])]).belongings.backpack.accept=a[2].equals("1");return "void";
      case "enemies":enemies=Integer.parseInt(a[1]);return "void";
      case "fail":failAt=Integer.parseInt(a[1]);return "void";
      case "doom":doom=a[1].equals("1");return "void";
      case "now":now=number(a[1]);return "void";
      case "own":{Bundle data=new Bundle();objects.get(Integer.parseInt(a[1])).storeInBundle(data);return data.own();}
      case "restore":{Buff b=objects.get(Integer.parseInt(a[1]));Bundle data=new Bundle();b.storeInBundle(data);if(a[3].equals("f"))data.put(a[2],number(a[4]));else data.put(a[2],Integer.parseInt(a[4]));b.restoreFromBundle(data);return "void";}
      case "field":{Buff b=objects.get(Integer.parseInt(a[1]));Field f=b.getClass().getField(a[2]);if(f.getType()==float.class)f.setFloat(b,number(a[3]));else f.setInt(b,Integer.parseInt(a[3]));return "void";}
      case "time":objects.get(Integer.parseInt(a[1])).time=number(a[2]);return "void";
      case "set":{Buff b=objects.get(Integer.parseInt(a[1]));if(b instanceof Poison)((Poison)b).set(number(a[2]));else ((Bleeding)b).set(Integer.parseInt(a[2]));return "void";}
      case "raise":((Barkskin)objects.get(Integer.parseInt(a[1]))).level(Integer.parseInt(a[2]));return "void";
      case "bark":return Integer.toString(((Barkskin)objects.get(Integer.parseInt(a[1]))).level());
      case "satisfy":((Hunger)objects.get(Integer.parseInt(a[1]))).satisfy(number(a[2]));return "void";
      case "starving":return Boolean.toString(((Hunger)objects.get(Integer.parseInt(a[1]))).isStarving());
      case "reignite":((Burning)objects.get(Integer.parseInt(a[1]))).reignite(targets[Integer.parseInt(a[2])]);return "void";
      case "combo":return Integer.toString(((Combo)objects.get(Integer.parseInt(a[1]))).hit(null,Integer.parseInt(a[2])));
      case "recover":Terror.recover(targets[Integer.parseInt(a[1])]);return "void";
      case "death":((Hero.Doom)objects.get(Integer.parseInt(a[1]))).onDeath();return "void";
      case "duration":return bits((Float)kind(a[1]).getMethod(a[2],Char.class).invoke(null,targets[Integer.parseInt(a[3])]));
      case "info":{Buff b=objects.get(Integer.parseInt(a[1]));String name=b.getClass().getMethod("toString").getDeclaringClass()==Object.class?"null":b.toString();return b.icon()+","+name;}
      default:throw new IllegalArgumentException(command);
    }
  }
  public static void main(String[] args)throws Exception{
    BufferedReader input=new BufferedReader(new InputStreamReader(System.in));String line;
    while((line=input.readLine())!=null){
      String[] fields=line.split("\\|",-1);String[] ds=fields[0].isEmpty()?new String[0]:fields[0].split(",");tape=new double[ds.length];for(int i=0;i<ds.length;i++)tape[i]=Double.parseDouble(ds[i]);
      objects.clear();targets=new Char[]{new Hero(0),new Char(1),new Thief(2),new Hero(3)};Dungeon.hero=(Hero)targets[0];Dungeon.level=new Level();Level.water=new boolean[1024];Level.flamable=new boolean[1024];
      enemies=0;failAt=0;now=0;draws=0;doom=false;captureFood=true;ArrayList<String> checkpoints=new ArrayList<>();
      for(String command:fields[1].split(";")){
        events.clear();String result;
        try{result=execute(command);}catch(InvocationTargetException e){Throwable x=e.getCause();if(x instanceof IllegalStateException)result="error:injected";else if(x instanceof ClassCastException)result="error:cast";else throw e;}
        catch(ClassCastException e){result="error:cast";}catch(NullPointerException e){result="error:null";}
        catch(IndexOutOfBoundsException e){result="error:bounds";}catch(ArithmeticException e){result="error:division";}
        catch(IllegalStateException e){result="error:injected";}catch(IllegalArgumentException e){if(e.getMessage().equals("tape"))result="error:tape";else throw e;}
        ArrayList<String> ts=new ArrayList<>();for(Char ch:targets)ts.add(targetState(ch));
        ArrayList<String> bs=new ArrayList<>();for(Buff b:objects){Bundle data=new Bundle();b.storeInBundle(data);String extra=b instanceof Barkskin?"b"+((Barkskin)b).level():b instanceof Combo?"c"+((Combo)b).count:b instanceof Ooze?"d"+((Ooze)b).damage:b instanceof Resistance?"r"+bits(((Resistance)b).factor):b instanceof Satiety?"s"+((Satiety)b).level:b instanceof Rejuvenation?"j"+((Rejuvenation)b).level:"-";
          bs.add(b.getClass().getSimpleName()+","+(b.target==null?-1:b.target.index)+","+bits(b.time)+","+data.own()+","+extra);}
        checkpoints.add(result+"~"+String.join("/",ts)+"~"+String.join("/",bs)+"~"+draws+"~"+String.join(";",events));
      }
      System.out.println(String.join("\t",checkpoints));
    }
  }
}
