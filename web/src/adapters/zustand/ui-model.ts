import { createStore } from 'zustand/vanilla';
import type { ReadonlyShellView, ShellView } from '../../contracts/presentation.ts';
export function createUiModel(): { reader: ReadonlyShellView; publish: (view: ShellView) => void } {
  const store = createStore<ShellView>(() => Object.freeze({ phase: 'loading' }));
  return {
    reader: Object.freeze({ getSnapshot: store.getState, subscribe: store.subscribe }),
    publish: (view) => store.setState(Object.freeze({ ...view }), true),
  };
}
