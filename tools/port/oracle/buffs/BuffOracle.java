package port.oracle;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.stream.Collectors;
import com.watabou.pixeldungeon.actors.Actor;
import com.watabou.pixeldungeon.actors.Char;
import com.watabou.pixeldungeon.actors.buffs.Buff;
import com.watabou.pixeldungeon.actors.buffs.FlavourBuff;

/** Executes the complete hash-pinned original Buff and FlavourBuff classes. */
public class BuffOracle {
    public static int flags;
    public static float now;
    static final ArrayList<Buff> all=new ArrayList<>();
    static final IdentityHashMap<Actor,Integer> ids=new IdentityHashMap<>();
    static final ArrayList<String> events=new ArrayList<>();
    static Char[] targets;
    public static int id(Actor actor){return ids.get(actor);}
    public static void event(String value){events.add(value);}
    static void register(Buff buff){ids.put(buff,all.size());all.add(buff);event("create:"+id(buff));}
    public static class Probe extends FlavourBuff {
        public Probe(){
            register(this);
            if((flags&16)!=0)throw new IllegalStateException("constructor");
            if((flags&32)!=0)throw new AssertionError("fatal");
        }
    }
    static String outcome(String action){
        String[] p=action.split(":",-1);int n=Integer.parseInt(p[1]);
        float duration=p.length>2?Float.parseFloat(p[2]):0;
        Buff result;
        switch(p[0]){
            case "append":result=Buff.append(targets[n],Probe.class);break;
            case "appendFor":result=Buff.append(targets[n],Probe.class,duration);break;
            case "affect":result=Buff.affect(targets[n],Probe.class);break;
            case "affectFor":result=Buff.affect(targets[n],Probe.class,duration);break;
            case "prolong":result=Buff.prolong(targets[n],Probe.class,duration);break;
            case "detach":Buff.detach(n<0?null:all.get(n));return "void";
            case "detachMatching":Buff.detach(targets[n],Probe.class);return "void";
            case "attach":return Boolean.toString(all.get(n).attachTo(targets[Integer.parseInt(p[2])]));
            case "act":return Boolean.toString(all.get(n).act());
            case "base":result=new Buff();register(result);break;
            case "now":now=Float.parseFloat(p[2]);return "void";
            default:throw new IllegalArgumentException("Unknown action");
        }
        return result==null?"null":Integer.toString(id(result));
    }
    static String checkpoint(){
        String state=all.stream().map(b->id(b)+":"+(b.target==null?-1:b.target.id)+":"+Float.floatToIntBits(b.time)).collect(Collectors.joining(","));
        String membership=java.util.Arrays.stream(targets).map(t->t.members.stream().map(b->Integer.toString(id(b))).collect(Collectors.joining(","))).collect(Collectors.joining("/"));
        return state+"|"+membership+"|"+String.join(",",events);
    }
    public static void main(String[] args)throws Exception {
        BufferedReader reader=new BufferedReader(new InputStreamReader(System.in));
        for(String line;(line=reader.readLine())!=null;){
            String[] p=line.split("\\|",-1);flags=Integer.parseInt(p[0]);now=Float.parseFloat(p[1]);
            all.clear();ids.clear();events.clear();targets=new Char[]{new Char(0),new Char(1)};
            for(String action:p[2].split(";")){
                events.clear();String result;
                try{result=outcome(action);}
                catch(NullPointerException e){result="error:null";}
                catch(IndexOutOfBoundsException e){result="error:bounds";}
                catch(Exception e){result="error:exception";}
                catch(AssertionError e){result="error:fatal";}
                System.out.println(result+"|"+checkpoint());
            }
        }
    }
}
