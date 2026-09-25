import type { GiscusComment, GiscusDiscussionResponse, GiscusReply } from './types';
import { getGithubApiBase, getGiscusApiBase, githubGraphqlUrl } from './config';
import { emptyReactionGroups } from './reactions';
import type { ReactionKey } from './reactions';

const GISCUS_ORIGIN = 'https://giscus.app';

const ADD_COMMENT = `
	mutation($body: String!, $discussionId: ID!) {
		addDiscussionComment(input: { body: $body, discussionId: $discussionId }) {
			comment {
				id
				author { avatarUrl login url }
				viewerDidAuthor
				createdAt
				url
				authorAssociation
				lastEditedAt
				deletedAt
				isMinimized
				bodyHTML
				replies(first: 0) { totalCount nodes { id } }
			}
		}
	}`;

const ADD_REPLY = `
	mutation($body: String!, $discussionId: ID!, $replyToId: ID!) {
		addDiscussionComment(input: { body: $body, discussionId: $discussionId, replyToId: $replyToId }) {
			comment {
				id
				author { avatarUrl login url }
				viewerDidAuthor
				createdAt
				url
				authorAssociation
				lastEditedAt
				deletedAt
				isMinimized
				bodyHTML
				replyTo { id }
			}
		}
	}`;

const DELETE_COMMENT = `
	mutation($id: ID!) {
		deleteDiscussionComment(input: { id: $id }) {
			comment { id deletedAt }
		}
	}`;

export function getLoginUrl(returnUrl: string): string {
	return `${GISCUS_ORIGIN}/api/oauth/authorize?redirect_uri=${encodeURIComponent(returnUrl)}`;
}

export async function tryFetchViewer(
	token: string,
): Promise<{ avatarUrl: string; login: string; url: string } | null> {
	try {
		const res = await fetch(`${getGithubApiBase()}/user`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json',
			},
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { login?: string; avatar_url?: string; html_url?: string };
		if (!data.login || !data.avatar_url || !data.html_url) return null;
		return {
			login: data.login,
			avatarUrl: data.avatar_url,
			url: data.html_url,
		};
	} catch {
		return null;
	}
}

