import { Navigation } from '@decky/ui';
import { LOG_PREFIX } from '../constants';
import { noteLibrary } from '../library/libraryMemory';
import { markLeaving, noteHome } from './homeMemory';
import { playNavSound } from '../library/navSound';
import { takeSteamFocus } from './steamFocus';

/** Opens a game's page directly, without the transition (Play pill fallbacks, Steam call fallbacks). */
export function openPage(appId: number) {
    markLeaving();
    try {
        Navigation.Navigate(`/library/app/${appId}`);
    } catch (error) {
        console.warn(`${LOG_PREFIX} Home: could not open the game page`, error);
    }
}

const validAppId = (appId: number) => Number.isInteger(appId) && appId > 0;

/** The url the Library's own "Store Page" button opens (probed on the Ally: `Navigator.SteamWeb('steam://store/' + appid)`). */
export function storeSteamUrl(appId: number): string | null {
    return validAppId(appId) ? `steam://store/${appId}` : null;
}

/** The game's store page on the web (fallback). */
export function storeWebUrl(appId: number): string | null {
    return validAppId(appId) ? `https://store.steampowered.com/app/${appId}/` : null;
}

/** One news event on the store's news pages (fallback). Event gids are decimal strings. */
export function newsWebUrl(appId: number, gid: string): string | null {
    return validAppId(appId) && /^\d+$/.test(gid) ? `https://store.steampowered.com/news/app/${appId}/view/${gid}` : null;
}

/** Opens a web page in Steam's external web view; guarded. */
function openExternal(url: string | null, what: string) {
    if (!url) return;
    try {
        Navigation.NavigateToExternalWeb(url);
    } catch (error) {
        console.warn(`${LOG_PREFIX} Home: could not open the ${what}`, error);
    }
}

/**
 * Opens a game's store page in the client, as the Library's "Store Page" button does (SteamWeb with the
 * steam://store url); the web store page if that throws. No open transition.
 */
export function openStorePage(appId: number) {
    const url = storeSteamUrl(appId);
    if (!url) return;
    markLeaving();
    try {
        Navigation.NavigateToSteamWeb(url);
        return;
    } catch (error) {
        console.warn(`${LOG_PREFIX} Home: could not open the store page in Steam`, error);
    }
    openExternal(storeWebUrl(appId), 'store page');
}

type SteamNavGlobals = {
    SteamUIStore?: { GetFocusedWindowInstance?(): { Navigator?: { App?(appId: number, options: { gidPartnerEvent: string }): void } } | null | undefined };
    appStore?: { GetAppOverviewByAppID?(appId: number): unknown };
};

/**
 * Opens one news event the way Game Mode's own What's New and game pages do (probed on the Ally): the window's
 * `Navigator.App(appid, { gidPartnerEvent: gid })`, which shows the event over the game's page. The tracking
 * call those handlers also make (TrackEventClickedByUser) is deliberately not made. Steam's App() silently does
 * nothing for a game without an app overview, so then (or without the navigator, or if it throws) the event's
 * store news page opens on the web. No gid: the game's page. No open transition.
 */
export function openNews(appId: number, gid: string) {
    markLeaving();
    if (!/^\d+$/.test(gid)) {
        openPage(appId);
        return;
    }
    try {
        const steam = globalThis as unknown as SteamNavGlobals;
        const navigator = steam.SteamUIStore?.GetFocusedWindowInstance?.()?.Navigator;
        if (typeof navigator?.App === 'function' && steam.appStore?.GetAppOverviewByAppID?.(appId)) {
            navigator.App(appId, { gidPartnerEvent: gid });
            return;
        }
    } catch (error) {
        console.warn(`${LOG_PREFIX} Home: could not open the event in Steam`, error);
    }
    openExternal(newsWebUrl(appId, gid), 'news page');
}

/** Opens Steam's Library: its own library-tab call when present, else the /library route. */
export function openLibrary() {
    markLeaving();
    try {
        if (typeof Navigation.NavigateToLibraryTab === 'function') Navigation.NavigateToLibraryTab();
        else Navigation.Navigate('/library');
    } catch (error) {
        console.warn(`${LOG_PREFIX} Home: could not open the library`, error);
    }
}

