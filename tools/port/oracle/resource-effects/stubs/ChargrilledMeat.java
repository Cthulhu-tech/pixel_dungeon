package com.watabou.pixeldungeon.items.food;
import com.watabou.pixeldungeon.items.Item;
import port.oracle.ResourceOracle;
public class ChargrilledMeat extends Item {public ChargrilledMeat(){if(ResourceOracle.captureFood)ResourceOracle.event("food:ChargrilledMeat");}}
