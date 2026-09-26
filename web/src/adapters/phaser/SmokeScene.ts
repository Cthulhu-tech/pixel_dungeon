import Phaser from 'phaser';
import type RexUIPlugin from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';
import type { ReadonlyShellView } from '../../contracts/presentation.ts';
import { LEVEL_WIDTH, LEVEL_HEIGHT } from '../../modules/grid/index.ts';
const amuletUrl = new URL('../../../../assets/amulet.png', import.meta.url).href;
export class SmokeScene extends Phaser.Scene {
  declare rexUI: RexUIPlugin;
  private readonly view: ReadonlyShellView;
  private readonly toggle: () => void;
  private readonly ready: () => void;
  constructor(view: ReadonlyShellView, toggle: () => void, ready: () => void) {
    super('smoke'); this.view = view; this.toggle = toggle; this.ready = ready;
  }
  preload(): void {
    this.load.on('loaderror', (file: { key: string }) => { throw new Error(`Failed asset: ${file.key}`); });
    this.load.image('original-amulet', amuletUrl);
  }
  create(): void {
    this.add.text(16, 12, 'INFRASTRUCTURE TEST', { fontSize: '16px' });
    this.add.image(160, 68, 'original-amulet').setScale(3);
    const label = this.add.text(0, 0, '', { fontSize: '14px' });
    const button = this.rexUI.add.label({
      x: 160, y: 150, width: 240, height: 44,
      background: this.add.rectangle(0, 0, 240, 44, 0x343434),
      text: label, align: 'center',
    }).layout().setInteractive();
    const render = (): void => { label.setText(`State: ${this.view.getSnapshot().phase} — click`); button.layout(); };
    const unsubscribe = this.view.subscribe(render);
    button.on('pointerup', this.toggle);
    this.input.keyboard?.on('keydown-SPACE', this.toggle);
    this.add.text(16, 200, `Original grid: ${LEVEL_WIDTH} x ${LEVEL_HEIGHT}`, { fontSize: '12px' });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe(); button.off('pointerup', this.toggle);
      this.input.keyboard?.off('keydown-SPACE', this.toggle);
    });
    this.ready(); render();
  }
}
