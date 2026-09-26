/** Ephemeral arguments for one source shadow-cast; the caller owns the output mask. */
interface PDShadowSector {
  readonly x: number;
  readonly y: number;
  readonly distance: number;
  readonly limits: Int32Array;
  readonly losBlocking: PDGridPassability;
  readonly fieldOfView: Uint8Array;
}
