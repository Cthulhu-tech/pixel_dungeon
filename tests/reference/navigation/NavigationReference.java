/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Selected original method bodies from baseline ce7f241515fd5c040fcf18b4beb5b7a49d9d535f.
 * Test-only class shell/bindings; NOT a byte-identical complete Dungeon/Level/BArray file.
 * Source provenance and method boundaries are documented in the adjacent README.
 */
package port.oracle;

public final class NavigationReference {
	private static boolean[] passable = new boolean[Level.LENGTH];
	
	public static int findPath( Char ch, int from, int to, boolean pass[], boolean[] visible ) {
		
		if (Level.adjacent( from, to )) {
			return Actor.findChar( to ) == null && (pass[to] || Level.avoid[to]) ? to : -1;
		}
		
		if (ch.flying || ch.buff( Amok.class ) != null || ch.buff( Rage.class ) != null) {
			BArray.or( pass, Level.avoid, passable );
		} else {
			System.arraycopy( pass, 0, passable, 0, Level.LENGTH );
		}
		
		for (Actor actor : Actor.all()) {
			if (actor instanceof Char) {
				int pos = ((Char)actor).pos;
				if (visible[pos]) {
					passable[pos] = false;
				}
			}
		}
		
		return PathFinder.getStep( from, to, passable );
		
	}
	
	public static int flee( Char ch, int cur, int from, boolean pass[], boolean[] visible ) {
		
		if (ch.flying) {
			BArray.or( pass, Level.avoid, passable );
		} else {
			System.arraycopy( pass, 0, passable, 0, Level.LENGTH );
		}
		
		for (Actor actor : Actor.all()) {
			if (actor instanceof Char) {
				int pos = ((Char)actor).pos;
				if (visible[pos]) {
					passable[pos] = false;
				}
			}
		}
		passable[cur] = true;
		
		return PathFinder.getStepBack( cur, from, passable );
		
	}
}

final class Level {
    public static final int WIDTH = 32;
    public static final int LENGTH = 1024;
    public static boolean[] avoid;

	public static boolean adjacent( int a, int b ) {
		int diff = Math.abs( a - b );
		return diff == 1 || diff == WIDTH || diff == WIDTH + 1 || diff == WIDTH - 1;
	}
}

final class BArray {
	public static boolean[] or( boolean[] a, boolean[] b, boolean[] result ) {
		
		int length = a.length;
		
		if (result == null) {
			result = new boolean[length];
		}
		
		for (int i=0; i < length; i++) {
			result[i] = a[i] || b[i];
		}
		
		return result;
	}
}
