import Phaser from 'phaser';
import { createShellController } from './shell-flow.ts';
import { createUiModel } from '../adapters/zustand/ui-model.ts';
import { SmokeScene } from '../adapters/phaser/SmokeScene.ts';

/** One composition root, invoked explicitly by the HTML entry. */
export function mountApplication(host: HTMLElement) {
  if (host.querySelector('canvas') !== null) throw new Error('Application host is already occupied');
  if (!Phaser.VERSION.startsWith('4.')) throw new Error('Phaser 4 is required');
  const model = createUiModel();
  const controller = createShellController(model);
  let game: Phaser.Game | null = null;
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    controller.dispose();
    game?.destroy(true);
  };
  const commands: PDShellCommands = {
    ready: () => controller.send({ type: 'READY' }),
    toggle: () => controller.send({ type: 'TOGGLE' }),
    restart: () => controller.send({ type: 'RESTART' }),
    fail: error => { controller.send({ type: 'FAIL' }); console.error(error); dispose(); },
  };
  try {
    controller.start();
    game = new Phaser.Game({ type: Phaser.WEBGL, parent: host, width: 320, height: 240,
      pixelArt: true, backgroundColor: '#202020', scene: [new SmokeScene(model.reader, commands)] });
    if (disposed) game.destroy(true);
  } catch (error) { dispose(); throw error; }
  return { dispose };
}
