import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpotlightHome } from '../../src/home/SpotlightHome';

const g = globalThis as Record<string, unknown>;

afterEach(() => {
    delete g.collectionStore;
    delete g.appStore;
    vi.restoreAllMocks();
});

describe('SpotlightHome smoke', () => {
    it('renders with none of Steam\'s stores present', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const html = renderToString(<SpotlightHome />);
        expect(html).toContain('gh-root');
    });

    it('renders with recent games in Steam\'s stores', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const apps = [
            { appid: 620, display_name: 'Portal 2', app_type: 1, rt_last_time_played: 1_700_000_000, minutes_playtime_forever: 600, installed: true },
            { appid: 1145360, display_name: 'Hades', app_type: 1, rt_last_time_played: 1_690_000_000, minutes_playtime_forever: 1200, installed: true },
        ];
        g.collectionStore = { recentAppsCollection: { allApps: apps }, localGamesCollection: { allApps: apps }, userCollections: [] };
        g.appStore = { GetAppOverviewByAppID: (id: number) => apps.find((a) => a.appid === id), allApps: apps };
        const html = renderToString(<SpotlightHome />);
        expect(html).toContain('gh-root');
    });
});
