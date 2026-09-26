/* Test-only neighbors for selected Char methods, not production gameplay replacements. */
package port.oracle;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public final class CharacterOracle {
    static final List<String> events=new ArrayList<>();
    static double[] draws;
    static int used,flags,attackBonus,defenseBonus,accuracy,defense,armor,rolled,deathMode;
    static Integer afterHT;
    static String mode;
    static int bits(float value) { return Float.floatToIntBits(value); }
    static String fbits(float value) { return Integer.toUnsignedString(bits(value)); }
    public static double draw() {
        if(used>=draws.length) throw new IllegalStateException("draw-exhausted");
        events.add("draw:"+used);
        return draws[used++];
    }
    static void event(String value) {
        events.add(value);
        if((flags&2048)!=0 && (value.startsWith("log:hit") || value.startsWith("blood:") || value.startsWith("status:"))) draw();
    }
    static String label(Object value) { return value instanceof Char ? ((Char)value).name : "effect"; }
    static String evaluate(String line) {
        String[] p=line.split("\\|",-1); mode=p[0];
        int role=Integer.parseInt(p[1]),visible=Integer.parseInt(p[2]);
        accuracy=Integer.parseInt(p[3]); defense=Integer.parseInt(p[4]); armor=Integer.parseInt(p[5]);
        rolled=Integer.parseInt(p[6]); attackBonus=Integer.parseInt(p[7]); defenseBonus=Integer.parseInt(p[8]);
        int hp=Integer.parseInt(p[9]),ht=Integer.parseInt(p[10]); flags=Integer.parseInt(p[11]);
        int sniper=Integer.parseInt(p[12]); deathMode=Integer.parseInt(p[13]);
        afterHT=p[14].equals("n")?null:Integer.valueOf(p[14]);
        float base=Float.intBitsToFloat(Integer.parseUnsignedInt(p[15]));
        float time=Float.intBitsToFloat(Integer.parseUnsignedInt(p[16]));
        draws=p[17].isEmpty()?new double[0]:Arrays.stream(p[17].split(",")).mapToDouble(Double::parseDouble).toArray();
        events.clear(); used=0;
        Probe a=role==1 || sniper>0 ? new Hero("A",1,20,20):new Probe("A",1,20,20);
        Probe b=role==2 ? new Hero("B",2,hp,ht):new Probe("B",2,hp,ht);
        if(a instanceof Hero) { ((Hero)a).rangedWeapon=sniper>=2?new Object():null; ((Hero)a).subClass=(sniper==1||sniper==3)?HeroSubClass.SNIPER:HeroSubClass.OTHER; }
        Dungeon.hero=role==1?(Hero)a:role==2?(Hero)b:role==3?new Hero("C",3,20,20):null;
        if(Dungeon.hero!=null) Dungeon.hero.killerGlyph=(flags&128)!=0?new Object():null;
        Dungeon.visible=new boolean[4];Dungeon.visible[1]=(visible&1)!=0;Dungeon.visible[2]=(visible&2)!=0;
        b.baseSpeed=base;
        b.paralysis=(flags&4)!=0;b.frost=(flags&8)!=0;
        Object source=(flags&512)!=0?a:new Effect();
        String result="void";
        try {
            switch(mode) {
                case "hit": result=Boolean.toString(Char.hit(a,b,(flags&4096)!=0));break;
                case "attack": result=Boolean.toString(a.attack(b));break;
                case "attack-twice": result=a.attack(b)+","+a.attack(b);break;
                case "damage": b.damage(rolled,source);break;
                case "damage-sequence": b.damage(rolled,source);b.damage(rolled,source);b.damage(rolled,source);break;
                case "destroy": b.destroy();break;
                case "die": b.die(source);break;
                case "time": result=fbits(b.speed());b.spend(time);b.spend(time);break;
                default: throw new IllegalArgumentException("Unknown fixture mode");
            }
        } catch(ArithmeticException e) {result="error:divide-zero";}
          catch(IllegalStateException e) { if(!"draw-exhausted".equals(e.getMessage())) throw e;result="error:draw-exhausted"; }
        return result+"|"+b.HP+"|"+b.HT+"|"+(b.paralysis?1:0)+"|"+(b.frost?1:0)+"|"+used+"|"+fbits(b.spent)+"|"+String.join(";",events);
    }
    public static void main(String[] args) throws Exception {
        try(BufferedReader reader=new BufferedReader(new InputStreamReader(System.in,StandardCharsets.UTF_8))) {
            for(String line;(line=reader.readLine())!=null;) if(!line.isEmpty()) System.out.println(evaluate(line));
        }
    }
}
class Actor {
    float spent;
    protected void spend(float time) {spent+=time;CharacterOracle.event("spend:"+CharacterOracle.fbits(spent));}
    static void remove(Char c) {CharacterOracle.event("remove:"+c.name+":"+c.HP);}
    static void freeCell(int pos) {CharacterOracle.event("free:"+pos);}
}
class Probe extends Char {
    boolean paralysis,frost;
    Probe(String name,int pos,int hp,int ht) {this.name=name;this.pos=pos;HP=hp;HT=ht;sprite=new Sprite(this);}
    @Override int attackSkill(Char target) {CharacterOracle.event("attack-skill:"+name+":"+target.name);return CharacterOracle.accuracy;}
    @Override int defenseSkill(Char enemy) {CharacterOracle.event("defense-skill:"+name+":"+enemy.name);return CharacterOracle.defense;}
    @Override int dr() {CharacterOracle.event("dr:"+name);return CharacterOracle.armor;}
    @Override int damageRoll() {CharacterOracle.event("roll:"+name);return CharacterOracle.rolled;}
    @Override int attackProc(Char enemy,int damage) {CharacterOracle.event("attack-proc:"+name+":"+damage);return damage+CharacterOracle.attackBonus;}
    @Override int defenseProc(Char enemy,int damage) {CharacterOracle.event("defense-proc:"+name+":"+damage);return damage-CharacterOracle.defenseBonus;}
    @Override String defenseVerb() {CharacterOracle.event("defense-verb:"+name);return "dodged";}
    @Override Object buff(Class<?> type) {
        CharacterOracle.event("buff:"+name+":"+type.getSimpleName());
        boolean yes=type==Paralysis.class?paralysis:type==Frost.class?frost:
          type==Cripple.class?(CharacterOracle.flags&16)!=0:type==Slow.class?(CharacterOracle.flags&32)!=0:
          type==Speed.class?(CharacterOracle.flags&64)!=0:false;
        return yes?new Object():null;
    }
    @Override Set<Class<?>> immunities() {CharacterOracle.event("immune:"+name);return classes(1);}
    @Override Set<Class<?>> resistances() {CharacterOracle.event("resist:"+name);return classes(2);}
    Set<Class<?>> classes(int flag) {
        if((CharacterOracle.flags&flag)==0) return Set.of();
        if((CharacterOracle.flags&1024)!=0) return Set.of(Other.class);
        return Set.of(Probe.class,Hero.class,Effect.class);
    }
    @Override public void damage(int amount,Object source) {
        CharacterOracle.event("damage:"+name+":"+amount+":"+CharacterOracle.label(source));
        if(CharacterOracle.afterHT!=null) HT=CharacterOracle.afterHT;
        super.damage(amount,source);
    }
    @Override public void die(Object src) {
        CharacterOracle.event("die:"+name+":"+CharacterOracle.label(src));
        if(CharacterOracle.deathMode==1) {HP=HT;CharacterOracle.event("revive:"+name);return;}
        if(CharacterOracle.deathMode==2) return;
        super.die(src);
    }
    @Override public boolean isAlive() {CharacterOracle.event("alive:"+name);return super.isAlive();}
}
class Hero extends Probe {
    Object rangedWeapon,killerGlyph;
    HeroSubClass subClass=HeroSubClass.OTHER;
    Hero(String name,int pos,int hp,int ht){super(name,pos,hp,ht);}
    void interrupt(){CharacterOracle.event("interrupt:"+name);}
}
enum HeroSubClass {SNIPER,OTHER}
class Effect {}
class Other {}
class Frost {}
class Paralysis {}
class Cripple {}
class Slow {}
class Speed {}
class Buff {
    static void detach(Char c,Class<?> type) {
        CharacterOracle.event("detach:"+c.name+":"+type.getSimpleName());
        Probe p=(Probe)c;if(type==Frost.class)p.frost=false;if(type==Paralysis.class)p.paralysis=false;
    }
}
class Dungeon {
    static Hero hero;static boolean[] visible;static int depth=3;
    static void fail(String value){CharacterOracle.event("fail:"+value);}
}
class Sprite {
    final Char owner;Sprite(Char owner){this.owner=owner;}
    Char center(){CharacterOracle.event("center:"+owner.name);return owner;}
    void bloodBurstA(Char source,int amount){CharacterOracle.event("blood:"+owner.name+":"+source.name+":"+amount);}
    void flash(){CharacterOracle.event("flash:"+owner.name);}
    void die(){CharacterOracle.event("sprite-die:"+owner.name);}
    void showStatus(int kind,String value){CharacterOracle.event("status:"+owner.name+":"+kind+":"+value);}
}
class CharSprite {static final int NEUTRAL=0,WARNING=1,NEGATIVE=2;}
class Assets {static final String SND_HIT="hit",SND_MISS="miss";}
class Sample {
    static final Sample INSTANCE=new Sample();
    void play(String sound){CharacterOracle.event("sound:"+sound);}
    void play(String sound,int l,int r,float pitch){CharacterOracle.event("sound:"+sound+":"+CharacterOracle.fbits(pitch));}
}
class Camera {
    static final Camera main=new Camera();
    void shake(float intensity,float duration){CharacterOracle.event("shake:"+(int)intensity+":"+CharacterOracle.fbits(duration));}
}
class GameMath {static float gate(float min,float value,float max){return Math.min(max,Math.max(min,value));}}
class Bestiary {static boolean isBoss(Char c){CharacterOracle.event("boss:"+c.name);return (CharacterOracle.flags&256)!=0;}}
class ResultDescriptions {static final String BOSS="boss",MOB="mob";}
class Utils {
    static String indefinite(String s){CharacterOracle.event("indefinite:"+s);return "a "+s;}
    static String format(String key,Object... args){return key+":"+String.join(":",Arrays.stream(args).map(Object::toString).toArray(String[]::new));}
}
class GLog {
    static void i(String key,Object... args){CharacterOracle.event("log:"+key+":"+String.join(":",Arrays.stream(args).map(Object::toString).toArray(String[]::new)));}
    static void n(String key,Object... args){i(key,args);}
}
