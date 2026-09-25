import type { ReactionKey } from './reactions';

/**
 * 评论区「＋」里展示哪些表情 — 改这一行列表即可。
 *
 * key 必须是 GitHub 支持的 ReactionContent（见下方 COMMENT_REACTION_EMOJI）。
 * 不能添加 GitHub API 以外的自定义 emoji，只能换显示符号或调整顺序/_subset。
 */
export const COMMENT_REACTION_PICKER: ReactionKey[] = [
	'THUMBS_UP',
	'HEART',
	'LAUGH',
	'HOORAY',
	'ROCKET',
	'EYES',
];

/**
 * 每个 key 在 UI 上显示的 emoji — 可改成你喜欢的符号，API 仍用左侧 key。
 */
export const COMMENT_REACTION_EMOJI: Record<ReactionKey, string> = {
	THUMBS_UP: '👍',
	THUMBS_DOWN: '👎',
	LAUGH: '😄',
	HOORAY: '🎉',
	CONFUSED: '😕',
	HEART: '❤️',
	ROCKET: '🚀',
	EYES: '👀',
};
