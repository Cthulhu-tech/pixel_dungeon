/*
 * Pixel Dungeon, Copyright (C) 2012-2015 Oleg Dolya. GPL-3.0-or-later.
 * Source: ce7f241515fd5c040fcf18b4beb5b7a49d9d535f / actors/buffs/Buff.java helpers.
 * Reflection is an explicit factory. Original caught exceptions remain diagnosed null results.
 */
export class BuffOperations {
  private readonly errors: PDBuffAppendErrors;

  constructor(errors: PDBuffAppendErrors) { this.errors = errors; }

  append(target: PDBuffTarget, factory: PDBuffFactory): PDBuffInstance | null {
    try {
      const buff = factory.create();
      buff.attachTo(target);
      // Original append ignores a false attach result (including immunity).
      return buff;
    } catch (error) {
      if (!this.errors.catchesAsJavaException(error)) throw error;
      this.errors.reportCaught(error);
      return null;
    }
  }

  appendFor(target: PDBuffTarget, factory: PDBuffFactory, duration: number): PDBuffInstance {
    const buff = this.requireBuff(this.append(target, factory));
    buff.spend(duration);
    return buff;
  }

  affect(target: PDBuffTarget, factory: PDBuffFactory): PDBuffInstance | null {
    const buff = target.findBuff(factory.classId);
    return buff !== null ? buff : this.append(target, factory);
  }

  affectFor(target: PDBuffTarget, factory: PDBuffFactory, duration: number): PDBuffInstance {
    const buff = this.requireBuff(this.affect(target, factory));
    buff.spend(duration);
    return buff;
  }

  prolong(target: PDBuffTarget, factory: PDBuffFactory, duration: number): PDBuffInstance {
    const buff = this.requireBuff(this.affect(target, factory));
    buff.postpone(duration);
    return buff;
  }

  detach(buff: PDBuffInstance | null): void { if (buff !== null) buff.detach(); }

  detachMatching(target: PDBuffTarget, classId: string): void {
    this.detach(target.findBuff(classId));
  }

  private requireBuff(buff: PDBuffInstance | null): PDBuffInstance {
    if (buff === null) throw new TypeError('Original duration helper dereferences a null buff');
    return buff;
  }
}
