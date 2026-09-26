import Phaser from 'phaser';
import { bindCommandButton } from '../rex-ui/command-button.ts';
import { originalSmokeAssets } from './assets/original.ts';
import text from './assets/smoke.en.json' with { type: 'json' };
import vertexSource from './shaders/original-sprite.vert.glsl?raw';
import fragmentSource from './shaders/original-sprite.frag.glsl?raw';

/** Explicitly an infrastructure screen, not a claimed original game scene. */
export class SmokeScene extends Phaser.Scene {
  private readonly view: PDReadonlyShellView;
  private readonly commands: PDShellCommands;
  constructor(view: PDReadonlyShellView, commands: PDShellCommands) {
    super('smoke'); this.view = view; this.commands = commands;
  }
  preload(): void {
    const onError = (file: Phaser.Loader.File): void => this.commands.fail(new Error(`Asset failed: ${file.key}`));
    this.load.on('loaderror', onError);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.load.off('loaderror', onError));
    if (!this.textures.exists('original-amulet')) this.load.image('original-amulet', originalSmokeAssets().amulet);
  }
  create(): void {
    if (this.view.getSnapshot().phase === 'failed') return;
    this.add.text(16, 12, text.title, { fontSize: '16px' });
    const texture = this.textures.get('original-amulet');
    const frame = texture.get();
    this.add.shader({ name: 'pd-original-sprite', vertexSource, fragmentSource,
      initialUniforms: { uTexture: 0 } }, 160, 70, frame.width, frame.height, ['original-amulet']).setScale(3);
    const label = this.add.text(16, 110, '', { fontSize: '14px' });
    const toggle = this.add.text(16, 145, text.toggle, { fontSize: '14px' });
    const restart = this.add.text(16, 175, text.restart, { fontSize: '14px' });
    this.add.text(16, 215, text.notice, { fontSize: '12px' });
    const render = (): void => { label.setText(text.phase[this.view.getSnapshot().phase]); };
    const unsubscribe = this.view.subscribe(render);
    const unbindToggle = bindCommandButton(toggle, this.commands.toggle);
    const unbindRestart = bindCommandButton(restart, () => {
      this.commands.restart();
      if (this.view.getSnapshot().phase === 'loading') this.scene.restart();
    });
    this.input.keyboard?.on('keydown-SPACE', this.commands.toggle);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe(); unbindToggle(); unbindRestart();
      this.input.keyboard?.off('keydown-SPACE', this.commands.toggle);
    });
    this.commands.ready(); render();
  }
}
