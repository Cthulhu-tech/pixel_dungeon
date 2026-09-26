package com.watabou.pixeldungeon.items.food;
import com.watabou.pixeldungeon.items.Item;
import port.oracle.ResourceOracle;
public class FrozenCarpaccio extends Item {public FrozenCarpaccio(){if(ResourceOracle.captureFood)ResourceOracle.event("food:FrozenCarpaccio");}}
