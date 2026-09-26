import { createMachine, interpret } from 'xstate';

/** Construct explicitly: importing the module starts no actor or subscription. */
export function createShellController(projection: PDShellProjection): PDShellController {
  const flow = createMachine<Record<string, never>, PDShellEvent>({
    id: 'port-shell', predictableActionArguments: true, initial: 'loading',
    states: {
      loading: { on: { READY: 'ready', FAIL: 'failed' } },
      ready: { on: { TOGGLE: 'paused', RESTART: 'loading', FAIL: 'failed' } },
      paused: { on: { TOGGLE: 'ready', RESTART: 'loading', FAIL: 'failed' } },
      failed: { type: 'final' },
    },
  });
  const actor = interpret(flow);
  let started = false;
  let disposed = false;
  const subscription = actor.subscribe(snapshot => {
    const phase = snapshot.matches('ready') ? 'ready' : snapshot.matches('paused') ? 'paused'
      : snapshot.matches('failed') ? 'failed' : 'loading';
    projection.publish({ phase });
  });
  return {
    start() {
      if (disposed) throw new Error('Shell has been disposed');
      if (!started) { started = true; actor.start(); }
    },
    send(event) { if (started && !disposed) actor.send(event); },
    dispose() {
      if (disposed) return;
      disposed = true;
      subscription.unsubscribe();
      actor.stop();
    },
  };
}
