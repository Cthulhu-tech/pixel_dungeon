// Original ResultDescriptions.java, Oleg Dolya (C) 2012-2015, GPL-3.0-or-later.
import descriptions from './assets/result-descriptions.en.json' with { type: 'json' };
export function resultDescription(id: PDResultDescriptionId): string { return descriptions[id]; }
export { RunObservation } from './RunObservation.ts';
