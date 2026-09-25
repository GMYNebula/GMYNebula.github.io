import {
	createDiscussion,
	deleteComment,
	exchangeToken,
	fetchDiscussion,
	formatGithubError,
	getLoginUrl,
	postComment,
	postReply,
	renderMarkdown,
	toggleReaction,
		tryFetchViewer,
} from '../lib/giscus/api';
import {
	PICKER_REACTIONS,
	REACTION_EMOJI,
	normalizeReactionGroups,
	toggleReactionLocal,
	type ReactionKey,
} from '../lib/giscus/reactions';
import type { ReactionGroups } from '../lib/giscus/reactions';
import { cleanPageUrl, getDiscussionTerm } from '../lib/giscus/term';
import { formatDateTime, formatRelativeTime, toDatetimeAttr } from '../utils/datetime';
import type { CommentSort, GiscusComment, GiscusDiscussion, GiscusReply, GiscusUser } from '../lib/giscus/types';

const GISCUS_SESSION_KEY = 'giscus-session';

const TRASH_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;

interface State {
	token: string;
	session: string;
	viewer: GiscusUser | null;
	discussion: GiscusDiscussion | null;
	isNotFound: boolean;
	loading: boolean;
	sortOrder: CommentSort;
	composePreview: boolean;
	menuOpen: boolean;
}

function initSession(): string {
	const url = new URL(location.href);
	const fromUrl = url.searchParams.get('giscus') || '';
	const cleaned = cleanPageUrl(location.href);

	if (fromUrl) {
		localStorage.setItem(GISCUS_SESSION_KEY, JSON.stringify(fromUrl));
		history.replaceState(undefined, document.title, cleaned);
		return fromUrl;
	}

	const saved = localStorage.getItem(GISCUS_SESSION_KEY);
	if (!saved) return '';

	try {
		const parsed: unknown = JSON.parse(saved);
		return typeof parsed === 'string' ? parsed : saved;
	} catch {
		return saved;
	}
}

