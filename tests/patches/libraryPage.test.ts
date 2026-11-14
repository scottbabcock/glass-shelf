import { routerHook } from '@decky/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { patchLibraryPage } from '../../src/patches/libraryPage';

afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(routerHook.addPatch).mockReset();
    vi.mocked(routerHook.removePatch).mockReset();
});

describe('patchLibraryPage', () => {
    it('patches the library routes on load and removes them on unload', () => {
        const unpatch = patchLibraryPage();
        const routes = vi.mocked(routerHook.addPatch).mock.calls.map((c) => c[0]);
        expect(routes).toEqual(['/library/games', '/library/all', '/library']);
        expect(routerHook.removePatch).not.toHaveBeenCalled();

        unpatch();
        expect(vi.mocked(routerHook.removePatch).mock.calls.map((c) => c[0])).toEqual(routes);
    });

    it('never throws and returns an unpatch function when addPatch throws', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.mocked(routerHook.addPatch).mockImplementation(() => {
            throw new Error('boom');
        });
        let unpatch: (() => void) | undefined;
        expect(() => {
            unpatch = patchLibraryPage();
        }).not.toThrow();
        expect(typeof unpatch).toBe('function');
        expect(() => unpatch?.()).not.toThrow();
        expect(routerHook.removePatch).not.toHaveBeenCalled();
    });
});
