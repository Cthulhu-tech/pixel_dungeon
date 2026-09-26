/** Physical URLs belong to presentation, never to gameplay. No loading on import. */
export function originalSmokeAssets() {
  return { amulet: new URL('../../../../../assets/amulet.png', import.meta.url).href };
}
