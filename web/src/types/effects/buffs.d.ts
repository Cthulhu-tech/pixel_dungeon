interface PDBuffInstance {
  readonly classId: string;
  readonly target: PDBuffTarget | null;
  readonly character: null;
  attachTo(target: PDBuffTarget): boolean;
  detach(): void;
  act(): boolean;
  onAdd(): void;
  onRemove(): void;
  spend(duration: number): void;
  postpone(duration: number): void;
}
interface PDBuffTarget {
  isImmuneTo(classId: string): boolean;
  addBuff(buff: PDBuffInstance): void;
  removeBuff(buff: PDBuffInstance): void;
  findBuff(classId: string): PDBuffInstance | null;
}
interface PDBuffClock {
  deactivate(buff: PDBuffInstance): void;
  spend(buff: PDBuffInstance, duration: number): void;
  postpone(buff: PDBuffInstance, duration: number): void;
}
interface PDBuffFactory {
  readonly classId: string;
  create(): PDBuffInstance;
}
interface PDBuffAppendErrors {
  catchesAsJavaException(error: unknown): boolean;
  reportCaught(error: unknown): void;
}
