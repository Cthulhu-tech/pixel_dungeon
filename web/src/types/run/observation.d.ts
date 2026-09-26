/** Consumer-owned contracts; run does not import or mutate the level's private buffers. */
type PDObservationMask = ArrayLike<boolean | number>;
interface PDObservationLevel {
  updateHeroFieldOfView(): PDObservationMask;
  rememberVisible(visible: PDObservationMask): void;
}
