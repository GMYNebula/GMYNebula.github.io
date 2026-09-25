import { COMMENT_REACTION_EMOJI, COMMENT_REACTION_PICKER } from './reaction-config';

export type ReactionKey = keyof typeof COMMENT_REACTION_EMOJI;

export const REACTION_EMOJI = COMMENT_REACTION_EMOJI;
export const PICKER_REACTIONS = COMMENT_REACTION_PICKER;

export interface ReactionGroup {
	count: number;
	viewerHasReacted: boolean;
}

export type ReactionGroups = Record<ReactionKey, ReactionGroup>;

export function emptyReactionGroups(): ReactionGroups {
	return (Object.keys(REACTION_EMOJI) as ReactionKey[]).reduce((acc, key) => {
		acc[key] = { count: 0, viewerHasReacted: false };
		return acc;
	}, {} as ReactionGroups);
}

export function normalizeReactionGroups(partial?: Partial<ReactionGroups>): ReactionGroups {
	const base = emptyReactionGroups();
	if (!partial) return base;
	for (const key of Object.keys(base) as ReactionKey[]) {
		if (partial[key]) base[key] = partial[key]!;
	}
	return base;
}

export function toggleReactionLocal(groups: ReactionGroups, key: ReactionKey): ReactionGroups {
	const g = groups[key];
	const diff = g.viewerHasReacted ? -1 : 1;
	return {
		...groups,
		[key]: {
			count: Math.max(0, g.count + diff),
			viewerHasReacted: !g.viewerHasReacted,
		},
	};
}
