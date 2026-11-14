import { RoutePatch, routerHook } from '@decky/api';
import { afterPatch } from '@decky/ui';
import { LOG_PREFIX } from '../constants';
import { HOME_ROUTE, isKnownHomeShape, isMemoHome, isPatchableHomeType } from '../home/guard';
import { HomeGate } from '../home/HomeGate';
import { RouteGuard } from '../home/RouteGuard';

const KEY = 'glass-shelf-home';
const warned = new Set<string>();

// Each kind of problem is logged once: Decky re-runs the patch on every router render.
const warnOnce = (message: string, error?: unknown) => {
    if (warned.has(message)) return;
    warned.add(message);
    console.warn(`${LOG_PREFIX} ${message}; leaving Steam's Home unchanged`, ...(error === undefined ? [] : [error]));
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// One patched copy of each Steam Home memo type: the same type object every render, so React never remounts Home.
const patchedMemos = new WeakMap<object, any>();

function patchedMemo(memoType: any): any {
    const cached = patchedMemos.get(memoType);
    if (cached) return cached;
    const copy = { ...memoType };
    afterPatch(copy, 'type', (_: unknown[], nativeTree: any) => (
        <RouteGuard key={KEY} fallback={nativeTree}>
            <HomeGate>{nativeTree}</HomeGate>
        </RouteGuard>
    ));
    patchedMemos.set(memoType, copy);
    return copy;
}

// Steam's Home stays in place and Spotlight Home replaces only what it renders (issue #18). Other plugins patch this
// route too: SteamGridDB calls the route child's type as a plain function and wraps the memo element it returns, so
// every type we hand on must be a function or Steam's memo shape, never a class. Steam's own memo is never changed:
// we render a patched copy. Decky re-runs this on every router render (rare: only when a plugin adds or removes a
// route or patch, measured on device); an unknown shape leaves the route exactly as Steam built it.
const homeRoutePatch: RoutePatch = (routeProps: any) => {
    try {
        if (!isKnownHomeShape(routeProps) || !isPatchableHomeType(routeProps.children.type)) {
            warnOnce("Home route shape changed");
            return routeProps;
        }
        afterPatch(routeProps.children, 'type', (_: unknown[], element: any) => {
            try {
                if (!isMemoHome(element)) {
                    warnOnce("Steam's Home element changed");
                    return element;
                }
                return { ...element, type: patchedMemo(element.type) };
            } catch (error) {
                warnOnce('Home route patch failed', error);
                return element;
            }
        });
        return routeProps;
    } catch (error) {
        warnOnce('Home route patch failed', error);
        return routeProps;
    }
};

// Patches Steam's Home route at plugin load; the returned function removes it at unload. Never throws, so a failure
// here cannot stop the plugin loading.
export function patchHomePage(): () => void {
    let patched = false;
    let handle: RoutePatch | undefined;
    try {
        handle = routerHook.addPatch(HOME_ROUTE, homeRoutePatch);
        patched = true;
    } catch (error) {
        console.warn(`${LOG_PREFIX} Home route patch failed; leaving Steam's Home unchanged`, error);
    }
    return () => {
        if (!patched) return;
        patched = false;
        try {
            routerHook.removePatch(HOME_ROUTE, handle as RoutePatch);
        } catch (error) {
            console.warn(`${LOG_PREFIX} Home route unpatch failed`, error);
        }
    };
}
