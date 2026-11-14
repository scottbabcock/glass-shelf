import { useState } from 'react';
import { SpotlightLibraryPreview } from './SpotlightLibraryPreview';

type DeviceMode = 'handheld' | 'tv';

const FRAME: Record<DeviceMode, { width: number; height: number }> = {
    handheld: { width: 1280, height: 800 },
    tv: { width: 1920, height: 1080 },
};

export function App() {
    const [deviceMode, setDeviceMode] = useState<DeviceMode>('handheld');
    const frame = FRAME[deviceMode];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
            <header style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <strong style={{ marginRight: 12 }}>Glass Shelf playground</strong>
                {(Object.keys(FRAME) as DeviceMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setDeviceMode(mode)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #30363d',
                            background: mode === deviceMode ? '#1f6feb' : '#161b22',
                            color: '#f0f6fc',
                            cursor: 'pointer',
                        }}
                    >
                        {mode === 'handheld' ? 'Handheld 1280×800' : 'TV 1920×1080'}
                    </button>
                ))}
            </header>
            <div style={{ width: frame.width, height: frame.height, maxWidth: '100%', position: 'relative', background: '#05070a', overflow: 'hidden' }}>
                <SpotlightLibraryPreview deviceMode={deviceMode} />
            </div>
        </div>
    );
}
