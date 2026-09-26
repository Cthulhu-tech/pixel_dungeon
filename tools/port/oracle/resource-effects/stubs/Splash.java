package com.watabou.pixeldungeon.effects;
import com.watabou.utils.PointF;
import port.oracle.ResourceOracle;
public class Splash {public static void at(PointF p,float direction,float cone,int color,int count){ResourceOracle.event("splash:"+ResourceOracle.bits(p.x)+":"+ResourceOracle.bits(p.y)+":"+ResourceOracle.bits(direction)+":"+ResourceOracle.bits(cone)+":"+color+":"+count);}}
