// Layout and type values shared with Game Glance's game page design, used by Spotlight Home's CSS (homeCss.ts).
// Extracted from Game Glance's styles/themeCss.ts; Glass Shelf does not restyle the game page itself.

/**
 * A focused pill's scale: 4% taller as a focused circle, but only as much wider as a circle grows (its height's share), not
 * 4% of its width: a 340 wide pill grew 6.8 px each side and halved its gap to the circles (Michael: too narrow). Same on
 * Home's pill, the page's and Unifideck's. Pure.
 */
export function pillFocusScale(width: number, height: number): { x: number; y: number } {
    const f = PAGE_LAYOUT.focusScale;
    return { x: Math.round((1 + (height * (f - 1)) / width) * 100000) / 100000, y: f };
}

// The 1.1.1 scrims over the art (bottom, for the cards; left, for the logo).
const SCRIM_BOTTOM = 'linear-gradient(0deg, rgba(8, 11, 15, 0.94) 0%, rgba(8, 11, 15, 0.6) 34%, transparent 60%)';
const SCRIM_LEFT = 'linear-gradient(90deg, rgba(8, 11, 15, 0.45) 0%, transparent 45%)';
// The handoff's details scrims (scrim base rgb(5,7,10)), laid over the 1.1.1 ones when restyled.
const HANDOFF_SCRIM_LEFT = 'linear-gradient(90deg, rgba(5, 7, 10, 0.6) 0%, rgba(5, 7, 10, 0.1) 55%, rgba(5, 7, 10, 0) 75%)';
const HANDOFF_SCRIM_BOTTOM = 'linear-gradient(180deg, rgba(5, 7, 10, 0) 55%, rgba(5, 7, 10, 0.6) 100%)';
/** The restyled header's scrim layers, top to bottom (the handoff's over the 1.1.1 ones); also Home's page scrim in the open transition. */
export const PAGE_SCRIM_LAYERS = [HANDOFF_SCRIM_LEFT, HANDOFF_SCRIM_BOTTOM, SCRIM_BOTTOM, SCRIM_LEFT] as const;
/**
 * Steam's own shadow along the top of the game page (its header module's TopGradient: 75 px, black .5 to clear;
 * probed on the Ally). Steam draws it on the page itself; Spotlight Home draws it too (homeCss .gh-scrim-page).
 */
export const STEAM_TOP_GRADIENT = 'linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0px, rgba(0, 0, 0, 0) 75px)';
/** The same layers as one CSS background value. */
export const PAGE_SCRIMS = PAGE_SCRIM_LAYERS.join(', ');

/**
 * The restyled page's layout in the handoff's px (`d`, --gg-d), one source for the theme below and for the open
 * transition's targets (home/openTargets). Values in px are CSS px; everything else is in d units.
 */
export const PAGE_LAYOUT = {
    /**
     * --gg-d = min(100vw / width, 100vh / height): the 1440x810 canvas, or 1280x800 at an aspect of 17/10 or narrower,
     * scaled by the limiting side as Home's (home/scale.ts homeCanvas).
     */
    canvas: { wide: 1440, wideHeight: 810, deck: 1280, deckHeight: 800, deckMaxAspect: 1.7 },
    /** The TV media query (CSS px). */
    tvQuery: { minWidth: 1408, minHeight: 793 },
    side: { base: 56, tv: 24 },
    playW: 340,
    icon: 60,
    gap: 14,
    /** The Play row: the pill (icon) and the gap under it. */
    rowH: 96,
    /** Play row top: H - spotlight; on a TV H - legend - (rowH + tvCards + tvGap). */
    playTop: { spotlight: 386, tvCards: 178, tvGap: 24 },
    /** The Clean look: the row ends max(bottom, minBelowRow px - (rowH - icon)) above the bottom; title and store pill gaps above the row. */
    clean: { bottom: 36, minBelowRow: 61, gap: 28, storeGap: 20 },
    /** The title block's bottom above the Play row (Spotlight look). */
    titleGap: 36,
    /**
     * infoW / hltbW: the cards' widest outer widths, sized to their content rather than the row (issue #53): HowLongToBeat fits
     * three 3-digit times (406 of its 420 content), the info card a little wider. Where the row has room to spare the art
     * shows between them. From equalFromAspect (9:5, wider than any 16:9 window) both are as wide as the HowLongToBeat card.
     */
    cards: { gridGap: 18, padX: 24, padY: 20, colGap: 12, hltbGap: 10, split: [1.1, 1] as const, infoW: 540, hltbW: 470, equalFromAspect: 1.8 },
    stats: { label: 11, value: 30, colGapInfo: 40, colGapHltb: 36, rowGap: 4 },
    /** The title block: the gap between title and eyebrow, and the eyebrow's type size. */
    titleBlock: { gap: 14, eyebrow: 12, title: 64 },
    /** Inside the Play pill: its glyph's inset, the glyph, the gap to the label, the label's type size. */
    pill: { padX: 24, icon: 20, iconGap: 14, font: 22 },
    /** The Play pill's "Play from" arrow (a game on more than one device): its segment's width and glyph, at the pill's right end. */
    playArrow: { w: 56, glyph: 14 },
    /** The glyph in the controller and gear circles. */
    circleIcon: 24,
    /** A focused button grows by this about its centre (Home's buttons and the page's Play, alike). */
    focusScale: 1.04,
    /** The cloud circle's glyph (Home's size; the page's was in another unit, so its ratio to Home's changed with the screen). */
    cloudIcon: 26,
    cleanInfo: { padX: 24, padY: 14, colGap: 28, value: 22, barW: 96, barH: 4, barTop: 2 },
    /** Inside the Spotlight cards: the description's type size, line height and lines (clamped), the caption's type size, the HowLongToBeat bar's height. */
    cardText: { desc: 15, descLine: 1.5, descLines: 3, caption: 15, bar: 6 },
    /** The store pill's top above the cards block (.gg-hero), Spotlight look. */
    storePillTop: 82,
} as const;
