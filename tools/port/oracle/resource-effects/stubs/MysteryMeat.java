package com.watabou.pixeldungeon.items.food;
import com.watabou.pixeldungeon.items.Item;
import port.oracle.ResourceOracle;
public class MysteryMeat extends Item {public MysteryMeat(){if(ResourceOracle.captureFood)ResourceOracle.event("food:MysteryMeat");}}
