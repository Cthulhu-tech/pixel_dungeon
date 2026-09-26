/** Character-owned membership; effect target/time remain owned by their existing modules. */
interface PDCharacterBuff {
  detach(): void;
}
interface PDCharacterBuffMembership<T> extends Iterable<T> {
  add(buff: T): unknown;
  delete(buff: T): unknown;
}
interface PDCharacterBuffKinds<T> {
  isInstance(buff: T, classId: string): boolean;
  charmObject(buff: T): number;
}
interface PDCharacterBuffActors<T> {
  add(buff: T): void;
  remove(buff: T): void;
}
interface PDCharacterBuffState {
  position(): number;
  invisibleCount(): number;
}
type PDCharacterSpriteState = 'burning' | 'levitating' | 'invisible' | 'paralysed' | 'frozen' | 'illuminated';
type PDCharacterBuffLabel = 'poisoned' | 'amok' | 'slowed' | 'mind' | 'vision' | 'paralysed' | 'frightened' | 'rooted' | 'crippled' | 'bleeding' | 'dizzy' | 'invisible';
interface PDCharacterBuffPresentation {
  available(): boolean;
  poisonSplash(position: number, count: number): void;
  status(tone: 'negative' | 'positive', label: PDCharacterBuffLabel): void;
  addState(state: PDCharacterSpriteState): void;
  removeState(state: PDCharacterSpriteState): void;
  idle(): void;
}
