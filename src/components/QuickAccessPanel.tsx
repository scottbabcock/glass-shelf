import { ButtonItem, PanelSection, PanelSectionRow } from '@decky/ui';
import { toaster } from '@decky/api';
import { PLUGIN_NAME } from '../constants';
import { installUpdate, UpdateState, useUpdate } from '../data/update';

function updateLine(state: UpdateState): string {
    const version = state.current ? `Version ${state.current}` : PLUGIN_NAME;
    switch (state.status) {
        case 'checking':
            return `${version} · checking for updates…`;
        case 'upToDate':
            return `${version} · up to date`;
        case 'available':
            return `${version} · ${state.release.version} is available`;
        default:
            return `${version} · could not check for updates`;
    }
}

function UpdatesSection() {
    const { state, recheck } = useUpdate();
    return (
        <PanelSection title="Updates">
            <PanelSectionRow>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{updateLine(state)}</div>
            </PanelSectionRow>
            {state.status === 'available' && (
                <PanelSectionRow>
                    <ButtonItem
                        layout="below"
                        description="Decky asks to confirm, then installs it and reloads Glass Shelf."
                        onClick={async () => {
                            if (!(await installUpdate(state.release))) {
                                toaster.toast({
                                    title: PLUGIN_NAME,
                                    body: 'Could not start the update. Install it from the release page instead.',
                                });
                            }
                        }}
                    >
                        Update to {state.release.version}
                    </ButtonItem>
                </PanelSectionRow>
            )}
            <PanelSectionRow>
                <ButtonItem layout="below" disabled={state.status === 'checking'} onClick={recheck}>
                    Check for updates
                </ButtonItem>
            </PanelSectionRow>
        </PanelSection>
    );
}

export function QuickAccessPanel() {
    return <UpdatesSection />;
}
