import { definePlugin } from '@decky/api';
import { staticClasses } from '@decky/ui';
import { FaBook } from 'react-icons/fa';
import { QuickAccessPanel } from './components/QuickAccessPanel';
import { LOG_PREFIX, PLUGIN_NAME } from './constants';
import { prefs } from './data/prefs';
import { getSteamLanguage } from './data/steam';
import { startUpdateChecks } from './data/update';
import { patchLibraryPage } from './patches/libraryPage';

export default definePlugin(() => {
    prefs.load().catch((error) => console.error(`${LOG_PREFIX} failed to load prefs`, error));
    void getSteamLanguage(); // resolve early so library renders in the right locale immediately
    const unpatchLibrary = patchLibraryPage();
    const stopUpdateChecks = startUpdateChecks();
    console.log(`${LOG_PREFIX} loaded`);

    return {
        name: PLUGIN_NAME,
        titleView: <div className={staticClasses.Title}>{PLUGIN_NAME}</div>,
        content: <QuickAccessPanel />,
        icon: <FaBook />,
        onDismount() {
            try {
                unpatchLibrary();
            } catch (error) {
                console.error(`${LOG_PREFIX} Library unpatch failed`, error);
            }
            try {
                stopUpdateChecks();
            } catch (error) {
                console.error(`${LOG_PREFIX} Update check cleanup failed`, error);
            }
            console.log(`${LOG_PREFIX} unloaded`);
        },
    };
});
