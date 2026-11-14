import { describe, expect, it } from 'vitest';
import { PlayNextCandidate, scorePlayNext } from '../../src/home/playNext';

const c = (appId: number, playedMinutes: number, name = `G${appId}`): PlayNextCandidate => ({ appId, name, playedMinutes });

describe('scorePlayNext', () => {
    it('ranks not started before low playtime before the rest', () => {
        const cards = scorePlayNext([c(3, 600), c(2, 30), c(1, 0)], new Set());
        expect(cards.map((x) => x.appId)).toEqual([1, 2, 3]);
    });
    it('excludes the given ids and never-installed or hidden entries', () => {
        const cards = scorePlayNext([c(1, 0), c(2, 0), c(0, 0), c(4, 0, '')], new Set([2]));
        expect(cards.map((x) => x.appId)).toEqual([1]);
    });
    it('pills: Not started, else Play next, with the time played', () => {
        const [a, b] = scorePlayNext([c(1, 0), c(2, 900)], new Set());
        expect([a.pill, a.pillKey, a.sub]).toEqual(['Not started', 'notStarted', '']);
        expect([b.pill, b.pillKey, b.sub]).toEqual(['Play next', 'playNext', '15 h played']);
    });
    it('respects the limit and an empty list', () => {
        expect(scorePlayNext([c(1, 0), c(2, 0), c(3, 0)], new Set(), 2)).toHaveLength(2);
        expect(scorePlayNext([], new Set())).toEqual([]);
    });
    it('orders low-playtime games least played first, and keeps the given order otherwise', () => {
        expect(scorePlayNext([c(1, 90), c(2, 10), c(3, 50)], new Set()).map((x) => x.appId)).toEqual([2, 3, 1]);
        expect(scorePlayNext([c(1, 900), c(2, 300), c(3, 600)], new Set()).map((x) => x.appId)).toEqual([1, 2, 3]);
    });
});
