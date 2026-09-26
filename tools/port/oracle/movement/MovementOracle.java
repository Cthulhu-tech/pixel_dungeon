package port.oracle;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;

/** Test driver only. Expected movement, geometry and door behavior comes from original methods. */
public class MovementOracle {
    static Char subject;
    static boolean heap;
    static int roll, observeMode;
    static String failure;
    static final ArrayList<String> events=new ArrayList<>();
    static void event(String message) {
        events.add(message);
        if (!failure.equals("none") && message.startsWith(failure+":")) throw new IllegalStateException("injected");
    }
    public static void main(String[] args) throws Exception {
        BufferedReader reader=new BufferedReader(new InputStreamReader(System.in));
        for (String line; (line=reader.readLine())!=null;) {
            String[] p=line.split("\\|",-1);
            int from=Integer.parseInt(p[1]), to=Integer.parseInt(p[2]);
            if (p[0].equals("G")) {
                Char first=new Char(), second=new Char(); first.pos=from; second.pos=to;
                System.out.println(Level.adjacent(from,to)+"|"+first.distance(second)); continue;
            }
            int flags=Integer.parseInt(p[3]);
            roll=Integer.parseInt(p[4]); int oldTerrain=Integer.parseInt(p[5]), newTerrain=Integer.parseInt(p[6]);
            int mask=Integer.parseInt(p[7]); heap=p[8].equals("1"); boolean visible=p[9].equals("1");
            observeMode=Integer.parseInt(p[10]); failure=p[11]; events.clear();
            Level.passable=new boolean[1024]; Level.avoid=new boolean[1024]; Level.occupied=new boolean[1024];
            Arrays.fill(Level.passable,mask==0||mask==3);
            Arrays.fill(Level.avoid,mask==1||mask==4);
            Arrays.fill(Level.occupied,mask==3||mask==4);
            Dungeon.level=new Level(); Dungeon.level.map=new int[1024]; Arrays.fill(Dungeon.level.map,1);
            if (from>=0&&from<1024) Dungeon.level.map[from]=oldTerrain;
            if (to>=0&&to<1024) Dungeon.level.map[to]=newTerrain;
            Dungeon.visible=new boolean[1024]; Arrays.fill(Dungeon.visible,visible);
            subject=new Char(); subject.pos=from; subject.flying=(flags&2)!=0; subject.vertigo=(flags&1)!=0;
            Dungeon.hero=(flags&4)!=0 ? subject : new Char();
            String outcome="ok";
            try {
                if (p[0].equals("M")) subject.move(to);
                else if (p[0].equals("E")) Door.enter(to);
                else if (p[0].equals("L")) Door.leave(to);
                else throw new IllegalArgumentException("Unknown method");
            } catch (IndexOutOfBoundsException e) { outcome="bounds"; }
              catch (IllegalStateException e) { outcome="injected"; }
            System.out.println(outcome+"|"+subject.pos+"|"+subject.sprite.visible+"|"+
                Arrays.hashCode(Dungeon.level.map)+"|"+Dungeon.visible[0]+"|"+String.join(",",events));
        }
    }
}