export async function exchangeToken(session: string): Promise<string> {
	const res = await fetch(`${getGiscusApiBase()}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ session }),
	});
	const data = (await res.json()) as { token?: string; error?: string };
	if (!res.ok || data.error) throw new Error(data.error || '无法获取登录凭证');
	if (!data.token) throw new Error('无法获取登录凭证');
	return data.token;
}

export async function fetchDiscussion(
	query: { repo: string; term: string; category: string; last?: number; after?: string },
	token?: string,
): Promise<GiscusDiscussionResponse> {
	const params = new URLSearchParams({
		repo: query.repo,
		term: query.term,
		category: query.category,
		last: String(query.last ?? 50),
	});
	if (query.after) params.set('after', query.after);

	const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
	const res = await fetch(`${getGiscusApiBase()}/discussions?${params}`, { headers });
	const data = (await res.json()) as GiscusDiscussionResponse & { error?: string };

	if (!res.ok) {
		const err = new Error(data.error || res.statusText) as Error & { status?: number };
		err.status = res.status;
		throw err;
	}
	return data;
}

export async function createDiscussion(
	token: string,
	repo: string,
	input: { repositoryId: string; categoryId: string; title: string; body: string },
): Promise<string> {
	const res = await fetch(`${getGiscusApiBase()}/discussions`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ repo, input }),
	});
	const data = (await res.json()) as { id?: string; error?: string };
	if (!res.ok || data.error) throw new Error(data.error || '无法创建讨论');
	if (!data.id) throw new Error('无法创建讨论');
	return data.id;
}

function adaptPostedComment(raw: Record<string, unknown>): GiscusComment {
	const author = raw.author as GiscusComment['author'];
	return {
		id: raw.id as string,
		author,
		viewerDidAuthor: Boolean(raw.viewerDidAuthor),
		createdAt: raw.createdAt as string,
		url: raw.url as string,
		authorAssociation: raw.authorAssociation as string,
		lastEditedAt: (raw.lastEditedAt as string | null) ?? null,
		deletedAt: (raw.deletedAt as string | null) ?? null,
		isMinimized: Boolean(raw.isMinimized),
		bodyHTML: raw.bodyHTML as string,
		replyCount: 0,
		replies: [],
		reactions: emptyReactionGroups(),
	};
}

function adaptPostedReply(raw: Record<string, unknown>): GiscusReply {
	const replyTo = raw.replyTo as { id: string };
	return {
		id: raw.id as string,
		author: raw.author as GiscusReply['author'],
		viewerDidAuthor: Boolean(raw.viewerDidAuthor),
		createdAt: raw.createdAt as string,
		url: raw.url as string,
		authorAssociation: raw.authorAssociation as string,
		lastEditedAt: (raw.lastEditedAt as string | null) ?? null,
		deletedAt: (raw.deletedAt as string | null) ?? null,
		isMinimized: Boolean(raw.isMinimized),
		bodyHTML: raw.bodyHTML as string,
		replyToId: replyTo.id,
		reactions: emptyReactionGroups(),
	};
}

interface GithubGraphqlError {
	message: string;
	type?: string;
	path?: string[];
}

async function githubGraphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
	const res = await fetch(githubGraphqlUrl(), {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables }),
	});
	const json = (await res.json()) as { data?: T; errors?: GithubGraphqlError[] };
	if (json.errors?.length) throw new Error(formatGithubError(json.errors[0]));
	if (!json.data) throw new Error('GitHub API 请求失败');
	return json.data;
}

/** 将 GitHub 英文报错转成更可读的提示 */
export function formatGithubError(error: string | GithubGraphqlError): string {
	const message = typeof error === 'string' ? error : error.message;
	if (message.includes('Bad credentials')) {
		return '登录已过期，请重新登录';
	}
	return message;
}

export async function toggleReaction(
	token: string,
	subjectId: string,
	content: ReactionKey,
	viewerHasReacted: boolean,
): Promise<void> {
	const mode = viewerHasReacted ? 'remove' : 'add';
	const query = `
		mutation($content: ReactionContent!, $subjectId: ID!) {
			toggleReaction: ${mode}Reaction(input: { content: $content, subjectId: $subjectId }) {
				reaction { content id }
			}
		}`;
	await githubGraphql(token, query, { content, subjectId });
}

export async function postComment(
	token: string,
	discussionId: string,
	body: string,
): Promise<GiscusComment> {
	const data = await githubGraphql<{
		addDiscussionComment?: { comment?: Record<string, unknown> };
	}>(token, ADD_COMMENT, { body, discussionId });
	const comment = data.addDiscussionComment?.comment;
	if (!comment) throw new Error('发表评论失败');
	return adaptPostedComment(comment);
}

export async function postReply(
	token: string,
	discussionId: string,
	replyToId: string,
	body: string,
): Promise<GiscusReply> {
	const data = await githubGraphql<{
		addDiscussionComment?: { comment?: Record<string, unknown> };
	}>(token, ADD_REPLY, { body, discussionId, replyToId });
	const reply = data.addDiscussionComment?.comment;
	if (!reply) throw new Error('发表回复失败');
	return adaptPostedReply(reply);
}

export async function deleteComment(token: string, commentId: string): Promise<void> {
	const data = await githubGraphql<{
		deleteDiscussionComment?: { comment?: { id: string } };
	}>(token, DELETE_COMMENT, { id: commentId });
	if (!data.deleteDiscussionComment?.comment) throw new Error('删除评论失败');
}

export async function renderMarkdown(text: string, token?: string, context?: string): Promise<string> {
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
	const res = await fetch(`${getGithubApiBase()}/markdown`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			mode: 'gfm',
			text,
			...(context ? { context } : {}),
		}),
	});
	if (!res.ok) throw new Error('预览渲染失败');
	return res.text();
}
