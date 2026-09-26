import { createMachine } from 'xstate';
// Infrastructure flow only; it does not replace Actor.process or own a game world.
export const shellFlow = createMachine({
  types: { events: {} as { type: 'READY' } | { type: 'TOGGLE' } },
  id: 'port-shell', initial: 'loading',
  states: {
    loading: { on: { READY: 'ready' } },
    ready: { on: { TOGGLE: 'paused' } },
    paused: { on: { TOGGLE: 'ready' } },
  },
});
