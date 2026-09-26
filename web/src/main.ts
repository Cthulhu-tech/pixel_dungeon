import Phaser from 'phaser';
import RexUIPlugin from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';
import { createActor } from 'xstate';
import { shellFlow } from './app/shell-flow.ts';
import { createUiModel } from './adapters/zustand/ui-model.ts';
import { SmokeScene } from './adapters/phaser/SmokeScene.ts';
const host = document.getElementById('game');
const status = document.getElementById('status');
const restart = document.getElementById('restart');
if (!host || !status || !restart) throw new Error('Missing application host');
if (!Phaser.VERSION.startsWith('4.')) throw new Error('Phaser 4 is required');
const model = createUiModel();
const actor = createActor(shellFlow);
const flowSubscription = actor.subscribe((snapshot) => {
  const phase = snapshot.matches('ready') ? 'ready' : snapshot.matches('paused') ? 'paused' : 'loading';
  model.publish({ phase });
});
const unsubscribeStatus = model.reader.subscribe((view) => {
  status.textContent = view.phase; status.dataset['phase'] = view.phase;
});
actor.start();
const scene = new SmokeScene(model.reader, () => actor.send({ type: 'TOGGLE' }), () => actor.send({ type: 'READY' }));
const game = new Phaser.Game({
  type: Phaser.WEBGL, parent: host, width: 320, height: 240, pixelArt: true,
  backgroundColor: '#202020', scene: [scene],
  plugins: { scene: [{ key: 'rexUI', plugin: RexUIPlugin, mapping: 'rexUI' }] },
});
const restartRenderer = (): void => { scene.scene.restart(); };
restart.addEventListener('click', restartRenderer);
const dispose = (): void => {
  restart.removeEventListener('click', restartRenderer);
  flowSubscription.unsubscribe(); unsubscribeStatus(); actor.stop(); game.destroy(true);
};
if (import.meta.hot) import.meta.hot.dispose(dispose);
