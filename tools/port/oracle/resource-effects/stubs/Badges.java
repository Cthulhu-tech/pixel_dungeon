package com.watabou.pixeldungeon;
import port.oracle.ResourceOracle;
public class Badges {
  public static void validateDeathFromPoison(){ResourceOracle.event("badge:Poison");}
  public static void validateDeathFromHunger(){ResourceOracle.event("badge:Hunger");}
  public static void validateDeathFromFire(){ResourceOracle.event("badge:Burning");}
  public static void validateMasteryCombo(int count){ResourceOracle.event("comboBadge:"+count);}
}
