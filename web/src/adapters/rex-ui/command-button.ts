import Button from 'phaser4-rex-plugins/plugins/button.js';

/** Adopt a scene-owned target for its remaining lifetime; dispose also destroys it. */
export function bindCommandButton(target: Phaser.GameObjects.GameObject, command: () => void): () => void {
  const button = new Button(target, { mode: 'pointerup', clickInterval: 0 });
  button.on('click', command);
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    button.off('click', command);
    button.destroy();
    // Vendor Button.shutdown leaves pointer listeners until the target is destroyed.
    target.destroy();
  };
}
