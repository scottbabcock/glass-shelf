import { Component, ReactElement, ReactNode } from 'react';
import { LOG_PREFIX } from '../constants';

/**
 * Wraps what the Home route renders: Steam's Home tree (the fallback) and ours. An error that gets past Spotlight
 * Home's own boundary shows Steam's Home instead of a broken screen, and is logged to the console. Stays on the fallback until Home is left and opened again. It sits inside Steam's Home
 * component, never as the route child: other plugins call that child as a function, and a class there crashed Home
 * (issue #18).
 */
export class RouteGuard extends Component<{ fallback: ReactElement; children: ReactNode }, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
        console.error(`${LOG_PREFIX} Home recovered from an error; showing Steam's Home`, error, info?.componentStack);
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}
