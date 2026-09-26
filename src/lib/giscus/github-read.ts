import { getGithubApiBase } from './config';
import { emptyReactionGroups } from './reactions';
import type { ReactionKey, ReactionGroups } from './reactions';
import type { GiscusComment, GiscusDiscussionResponse, GiscusReply, GiscusUser } from './types';

const REST_TO_REACTION: Record<string, ReactionKey> = {
	'+1': 'THUMBS_UP',
	'-1': 'THUMBS_DOWN',
	laugh: 'LAUGH',
	hooray: 'HOORAY',
	confused: 'CONFUSED',
	heart: 'HEART',
	rocket: 'ROCKET',
	eyes: 'EYES',
};

const GITHUB_HEADERS = {
	Accept: 'application/vnd.github+json',
	'X-GitHub-Api-Version': '2022-11-28',
};

function normalizeTerm(term: string): string {
	return term.replace(/^\/+|\/+$/g, '');
}

function authHeaders(token?: string): HeadersInit {
	return token
		? { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` }
		: GITHUB_HEADERS;
}

function httpError(status: number, message: string): Error & { status: number } {
	const err = new Error(message) as Error & { status: number };
	err.status = status;
	return err;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function fallbackHtml(md: string): string {
	return `<p>${escapeHtml(md).replace(/\n/g, '<br>')}</p>`;
}

async function githubJson<T>(url: string, token?: string): Promise<T> {
	const res = await fetch(url, { headers: authHeaders(token) });
	if (!res.ok) {
		let message = res.statusText;
		try {
			const body = (await res.json()) as { message?: string };
			if (body.message) message = body.message;
		} catch {
			/* ignore */
		}
		throw httpError(res.status, message);
	}
	return (await res.json()) as T;
}

async function toHtml(text: string, token?: string): Promise<string> {
	try {
		const res = await fetch(`${getGithubApiBase()}/markdown`, {
			method: 'POST',
			headers: {
				...authHeaders(token),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ mode: 'gfm', text }),
		});
		if (res.ok) return await res.text();
	} catch {
		/* ignore */
	}
	return fallbackHtml(text);
}

interface RestUser {
	login: string;
	avatar_url: string;
	html_url: string;
}

interface RestDiscussion {
	node_id: string;
	number: number;
	title: string;
	html_url: string;
	locked: boolean;
	comments: number;
	category?: { name: string };
}

interface RestComment {
	id: number;
	node_id: string;
	html_url: string;
	parent_id: number | null;
	user: RestUser | null;
	created_at: string;
	updated_at: string;
	body: string;
	author_association: string;
	reactions?: Record<string, number>;
}

function mapUser(user: RestUser | null): GiscusUser {
	if (!user) {
		return { login: 'ghost', avatarUrl: '', url: 'https://github.com/ghost' };
	}
	return {
		login: user.login,
		avatarUrl: user.avatar_url,
		url: user.html_url,
	};
}

function mapReactions(raw?: Record<string, number>): ReactionGroups {
	const groups = emptyReactionGroups();
	if (!raw) return groups;
	for (const [restKey, gqlKey] of Object.entries(REST_TO_REACTION)) {
		const count = raw[restKey];
		if (typeof count === 'number' && count > 0) {
			groups[gqlKey] = { count, viewerHasReacted: false };
		}
	}
	return groups;
}

const BOT_VIEWER: GiscusUser = {
	avatarUrl: 'https://avatars.githubusercontent.com/in/106117?v=4',
	login: 'giscus[bot]',
	url: 'https://github.com/apps/giscus',
};

/**
 * 浏览器直连 giscus.app/api 会被 CORS 拦住（只允许 origin=giscus.app）。
 * GitHub REST 对公开仓库开放 CORS，生产环境用这条读评论。
 */
export async function fetchDiscussionFromGithub(
	query: { repo: string; term: string; category: string },
	token?: string,
): Promise<GiscusDiscussionResponse> {
	const [owner, name] = query.repo.split('/');
	if (!owner || !name) throw httpError(400, '评论仓库配置无效');

	const want = normalizeTerm(query.term);
	const list = await githubJson<RestDiscussion[]>(
		`${getGithubApiBase()}/repos/${owner}/${name}/discussions?per_page=100`,
		token,
	);
	const found = list.find(
		(item) =>
			normalizeTerm(item.title) === want &&
			(!query.category || item.category?.name === query.category),
	);

	if (!found) throw httpError(404, 'Discussion not found');

	const rawComments = await githubJson<RestComment[]>(
		`${getGithubApiBase()}/repos/${owner}/${name}/discussions/${found.number}/comments?per_page=100`,
		token,
	);

	const byNumeric = new Map<number, RestComment>();
	for (const c of rawComments) byNumeric.set(c.id, c);

	const htmlByNode = new Map<string, string>();
	await Promise.all(
		rawComments.map(async (c) => {
			htmlByNode.set(c.node_id, await toHtml(c.body || '', token));
		}),
	);

	const repliesByParent = new Map<string, GiscusReply[]>();
	const roots: GiscusComment[] = [];

	for (const c of rawComments) {
		if (c.parent_id) {
			const parent = byNumeric.get(c.parent_id);
			if (!parent) continue;
			const reply: GiscusReply = {
				id: c.node_id,
				author: mapUser(c.user),
				viewerDidAuthor: false,
				createdAt: c.created_at,
				url: c.html_url,
				authorAssociation: c.author_association,
				lastEditedAt: c.updated_at !== c.created_at ? c.updated_at : null,
				deletedAt: null,
				isMinimized: false,
				bodyHTML: htmlByNode.get(c.node_id) || fallbackHtml(c.body || ''),
				replyToId: parent.node_id,
				reactions: mapReactions(c.reactions),
			};
			const bucket = repliesByParent.get(parent.node_id) ?? [];
			bucket.push(reply);
			repliesByParent.set(parent.node_id, bucket);
			continue;
		}

		const replies = repliesByParent.get(c.node_id) ?? [];
		roots.push({
			id: c.node_id,
			author: mapUser(c.user),
			viewerDidAuthor: false,
			createdAt: c.created_at,
			url: c.html_url,
			authorAssociation: c.author_association,
			lastEditedAt: c.updated_at !== c.created_at ? c.updated_at : null,
			deletedAt: null,
			isMinimized: false,
			bodyHTML: htmlByNode.get(c.node_id) || fallbackHtml(c.body || ''),
			replyCount: replies.length,
			replies,
			reactions: mapReactions(c.reactions),
		});
	}

	// 回复可能出现在父评论之前，再补一轮
	for (const root of roots) {
		const replies = repliesByParent.get(root.id) ?? [];
		root.replies = replies;
		root.replyCount = replies.length;
	}

	const totalReplyCount = rawComments.filter((c) => c.parent_id).length;

	return {
		viewer: BOT_VIEWER,
		discussion: {
			id: found.node_id,
			url: found.html_url,
			locked: found.locked,
			totalCommentCount: roots.length,
			totalReplyCount,
			comments: roots,
			pageInfo: { hasNextPage: false, endCursor: '' },
		},
	};
}