function formatCommentTime(iso: string): { relative: string; full: string } {
	return {
		relative: formatRelativeTime(iso),
		full: formatDateTime(iso),
	};
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function getMetaContent(name: string): string {
	const og = document.querySelector(`meta[property='og:${name}']`) as HTMLMetaElement | null;
	const plain = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;
	return og?.content || plain?.content || '';
}

function resizeTextarea(el: HTMLTextAreaElement) {
	el.style.height = '0';
	const max = 240;
	el.style.height = `${Math.min(el.scrollHeight, max)}px`;
}

function closeAllPickers(root: HTMLElement) {
	root.querySelectorAll('.reaction-picker').forEach((el) => {
		(el as HTMLElement).hidden = true;
	});
}

export function initComments(root: HTMLElement): void {
	const repo = root.dataset.repo!;
	const repoId = root.dataset.repoId!;
	const category = root.dataset.category!;
	const categoryId = root.dataset.categoryId!;
	const term = getDiscussionTerm(location.pathname);
	const pageUrl = cleanPageUrl(location.href);

	const countEl = root.querySelector('[data-comments-count]') as HTMLElement;
	const sortEl = root.querySelector('[data-comments-sort]') as HTMLElement;
	const authEl = root.querySelector('[data-comments-auth]') as HTMLElement;
	const composeEl = root.querySelector('[data-comments-compose]') as HTMLElement;
	const listEl = root.querySelector('[data-comments-list]') as HTMLElement;
	const statusEl = root.querySelector('[data-comments-status]') as HTMLElement;

	const state: State = {
		token: '',
		session: initSession(),
		viewer: null,
		discussion: null,
		isNotFound: false,
		loading: true,
		sortOrder: 'newest',
		composePreview: false,
		menuOpen: false,
	};

	let createDiscussionPromise: Promise<string> | null = null;

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			state.menuOpen = false;
			closeAllPickers(root);
			renderAuth();
		}
	});

	document.addEventListener('click', (e) => {
		if (!state.menuOpen) return;
		const target = e.target as Node;
		if (!authEl.contains(target)) {
			state.menuOpen = false;
			renderAuth();
		}
		closeAllPickers(root);
	});

	sortEl.querySelectorAll('[data-sort]').forEach((btn) => {
		btn.addEventListener('click', () => {
			const order = btn.getAttribute('data-sort') as CommentSort;
			if (order === state.sortOrder) return;
			state.sortOrder = order;
			sortEl.querySelectorAll('[data-sort]').forEach((b) => {
				b.classList.toggle('is-active', b.getAttribute('data-sort') === order);
			});
			renderList();
		});
	});

	function showStatus(msg: string) {
		statusEl.textContent = msg;
		statusEl.hidden = !msg;
	}

	function showError(err: unknown, fallback: string) {
		const msg = err instanceof Error ? formatGithubError(err.message) : fallback;
		showStatus(msg);
	}

	function setCount(n: number | null) {
		if (n === null) countEl.textContent = '加载评论…';
		else countEl.textContent = n === 0 ? '暂无评论' : `${n} 条评论`;
		sortEl.hidden = !n || n === 0;
	}

	function isLoggedIn(): boolean {
		return Boolean(state.token);
	}

	function isBotViewer(viewer: GiscusUser | null): boolean {
		return !viewer || viewer.login === 'giscus[bot]';
	}

	function isOwnComment(item: GiscusComment | GiscusReply): boolean {
		if (item.viewerDidAuthor) return true;
		if (!isLoggedIn() || isBotViewer(state.viewer)) return false;
		return item.author.login === state.viewer!.login;
	}

	function renderDeleteButton(): string {
		return `<button type="button" class="btn-icon btn-delete" data-delete-comment aria-label="删除">${TRASH_ICON}</button>`;
	}

	function markDeleted(commentId: string, parentCommentId?: string): void {
		if (!state.discussion) return;
		const deletedAt = new Date().toISOString();
		if (parentCommentId) {
			const parent = state.discussion.comments.find((c) => c.id === parentCommentId);
			if (!parent) return;
			const idx = parent.replies.findIndex((r) => r.id === commentId);
			if (idx === -1) return;
			parent.replies[idx] = {
				...parent.replies[idx],
				deletedAt,
				bodyHTML: '',
			};
			return;
		}
		updateComment(commentId, { deletedAt, bodyHTML: '' });
	}

	async function handleDelete(commentId: string, parentCommentId?: string): Promise<void> {
		if (!isLoggedIn()) {
			showStatus('删除请先登录 GitHub');
			return;
		}
		if (!confirm('确定删除这条评论吗？')) return;
		showStatus('');
		try {
			await deleteComment(state.token, commentId);
			markDeleted(commentId, parentCommentId);
			renderList();
		} catch (err) {
			showError(err, '删除失败');
		}
	}

	async function ensureViewer(): Promise<void> {
		if (!state.token || !isBotViewer(state.viewer)) return;
		const viewer = await tryFetchViewer(state.token);
		if (viewer) state.viewer = viewer;
	}

	function getSortedComments(): GiscusComment[] {
		const comments = [...(state.discussion?.comments ?? [])];
		const byDate = (a: GiscusComment, b: GiscusComment) =>
			new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		return comments.sort(state.sortOrder === 'oldest' ? byDate : (a, b) => -byDate(a, b));
	}

	function updateComment(commentId: string, patch: Partial<GiscusComment>) {
		if (!state.discussion) return;
		const idx = state.discussion.comments.findIndex((c) => c.id === commentId);
		if (idx === -1) return;
		state.discussion.comments[idx] = { ...state.discussion.comments[idx], ...patch };
	}

	function updateReply(parentCommentId: string, replyId: string, patch: Partial<GiscusReply>) {
		if (!state.discussion) return;
		const parent = state.discussion.comments.find((c) => c.id === parentCommentId);
		if (!parent) return;
		const idx = parent.replies.findIndex((r) => r.id === replyId);
		if (idx === -1) return;
		parent.replies[idx] = { ...parent.replies[idx], ...patch };
	}

	function patchReactions(
		item: { id: string; reactions: ReactionGroups },
		patch: { reactions: ReactionGroups },
		parentCommentId?: string,
	) {
		if (parentCommentId) updateReply(parentCommentId, item.id, patch);
		else updateComment(item.id, patch);
	}

	function renderAuth() {
		authEl.hidden = false;
		if (isLoggedIn()) {
			const name = !isBotViewer(state.viewer) ? state.viewer!.login : 'GitHub 用户';
			const avatar = !isBotViewer(state.viewer) ? state.viewer!.avatarUrl : '';
			const profileUrl = !isBotViewer(state.viewer) ? state.viewer!.url : 'https://github.com';
			authEl.innerHTML = `
				<div class="comments-menu">
					<button type="button" class="comments-menu-trigger" aria-expanded="${state.menuOpen}" data-menu-toggle>
						${avatar ? `<img class="comments-avatar comments-avatar--sm" src="${escapeHtml(avatar)}" alt="" width="24" height="24" />` : ''}
						<span class="comments-menu-name">${escapeHtml(name)}</span>
						<span class="comments-menu-chevron" aria-hidden="true">▾</span>
					</button>
					<div class="comments-menu-dropdown" data-menu-dropdown ${state.menuOpen ? '' : 'hidden'}>
						<button type="button" data-compose-preview>${state.composePreview ? '继续编辑' : '预览评论'}</button>
						<button type="button" data-sign-out>退出登录</button>
					</div>
				</div>
			`;

			authEl.querySelector('[data-menu-toggle]')?.addEventListener('click', (e) => {
				e.stopPropagation();
				state.menuOpen = !state.menuOpen;
				renderAuth();
			});

			authEl.querySelector('[data-compose-preview]')?.addEventListener('click', (e) => {
				e.stopPropagation();
				state.composePreview = !state.composePreview;
				state.menuOpen = false;
				renderAuth();
				renderCompose();
			});

			authEl.querySelector('[data-sign-out]')?.addEventListener('click', () => {
				localStorage.removeItem(GISCUS_SESSION_KEY);
				state.token = '';
				state.session = '';
				state.viewer = null;
				state.composePreview = false;
				state.menuOpen = false;
				renderAuth();
				renderCompose();
				renderList();
			});
		} else {
			authEl.innerHTML = `
				<a class="comments-sign-in" href="${escapeHtml(getLoginUrl(pageUrl))}">使用 GitHub 登录</a>
			`;
		}
	}

	function renderCommentBody(container: HTMLElement) {
		container.querySelectorAll('a').forEach((a) => {
			if (a.hostname && a.hostname !== location.hostname) {
				a.target = '_blank';
				a.rel = 'noopener noreferrer';
			}
		});
		container.querySelectorAll('pre code').forEach((code) => {
			const pre = code.closest('pre');
			if (pre) pre.classList.add('comment-code-block');
		});
	}

	function bindReactionBar(
		el: HTMLElement,
		item: GiscusComment | GiscusReply,
		parentCommentId?: string,
	) {
		const bar = el.querySelector('[data-reaction-bar]') as HTMLElement;
		if (!bar || item.deletedAt || item.isMinimized) return;

		bar.querySelectorAll('[data-reaction-key]').forEach((btn) => {
			btn.addEventListener('click', async (e) => {
				e.stopPropagation();
				if (!isLoggedIn()) {
					showStatus('登录后才能添加表情');
					return;
				}
				const key = btn.getAttribute('data-reaction-key') as ReactionKey;
				const had = item.reactions[key].viewerHasReacted;
				const next = toggleReactionLocal(item.reactions, key);
				patchReactions(item, { reactions: next }, parentCommentId);
				renderList();
				try {
					await toggleReaction(state.token, item.id, key, had);
				} catch (err) {
					patchReactions(item, { reactions: toggleReactionLocal(next, key) }, parentCommentId);
					renderList();
					showError(err, '表情操作失败');
				}
			});
		});

		const addBtn = bar.querySelector('[data-reaction-add]') as HTMLButtonElement;
		const picker = bar.querySelector('[data-reaction-picker]') as HTMLElement;
		addBtn?.addEventListener('click', (e) => {
			e.stopPropagation();
			const wasOpen = Boolean(picker && !picker.hidden);
			closeAllPickers(root);
			if (picker) {
				picker.hidden = wasOpen;
				addBtn.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
			}
		});

		picker?.querySelector('[data-picker-close]')?.addEventListener('click', (e) => {
			e.stopPropagation();
			if (picker) picker.hidden = true;
			addBtn?.setAttribute('aria-expanded', 'false');
		});

		picker?.querySelectorAll('[data-pick-reaction]').forEach((btn) => {
			btn.addEventListener('click', async (e) => {
				e.stopPropagation();
				if (!isLoggedIn()) {
					showStatus('登录后才能添加表情');
					return;
				}
				const key = btn.getAttribute('data-pick-reaction') as ReactionKey;
				picker.hidden = true;
				if (item.reactions[key].viewerHasReacted) return;
				const next = toggleReactionLocal(item.reactions, key);
				patchReactions(item, { reactions: next }, parentCommentId);
				renderList();
				try {
					await toggleReaction(state.token, item.id, key, false);
				} catch (err) {
					patchReactions(item, { reactions: toggleReactionLocal(next, key) }, parentCommentId);
					renderList();
					showError(err, '表情操作失败');
				}
			});
		});
	}

	function renderReactionBarHtml(item: GiscusComment | GiscusReply): string {
		const visible = PICKER_REACTIONS.filter(
			(key) => item.reactions[key].count > 0 || item.reactions[key].viewerHasReacted,
		);
		const chips = visible
			.map((key) => {
				const g = item.reactions[key];
				return `<button type="button" class="reaction-chip${g.viewerHasReacted ? ' is-mine' : ''}" data-reaction-key="${key}" title="${key}">${REACTION_EMOJI[key]}<span>${g.count}</span></button>`;
			})
			.join('');

		const pickerBtns = PICKER_REACTIONS.map(
			(key) =>
				`<button type="button" class="reaction-pick-btn" data-pick-reaction="${key}" title="添加 ${REACTION_EMOJI[key]}">${REACTION_EMOJI[key]}</button>`,
		).join('');

		return `
			<div class="reaction-bar" data-reaction-bar>
				${chips}
				<div class="reaction-picker-wrap">
					<button type="button" class="reaction-add" data-reaction-add title="添加表情" aria-expanded="false">＋</button>
					<div class="reaction-picker" data-reaction-picker hidden>
						<div class="reaction-picker-head">
							<span>选择表情</span>
							<button type="button" class="reaction-picker-close" data-picker-close aria-label="收起">✕</button>
						</div>
						<div class="reaction-picker-grid">${pickerBtns}</div>
					</div>
				</div>
			</div>
		`;
	}

	function bindToolbar(el: HTMLElement, comment: GiscusComment) {
		bindReactionBar(el, comment);

		el.querySelector('[data-reply-to]')?.addEventListener('click', () => {
			if (!isLoggedIn()) {
				showStatus('回复请先登录 GitHub');
				return;
			}
			const box = el.querySelector('[data-reply-box]') as HTMLElement;
			if (!box.hidden) {
				box.hidden = true;
				box.innerHTML = '';
				return;
			}
			box.hidden = false;
			mountCompose(box, {
				placeholder: '写下回复…',
				replyToId: comment.id,
				onSuccess: (reply) => {
					const repliesWrap = el.querySelector('[data-replies]')!;
					repliesWrap.appendChild(renderReplyItem(reply as GiscusReply, comment.id));
					box.hidden = true;
					box.innerHTML = '';
					if (state.discussion) state.discussion.totalReplyCount += 1;
				},
			});
		});

		el.querySelector('[data-delete-comment]')?.addEventListener('click', () => {
			void handleDelete(comment.id);
		});
	}

	function bindReplyToolbar(el: HTMLElement, reply: GiscusReply, parentCommentId: string) {
		bindReactionBar(el, reply, parentCommentId);
		el.querySelector('[data-delete-comment]')?.addEventListener('click', () => {
			void handleDelete(reply.id, parentCommentId);
		});
	}

	function renderCommentItem(comment: GiscusComment): HTMLElement {
		const c: GiscusComment = {
			...comment,
			reactions: normalizeReactionGroups(comment.reactions),
		};
		const hidden = Boolean(c.deletedAt || c.isMinimized);
		const created = formatCommentTime(c.createdAt);
		const el = document.createElement('article');
		el.className = 'comment-item';
		el.dataset.commentId = c.id;
		el.innerHTML = `
			<img class="comments-avatar" src="${escapeHtml(c.author.avatarUrl)}" alt="" width="40" height="40" />
			<div class="comment-main">
				<header class="comment-meta">
					<div class="comment-meta-start">
						<a class="comment-author" href="${escapeHtml(c.author.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.author.login)}</a>
						${c.lastEditedAt ? '<span class="comment-edited">已编辑</span>' : ''}
					</div>
					<time class="comment-time" datetime="${toDatetimeAttr(c.createdAt)}" title="${escapeHtml(created.full)}">${created.relative}</time>
				</header>
				<div class="comment-body prose">${hidden ? '<p class="comment-hidden">该评论已被删除或隐藏</p>' : c.bodyHTML}</div>
				${
					hidden
						? ''
						: `<footer class="comment-toolbar">
					<div class="comment-toolbar-left">${renderReactionBarHtml(c)}</div>
					<div class="comment-toolbar-right">
						<button type="button" class="btn-pill btn-sm btn-reply" data-reply-to>回复</button>
						${isOwnComment(c) ? renderDeleteButton() : ''}
					</div>
				</footer>`
				}
				<div class="comment-replies" data-replies></div>
				<div class="comment-reply-box" data-reply-box hidden></div>
			</div>
		`;

		if (!hidden) {
			renderCommentBody(el.querySelector('.comment-body')!);
			bindToolbar(el, c);
		}

		const repliesWrap = el.querySelector('[data-replies]')!;
		for (const reply of c.replies) {
			repliesWrap.appendChild(renderReplyItem(reply, c.id));
		}

		return el;
	}

	function renderReplyItem(reply: GiscusReply, parentCommentId: string): HTMLElement {
		const r: GiscusReply = {
			...reply,
			reactions: normalizeReactionGroups(reply.reactions),
		};
		const hidden = Boolean(r.deletedAt || r.isMinimized);
		const created = formatCommentTime(r.createdAt);
		const el = document.createElement('div');
		el.className = 'comment-reply';
		el.innerHTML = `
			<img class="comments-avatar comments-avatar--sm" src="${escapeHtml(r.author.avatarUrl)}" alt="" width="28" height="28" />
			<div class="comment-main">
				<header class="comment-meta">
					<div class="comment-meta-start">
						<a class="comment-author" href="${escapeHtml(r.author.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.author.login)}</a>
					</div>
					<time class="comment-time" datetime="${toDatetimeAttr(r.createdAt)}" title="${escapeHtml(created.full)}">${created.relative}</time>
				</header>
				<div class="comment-body prose">${hidden ? '<p class="comment-hidden">该回复已被删除或隐藏</p>' : r.bodyHTML}</div>
				${
					hidden
						? ''
						: `<footer class="comment-toolbar comment-toolbar--reply">
					<div class="comment-toolbar-left">${renderReactionBarHtml(r)}</div>
					<div class="comment-toolbar-right">
						${isOwnComment(r) ? renderDeleteButton() : ''}
					</div>
				</footer>`
				}
			</div>
		`;
		if (!hidden) {
			renderCommentBody(el.querySelector('.comment-body')!);
			bindReplyToolbar(el, r, parentCommentId);
		}
		return el;
	}

	function renderList() {
		listEl.innerHTML = '';
		if (!state.discussion?.comments.length) {
			if (!state.loading && !state.isNotFound) {
				listEl.innerHTML = '<p class="comments-empty">还没有人留言，来抢沙发吧～</p>';
			}
			return;
		}
		for (const comment of getSortedComments()) {
			listEl.appendChild(renderCommentItem(comment));
		}
	}

	interface ComposeOptions {
		placeholder?: string;
		replyToId?: string;
		onSuccess?: (item: GiscusComment | GiscusReply) => void;
	}

	function mountCompose(container: HTMLElement, options: ComposeOptions = {}) {
		const isReply = Boolean(options.replyToId);
		const isMain = container === composeEl;
		const loggedIn = isLoggedIn();
		const avatarUrl =
			loggedIn && !isBotViewer(state.viewer)
				? state.viewer!.avatarUrl
				: 'https://avatars.githubusercontent.com/u/0?v=4';
		const showPreview = isMain && state.composePreview;

		container.innerHTML = `
			<div class="compose-row">
				<img class="comments-avatar" src="${escapeHtml(avatarUrl)}" alt="" width="40" height="40" ${loggedIn && !isBotViewer(state.viewer) ? '' : 'hidden'} />
				<div class="compose-main">
					<textarea class="compose-input" rows="3" placeholder="${escapeHtml(options.placeholder || '写下你的想法…')}" ${showPreview ? 'hidden' : ''} data-compose-input></textarea>
					<div class="compose-preview prose" data-compose-preview ${showPreview ? '' : 'hidden'}></div>
					<footer class="compose-footer">
						<span class="compose-hint">支持 Markdown</span>
						<div class="compose-actions">
							${isReply ? '<button type="button" class="btn-pill btn-ghost" data-cancel>取消</button>' : ''}
							${
								loggedIn
									? `<button type="button" class="btn-pill btn-primary" data-submit disabled>${isReply ? '回复' : '评论'}</button>`
									: `<a class="btn-pill btn-primary" href="${escapeHtml(getLoginUrl(pageUrl))}">登录后评论</a>`
							}
						</div>
					</footer>
				</div>
			</div>
		`;

		const textarea = container.querySelector('[data-compose-input]') as HTMLTextAreaElement | null;
		const previewEl = container.querySelector('[data-compose-preview]') as HTMLElement | null;
		const submitBtn = container.querySelector('[data-submit]') as HTMLButtonElement | null;

		async function refreshPreview() {
			if (!previewEl || !textarea) return;
			const text = textarea.value.trim();
			if (!text) {
				previewEl.innerHTML = '<p class="compose-preview-empty">暂无内容</p>';
				return;
			}
			previewEl.innerHTML = '<p class="compose-preview-loading">渲染中…</p>';
			try {
				const html = await renderMarkdown(text, state.token || undefined, repo);
				previewEl.innerHTML = html;
				renderCommentBody(previewEl);
			} catch {
				previewEl.innerHTML = '<p class="compose-preview-empty">预览失败</p>';
			}
		}

		if (showPreview) void refreshPreview();

		textarea?.addEventListener('input', () => {
			resizeTextarea(textarea);
			if (submitBtn) submitBtn.disabled = !textarea.value.trim();
		});

		container.querySelector('[data-cancel]')?.addEventListener('click', () => {
			container.innerHTML = '';
			container.hidden = true;
		});

		submitBtn?.addEventListener('click', async () => {
			if (!textarea) return;
			const body = textarea.value.trim();
			if (!body || submitBtn.disabled) return;
			submitBtn.disabled = true;
			submitBtn.textContent = '发送中…';
			showStatus('');

			try {
				let discussionId = state.discussion?.id;
				if (!discussionId) {
					discussionId = await ensureDiscussion();
				}

				if (options.replyToId) {
					const reply = await postReply(state.token, discussionId, options.replyToId, body);
					options.onSuccess?.(reply);
				} else {
					const comment = await postComment(state.token, discussionId, body);
					if (state.discussion) {
						state.discussion.comments.push(comment);
						state.discussion.totalCommentCount += 1;
					} else {
						await loadDiscussion();
					}
					setCount(state.discussion?.totalCommentCount ?? 1);
					state.composePreview = false;
					renderList();
					renderAuth();
					textarea.value = '';
					resizeTextarea(textarea);
					options.onSuccess?.(comment);
				}
			} catch (err) {
				showError(err, '发送失败');
			} finally {
				if (textarea) submitBtn.disabled = !textarea.value.trim();
				submitBtn.textContent = isReply ? '回复' : '评论';
			}
		});

		if (textarea) resizeTextarea(textarea);
	}

	function renderCompose() {
		composeEl.innerHTML = '';
		if (state.discussion?.locked) {
			composeEl.innerHTML = '<p class="comments-locked">该讨论已锁定，无法继续评论</p>';
			return;
		}
		mountCompose(composeEl);
	}

	async function ensureDiscussion(): Promise<string> {
		if (state.discussion?.id) return state.discussion.id;
		if (createDiscussionPromise) return createDiscussionPromise;

		const description = getMetaContent('description');
		const body = `# ${term}\n\n${description}\n\n${pageUrl}`;

		createDiscussionPromise = createDiscussion(state.token, repo, {
			repositoryId: repoId,
			categoryId,
			title: term,
			body,
		}).then((id) => {
			state.isNotFound = false;
			return id;
		});

		return createDiscussionPromise;
	}

	async function loadDiscussion() {
		state.loading = true;
		setCount(null);
		showStatus('');

		try {
			const data = await fetchDiscussion({ repo, term, category, last: 50 }, state.token || undefined);
			if (data.viewer.login !== 'giscus[bot]') {
				state.viewer = data.viewer;
			}
			state.discussion = data.discussion;
			state.isNotFound = false;
			setCount(data.discussion.totalCommentCount);
		} catch (err) {
			const error = err as Error & { status?: number };
			if (error.status === 404) {
				state.isNotFound = true;
				state.discussion = null;
				setCount(0);
			} else if (error.status === 429) {
				showStatus('请求过于频繁，请稍后再试或登录 GitHub');
				setCount(null);
			} else {
				showStatus(error.message || '加载评论失败');
				setCount(null);
			}
		} finally {
			state.loading = false;
			await ensureViewer();
			renderAuth();
			renderCompose();
			renderList();
		}
	}

	async function bootstrap() {
		let authError = '';
		if (state.session) {
			try {
				state.token = await exchangeToken(state.session);
			} catch (err) {
				localStorage.removeItem(GISCUS_SESSION_KEY);
				state.session = '';
				state.token = '';
				authError = err instanceof Error ? err.message : '登录已失效，请重新登录';
			}
		}
		await loadDiscussion();
		if (authError) showStatus(authError);
	}

	bootstrap();
}

document.querySelectorAll<HTMLElement>('[data-comments-root]').forEach(initComments);