/**
 * Opens a library collection directly: when Spotlight Library is enabled, prepares the library memory to restore
 * straight to that sub-collection (or Favorites/Installed categories) and opens the library; in native Steam,
 * navigates to Steam's collection path `/library/collection/:id`.
 */
export function openCollection(collectionId: string) {
    const isFav = collectionId === 'favorite' || collectionId === 'favorites';
    const isInstalled = collectionId === 'local-install' || collectionId === 'installed';
    noteLibrary({
        categoryId: isFav ? 'favorites' : isInstalled ? 'installed' : 'collections',
        subCollectionId: isFav || isInstalled ? null : collectionId,
        focusZone: 'grid',
    });
    openLibrary();
}

/**
 * Moves gamepad focus to a Home element (the handoff's "focus item 0 via a ref"): the one mechanism used by the
 * restore, the Library card hand-off and every B step (tabs -> the Play pill, feed -> tabs), so there is a single fix point.
 * Steam's gamepad focus normally follows DOM focus; when it does not (Steam's window without system focus), the
 * element's own navigation node takes it (steamFocus). Warns when the element did not take DOM focus (device diagnostic).
 */
export function focusElement(el: HTMLElement | null | undefined, what: string, steamFocus: (el: HTMLElement) => boolean = takeSteamFocus) {
    try {
        if (!el) return;
        el.focus({ preventScroll: true });
        if (el.ownerDocument?.activeElement !== el) console.warn(`${LOG_PREFIX} Home: ${what} did not take focus`);
        // Steam's gamepad focus (what the controller drives) did not follow: its window has no system focus. Hand it over
        // directly, as Steam's own D-pad does (steamFocus).
        if (!el.classList?.contains('gpfocus')) steamFocus(el);
    } catch (error) {
        console.warn(`${LOG_PREFIX} Home: could not focus ${what}`, error);
    }
}

/**
 * focusElement now and once more on the next frame, unless the element holds focus by then: Steam may apply a
 * preferred focus after Home mounts, which would otherwise win over a restore.
 */
export function focusElementSettled(el: HTMLElement | null | undefined, what: string) {
    focusElement(el, what);
    try {
        const view = el?.ownerDocument?.defaultView;
        view?.requestAnimationFrame(() => {
            try {
                if (el && el.isConnected && !el.contains(el.ownerDocument.activeElement)) focusElement(el, what);
            } catch {
                // element gone
            }
        });
    } catch {
        // no frame callback; the first attempt stands
    }
}

/**
 * Opens a game's page from Home (a card, the info button, a feed card): Steam's own page, without a morph transition,
 * as the Library does. `source` is the pressed element; a feed card's game is not remembered as Home's selection.
 */
export function openGame(appId: number, source?: HTMLElement | null) {
    playNavSound('IntoGameDetail');
    if (!source?.closest?.('.gh-feed')) {
        noteHome({ recent: { kind: 'game', appId } });
    }
    openPage(appId);
}

type UrlApis = { WebChat?: { OpenURLInClient?(url: string, pid: number, external: boolean): void }; URL?: { ExecuteSteamURL?(url: string): void } };

/**
 * Opens a steam:// url the way Steam's own friends menu does (its link opener: SteamClient.WebChat.OpenURLInClient
 * when the client has it, else the url itself), here for Join Game. Falls back to SteamClient.URL.ExecuteSteamURL.
 * Logs and does nothing when neither exists.
 */
export function openSteamUrl(url: string) {
    try {
        const client = (globalThis as { SteamClient?: UrlApis }).SteamClient;
        if (typeof client?.WebChat?.OpenURLInClient === 'function') return client.WebChat.OpenURLInClient(url, 0, false);
        if (typeof client?.URL?.ExecuteSteamURL === 'function') return client.URL.ExecuteSteamURL(url);
        console.warn(`${LOG_PREFIX} Home: no way to open ${url}`);
    } catch (error) {
        console.warn(`${LOG_PREFIX} Home: could not open ${url}`, error);
    }
}
