import { tr } from '../i18n/steamText';

export interface PlayNextCandidate {
    appId: number;
    name: string;
    playedMinutes: number;
}

export interface RecommendedCard {
    appId: number;
    name: string;
    pill: string;
    pillKey: 'playNext' | 'notStarted' | 'short' | 'sale';
    sub: string;
}

const LOW_PLAYTIME_MINUTES = 120;

/** 0: not started, 1: barely played, 2: everything else. */
function tier(c: PlayNextCandidate): number {
    if (c.playedMinutes <= 0) return 0;
    if (c.playedMinutes < LOW_PLAYTIME_MINUTES) return 1;
    return 2;
}

function hours(minutes: number): string {
    return `${Math.round((minutes / 60) * 10) / 10} h`;
}

function toCard(c: PlayNextCandidate): RecommendedCard {
    const sub = c.playedMinutes > 0 ? `${hours(c.playedMinutes)} played` : '';
    if (c.playedMinutes <= 0) return { appId: c.appId, name: c.name, pill: tr('notStarted'), pillKey: 'notStarted', sub };
    return { appId: c.appId, name: c.name, pill: tr('playNext'), pillKey: 'playNext', sub };
}

/** Owned installed games worth picking up next: not started, then barely played (least played first), then the rest. */
export function scorePlayNext(candidates: PlayNextCandidate[], excludeIds: Set<number>, limit = 8): RecommendedCard[] {
    return candidates
        .filter((c) => c.appId > 0 && c.name.length > 0 && !excludeIds.has(c.appId))
        .map((c, index) => ({ c, index, t: tier(c) }))
        .sort((a, b) => a.t - b.t || (a.t === 1 ? a.c.playedMinutes - b.c.playedMinutes : 0) || a.index - b.index)
        .slice(0, Math.max(0, limit))
        .map(({ c }) => toCard(c));
}
