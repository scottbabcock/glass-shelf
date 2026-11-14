import { describe, expect, it, vi } from 'vitest';

import { RouteGuard } from '../../src/home/RouteGuard';

const fallback = { type: 'steam-home' } as never;
const child = { type: 'spotlight-home' } as never;

function guard(children = child) {
    const instance = new RouteGuard({ fallback, children });
    return instance;
}

describe('RouteGuard (the whole Home route)', () => {
    it('shows its children while nothing has failed', () => {
        expect(guard().render()).toBe(child);
    });

    it("on an error shows Steam's Home (the fallback) instead", () => {
        const failed = RouteGuard.getDerivedStateFromError(new Error('boom'));
        expect(failed).toEqual({ failed: true });
        const instance = guard();
        instance.state = failed;
        expect(instance.render()).toBe(fallback);
    });

    it('logs the error with the component stack', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const instance = guard();
        const err = new Error('Minified React error #130');
        instance.componentDidCatch(err, { componentStack: '\n    at RouterHook\n    at Home' } as never);
        expect(error).toHaveBeenCalledTimes(1);
        expect(error.mock.calls[0]).toContain(err);
        expect(String(error.mock.calls[0][2])).toContain('at RouterHook');
        error.mockRestore();
    });
});
