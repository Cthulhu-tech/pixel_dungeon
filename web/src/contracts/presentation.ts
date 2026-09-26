export type ShellPhase = 'loading' | 'ready' | 'paused';
export interface ShellView { readonly phase: ShellPhase }
export interface ReadonlyShellView {
  getSnapshot(): ShellView;
  subscribe(listener: (view: ShellView) => void): () => void;
}
