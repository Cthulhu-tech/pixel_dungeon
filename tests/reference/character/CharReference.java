/*
 * Selected methods from Pixel Dungeon Char.java.
 * Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later; see LICENSE.txt.
 * Source commit ce7f241515fd5c040fcf18b4beb5b7a49d9d535f, blob 65bb59224b2574caa7939cc030d65ad68e31a9fd.
 * Whitespace/comments compacted. Executable Java tokens are checked against the pinned source.
 * TEST HOST below is not a replacement for the original Android game or its dependencies.
 */
package port.oracle;
import java.util.Set;
import com.watabou.utils.Random;
abstract class Char extends Actor {
    static final String TXT_HIT="hit", TXT_KILL="killed", TXT_DEFEAT="defeat";
    static final String TXT_YOU_MISSED="you-missed", TXT_SMB_MISSED="other-missed";
    static final String TXT_OUT_OF_PARALYSIS="paralysis";
    int pos, HT, HP;
    String name;
    Sprite sprite;
    float baseSpeed=1;
    abstract int attackSkill(Char target);
    abstract int defenseSkill(Char enemy);
    abstract int dr();
    abstract int damageRoll();
    abstract int attackProc(Char enemy,int damage);
    abstract int defenseProc(Char enemy,int damage);
    abstract String defenseVerb();
    abstract Object buff(Class<?> type);
    abstract Set<Class<?>> immunities();
    abstract Set<Class<?>> resistances();
public boolean attack( Char enemy ) {
    boolean visibleFight = Dungeon.visible[pos] || Dungeon.visible[enemy.pos];
    if (hit( this, enemy, false )) {
        if (visibleFight) { GLog.i( TXT_HIT, name, enemy.name ); }
        // FIXME
        int dr = this instanceof Hero && ((Hero)this).rangedWeapon != null && ((Hero)this).subClass == HeroSubClass.SNIPER ? 0 :
            Random.IntRange( 0, enemy.dr() );
        int dmg = damageRoll();
        int effectiveDamage = Math.max( dmg - dr, 0 );
        effectiveDamage = attackProc( enemy, effectiveDamage );
        effectiveDamage = enemy.defenseProc( this, effectiveDamage );
        enemy.damage( effectiveDamage, this );
        if (visibleFight) {
            Sample.INSTANCE.play( Assets.SND_HIT, 1, 1, Random.Float( 0.8f, 1.25f ) );
        }
        if (enemy == Dungeon.hero) {
            Dungeon.hero.interrupt();
            if (effectiveDamage > enemy.HT / 4) {
                Camera.main.shake( GameMath.gate( 1, effectiveDamage / (enemy.HT / 4), 5), 0.3f );
            }
        }
        enemy.sprite.bloodBurstA( sprite.center(), effectiveDamage );
        enemy.sprite.flash();
        if (!enemy.isAlive() && visibleFight) {
            if (enemy == Dungeon.hero) {
                if (Dungeon.hero.killerGlyph != null) {
                    // FIXME: both original glyph-reporting statements are comments.
                } else {
                    if (Bestiary.isBoss( this )) {
                        Dungeon.fail( Utils.format( ResultDescriptions.BOSS, name, Dungeon.depth ) );
                    } else {
                        Dungeon.fail( Utils.format( ResultDescriptions.MOB,
                            Utils.indefinite( name ), Dungeon.depth ) );
                    }
                    GLog.n( TXT_KILL, name );
                }
            } else {
                GLog.i( TXT_DEFEAT, name, enemy.name );
            }
        }
        return true;
    } else {
        if (visibleFight) {
            String defense = enemy.defenseVerb();
            enemy.sprite.showStatus( CharSprite.NEUTRAL, defense );
            if (this == Dungeon.hero) {
                GLog.i( TXT_YOU_MISSED, enemy.name, defense );
            } else {
                GLog.i( TXT_SMB_MISSED, enemy.name, defense, name );
            }
            Sample.INSTANCE.play( Assets.SND_MISS );
        }
        return false;
    }
}
public static boolean hit( Char attacker, Char defender, boolean magic ) {
    float acuRoll = Random.Float( attacker.attackSkill( defender ) );
    float defRoll = Random.Float( defender.defenseSkill( attacker ) );
    return (magic ? acuRoll * 2 : acuRoll) >= defRoll;
}
public float speed() {
    return buff( Cripple.class ) == null ? baseSpeed : baseSpeed * 0.5f;
}
public void damage( int dmg, Object src ) {
    if (HP <= 0) { return; }
    Buff.detach( this, Frost.class );
    Class<?> srcClass = src.getClass();
    if (immunities().contains( srcClass )) {
        dmg = 0;
    } else if (resistances().contains( srcClass )) {
        dmg = Random.IntRange( 0, dmg );
    }
    if (buff( Paralysis.class ) != null) {
        if (Random.Int( dmg ) >= Random.Int( HP )) {
            Buff.detach( this, Paralysis.class );
            if (Dungeon.visible[pos]) {
                GLog.i( TXT_OUT_OF_PARALYSIS, name );
            }
        }
    }
    HP -= dmg;
    if (dmg > 0 || src instanceof Char) {
        sprite.showStatus( HP > HT / 2 ? CharSprite.WARNING : CharSprite.NEGATIVE, Integer.toString( dmg ) );
    }
    if (HP <= 0) { die( src ); }
}
public void destroy() {
    HP = 0;
    Actor.remove( this );
    Actor.freeCell( pos );
}
public void die( Object src ) {
    destroy();
    sprite.die();
}
public boolean isAlive() {
    return HP > 0;
}
protected void spend( float time ) {
    float timeScale = 1f;
    if (buff( Slow.class ) != null) { timeScale *= 0.5f; }
    if (buff( Speed.class ) != null) { timeScale *= 2.0f; }
    super.spend( time / timeScale );
}
}
