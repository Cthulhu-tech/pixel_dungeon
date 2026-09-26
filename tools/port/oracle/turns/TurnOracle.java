package port.oracle;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.stream.Collectors;
import com.watabou.pixeldungeon.actors.Actor;
import com.watabou.pixeldungeon.actors.ProbeActor;
import com.watabou.pixeldungeon.actors.Char;
import com.watabou.pixeldungeon.actors.mobs.Mob;
import com.watabou.pixeldungeon.actors.buffs.Buff;
import com.watabou.pixeldungeon.actors.blobs.Blob;
import com.watabou.pixeldungeon.Dungeon;
import com.watabou.pixeldungeon.Statistics;
import com.watabou.pixeldungeon.levels.Level;
import com.watabou.utils.Bundle;

/** Invokes unchanged Actor.java. Collection order is a CONTROLLED INPUT, not HashSet emulation. */
public final class TurnOracle {
    public static final LinkedHashMap<String, ProbeActor> actors = new LinkedHashMap<>();
    public static final ArrayList<String> events = new ArrayList<>();
    public static int actCalls;
    private static Field field(String name) throws Exception {
        Field value = Actor.class.getDeclaredField(name); value.setAccessible(true); return value;
    }
    private static String bits(float value) { return Integer.toUnsignedString(Float.floatToIntBits(value)); }
    private static String name(Actor actor) { return actor == null ? "-" : ((ProbeActor)actor).name; }
    private static void restore(ProbeActor actor, String time, String id) {
        Bundle fields = new Bundle(); fields.put("time", Float.parseFloat(time)); fields.put("id", Integer.parseInt(id));
        actor.restoreFromBundle(fields);
    }
    private static String command(String input) throws Exception {
        String[] c = input.split(":", -1);
        ProbeActor actor = c.length > 1 ? actors.get(c[1]) : null;
        switch (c[0]) {
            case "reset":
                field("all").set(null, new LinkedHashSet<Actor>());
                Actor.clear(); field("current").set(null, null);
                actors.clear(); events.clear(); Dungeon.hero = null; Dungeon.level = new Level();
                Statistics.duration = 0; actCalls = 0; break;
            case "new":
                switch (c[2]) {
                    case "hero": actor = new Char(c[1]); Dungeon.hero = (Char)actor; break;
                    case "mob": actor = new Mob(c[1]); break;
                    case "buff": actor = new Buff(c[1]); break;
                    case "blob": actor = new Blob(c[1]); break;
                    default: actor = new ProbeActor(c[1]);
                }
                actors.put(c[1], actor); restore(actor, c[3], c[4]);
                if (actor instanceof Char) ((Char)actor).pos = Integer.parseInt(c[5]);
                break;
            case "add": Actor.add(actor); break;
            case "delay": Actor.addDelayed(actor, Float.parseFloat(c[2])); break;
            case "remove": Actor.remove(actor); break;
            case "spend": actor.spendValue(Float.parseFloat(c[2])); break;
            case "postpone": actor.postponeValue(Float.parseFloat(c[2])); break;
            case "deactivate": actor.deactivateValue(); break;
            case "restore": restore(actor, c[2], c[3]); break;
            case "id": return Integer.toString(actor.id());
            case "buff": ((Char)actor).attached.add((Buff)actors.get(c[2])); break;
            case "moving": ((Char)actor).sprite.isMoving = c[2].equals("1"); break;
            case "move": ((Char)actor).pos = Integer.parseInt(c[2]); break;
            case "alive": Dungeon.hero.alive = c[1].equals("1"); break;
            case "hero": Dungeon.hero = (Char)actor; break;
            case "script":
                actor.actions.clear();
                if (!c[2].isEmpty()) for (String action : c[2].split("/")) actor.actions.add(action);
                break;
            case "init":
                Dungeon.level.mobs.clear(); Dungeon.level.blobs.clear();
                if (!c[1].isEmpty()) for (String mob : c[1].split(",")) Dungeon.level.mobs.add((Mob)actors.get(mob));
                if (!c[2].isEmpty()) for (String blob : c[2].split(",")) Dungeon.level.blobs.put(Dungeon.level.blobs.size(), (Blob)actors.get(blob));
                Actor.init(); break;
            case "process": Actor.process(); break;
            case "next": actor.next(); break;
            case "fix": Actor.fixTime(); break;
            case "clear": Actor.clear(); break;
            case "occupy": Actor.occupyCell((Char)actor); break;
            case "free": Actor.freeCell(Integer.parseInt(c[1])); break;
            default: throw new IllegalArgumentException("Unknown command " + input);
        }
        return "_";
    }
    private static String snapshot(String result) throws Exception {
        String membership = Actor.all().stream().map(TurnOracle::name).collect(Collectors.joining(","));
        ArrayList<String> clocks = new ArrayList<>();
        for (ProbeActor actor : actors.values()) {
            Bundle b = new Bundle(); actor.storeInBundle(b);
            int id = b.getInt("id");
            clocks.add(actor.name + "," + bits(b.getFloat("time")) + "," + id + "," + bits(actor.cooldownValue()) + "," + name(Actor.findById(id)));
        }
        ArrayList<String> occupied = new ArrayList<>();
        for (int cell = 0; cell < 1024; cell++) {
            Actor occupant = Actor.findChar(cell);
            if (occupant != null) occupied.add(cell + ":" + name(occupant));
        }
        String output = result + "|" + bits(field("now").getFloat(null)) + "|" + name((Actor)field("current").get(null))
            + "|" + bits(Statistics.duration) + "|" + membership + "|" + String.join("/", clocks)
            + "|" + String.join(",", occupied) + "|" + String.join(",", events);
        events.clear(); return output;
    }
    public static void main(String[] ignored) throws Exception {
        try (BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            for (String line; (line = input.readLine()) != null;) {
                String result;
                try { result = command(line); }
                catch (ArrayIndexOutOfBoundsException error) { result = "error:array-bounds"; }
                System.out.println(snapshot(result));
            }
        }
    }
}
