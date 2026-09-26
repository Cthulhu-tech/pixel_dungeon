package com.watabou.pixeldungeon.ui;
public class BuffIndicator {
public static final int NONE	= -1;
public static final int MIND_VISION	= 0;
public static final int LEVITATION	= 1;
public static final int FIRE		= 2;
public static final int POISON		= 3;
public static final int PARALYSIS	= 4;
public static final int HUNGER		= 5;
public static final int STARVATION	= 6;
public static final int SLOW		= 7;
public static final int OOZE		= 8;
public static final int AMOK		= 9;
public static final int TERROR		= 10;
public static final int ROOTS		= 11;
public static final int INVISIBLE	= 12;
public static final int SHADOWS		= 13;
public static final int WEAKNESS	= 14;
public static final int FROST		= 15;
public static final int BLINDNESS	= 16;
public static final int COMBO		= 17;
public static final int FURY		= 18;
public static final int HEALING		= 19;
public static final int ARMOR		= 20;
public static final int HEART		= 21;
public static final int LIGHT		= 22;
public static final int CRIPPLE		= 23;
public static final int BARKSKIN	= 24;
public static final int IMMUNITY	= 25;
public static final int BLEEDING	= 26;
public static final int MARK		= 27;
public static final int DEFERRED	= 28;
public static final int VERTIGO		= 29;
public static final int RAGE		= 30;
public static final int SACRIFICE	= 31;
public static void refreshHero(){port.oracle.ResourceOracle.event("refresh:"+port.oracle.ResourceOracle.ownAll());}
public static final int SIZE	= 7;
}
