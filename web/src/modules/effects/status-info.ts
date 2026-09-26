import information from './assets/status-effects.json' with { type: 'json' };

/** Trusted extracted source content. No cloning, defaults or runtime normalization. */
export function statusInfo(id: PDStatusId): PDStatusInfo { return information[id]; }
export { information as statusEffectData };
