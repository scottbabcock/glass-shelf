import type { CollectionArtFit, CollectionArtMode } from '../data/prefs';

/** Glass Shelf's fixed design choices (formerly user settings). */
export const GAME_COLUMNS = 3;
export const COLLECTION_COLUMNS = 5;
/** Collection cards without a per-collection choice: a fan of their games' covers, filling the card. */
export const COLLECTION_ART_MODE: CollectionArtMode = 'fan';
export const COLLECTION_ART_FIT: CollectionArtFit = 'cover';
/** Accent used for an uninstalled game, which is also greyed out in the grid. */
export const UNINSTALLED_ACCENT = '#707784';
