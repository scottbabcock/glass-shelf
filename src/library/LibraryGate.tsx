import { Component, ReactElement, ReactNode } from 'react';
import { LOG_PREFIX } from '../constants';
import { SpotlightLibrary } from './SpotlightLibrary';

interface LibraryErrorBoundaryProps {
    fallback: ReactElement;
    children: ReactNode;
}

interface LibraryErrorBoundaryState {
    failed: boolean;
}

export class LibraryGuard extends Component<LibraryErrorBoundaryProps, LibraryErrorBoundaryState> {
    state: LibraryErrorBoundaryState = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: unknown, info: unknown) {
        console.error(`${LOG_PREFIX} Spotlight Library render failed; showing Steam's Library:`, error, info);
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

export function LibraryGate({ fallback }: { fallback: ReactElement }) {
    return (
        <LibraryGuard fallback={fallback}>
            <SpotlightLibrary />
        </LibraryGuard>
    );
}
