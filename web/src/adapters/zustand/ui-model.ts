import { createStore } from 'zustand/vanilla';

/** UI projection only; frozen runtime snapshots are not authored JSON content. */
export function createUiModel(): PDShellProjection {
  const store = createStore<PDShellView>(() => Object.freeze({ phase: 'loading' }));
  return {
    reader: Object.freeze({ getSnapshot: store.getState, subscribe: store.subscribe }),
    publish: view => store.setState(Object.freeze({ phase: view.phase }), true),
  };
}
