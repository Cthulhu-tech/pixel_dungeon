/** Application orchestration only. No gameplay state or turn clock. */
type PDShellPhase = 'loading' | 'ready' | 'paused' | 'failed';
type PDShellEvent = { type: 'READY' } | { type: 'TOGGLE' } | { type: 'RESTART' } | { type: 'FAIL' };
interface PDShellView { readonly phase: PDShellPhase }
interface PDReadonlyShellView {
  getSnapshot(): PDShellView;
  subscribe(listener: (view: PDShellView) => void): () => void;
}
interface PDShellProjection {
  readonly reader: PDReadonlyShellView;
  publish(view: PDShellView): void;
}
interface PDShellController {
  start(): void;
  send(event: PDShellEvent): void;
  dispose(): void;
}
interface PDShellCommands {
  ready(): void;
  toggle(): void;
  restart(): void;
  fail(error: unknown): void;
}
