import { definePlugin } from '@decky/api';
import { staticClasses } from '@decky/ui';
import { FaBook } from 'react-icons/fa';
import { QuickAccessPanel } from './components/QuickAccessPanel';
import { LOG_PREFIX, PLUGIN_NAME } from './constants';
import { prefs } from './data/prefs';
import { getSteamLanguage } from './data/steam';
import { startUpdateChecks } from './data/update';
import { stopDownloads } from './home/downloadStore';
import { stopStatus } from './home/statusStore';
import { patchHomePage } from './patches/homePage';
import { patchLibraryPage } from './patches/libraryPage';

export default definePlugin(() => {
    prefs.load().catch((error) => console.error(`${LOG_PREFIX} failed to load prefs`, error));
    void getSteamLanguage(); // resolve early so Home and the library render in the right locale immediately
    const unpatchHome = patchHomePage();
    const unpatchLibrary = patchLibraryPage();
    const stopUpdateChecks = startUpdateChecks();
    console.log(`${LOG_PREFIX} loaded`);

    return {
        name: PLUGIN_NAME,
        titleView: <div className={staticClasses.Title}>{PLUGIN_NAME}</div>,
        content: <QuickAccessPanel />,
        icon: <FaBook />,
        onDismount() {
            // Each step on its own: one that throws must not leave the others applied.
            const steps: [string, () => void][] = [
                ['Home unpatch', unpatchHome],
                ['Library unpatch', unpatchLibrary],
                ['update checks stop', stopUpdateChecks],
                ['downloads stop', stopDownloads],
                ['Home status bar stop', stopStatus],
            ];
            for (const [what, step] of steps) {
                try {
                    step();
                } catch (error) {
                    console.error(`${LOG_PREFIX} ${what} failed`, error);
                }
            }
            console.log(`${LOG_PREFIX} unloaded`);
        },
    };
});
