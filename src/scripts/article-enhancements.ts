import { getMermaidConfig, resetMermaidNodes } from '../lib/mermaid-theme';
import { collectMermaidRenderNodes, upgradeMermaidBlocks } from '../lib/mermaid-blocks';
import { CHECK_ICON, COPY_ICON } from '../lib/icons';

/** 锚点跳转时避开 sticky 顶栏（脚注、标题、目录） */
export function initAnchorScroll(): void {
	const header = () => document.querySelector<HTMLElement>('.site-header');

	const offset = () => (header()?.offsetHeight ?? 56) + 12;

	const scrollToEl = (el: HTMLElement) => {
		const top = el.getBoundingClientRect().top + window.scrollY - offset();
		window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
	};

	document.addEventListener('click', (e) => {
		const target = e.target as Element | null;
		const link = target?.closest<HTMLAnchorElement>('a[href^="#"]');
		if (!link) return;

		const hash = link.getAttribute('href');
		if (!hash || hash === '#') return;

		const id = decodeURIComponent(hash.slice(1));
		const el = document.getElementById(id);
		if (!el) return;

		e.preventDefault();
		history.pushState(null, '', hash);
		scrollToEl(el);
	});

	const scrollFromHash = () => {
		const id = decodeURIComponent(location.hash.slice(1));
		if (!id) return;
		const el = document.getElementById(id);
		if (el) requestAnimationFrame(() => scrollToEl(el));
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', scrollFromHash, { once: true });
	} else {
		scrollFromHash();
	}

	window.addEventListener('hashchange', scrollFromHash);
}

function bindMermaidCopyButtons(root: ParentNode = document): void {
	for (const figure of root.querySelectorAll<HTMLElement>('.mermaid-figure')) {
		const host = figure.querySelector<HTMLElement>('.mermaid');
		const copyBtn = figure.querySelector<HTMLButtonElement>('[data-mermaid-copy]');
		if (!host || !copyBtn || copyBtn.dataset.bound) continue;

		const source = (host.dataset.mermaidSource ?? '').trim();
		copyBtn.innerHTML = COPY_ICON;
		copyBtn.dataset.bound = '1';
		copyBtn.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(source);
				copyBtn.innerHTML = CHECK_ICON;
				copyBtn.classList.add('is-copied');
				copyBtn.setAttribute('aria-label', '已复制');
				setTimeout(() => {
					copyBtn.innerHTML = COPY_ICON;
					copyBtn.classList.remove('is-copied');
					copyBtn.setAttribute('aria-label', '复制 Mermaid 源码');
				}, 1600);
			} catch {
				copyBtn.setAttribute('aria-label', '复制失败');
			}
		});
	}
}

let mermaidTask: Promise<void> = Promise.resolve();
let mermaidApi: typeof import('mermaid')['default'] | null = null;
let proseObserver: MutationObserver | null = null;
let enhancementsBound = false;

export function initMermaidDiagrams(rerender = false): Promise<void> {
	mermaidTask = mermaidTask
		.then(() => renderMermaidDiagrams(rerender))
		.catch((err) => {
			console.error('[mermaid]', err);
		});
	return mermaidTask;
}

async function loadMermaid(): Promise<typeof import('mermaid')['default']> {
	if (mermaidApi) return mermaidApi;
	try {
		({ default: mermaidApi } = await import('mermaid'));
	} catch (firstErr) {
		await new Promise((r) => setTimeout(r, 800));
		try {
			({ default: mermaidApi } = await import('mermaid'));
		} catch (retryErr) {
			console.error('[mermaid] load failed', retryErr ?? firstErr);
			throw retryErr ?? firstErr;
		}
	}
	return mermaidApi!;
}

async function renderMermaidDiagrams(rerender = false): Promise<void> {
	if (rerender) resetMermaidNodes();

	// 先把热更新漏掉的 EC/原始 mermaid 代码块升级成 figure
	upgradeMermaidBlocks(document);
	const figures = document.querySelectorAll<HTMLElement>('.mermaid-figure');
	if (!figures.length) return;

	let mermaid: typeof import('mermaid')['default'];
	try {
		mermaid = await loadMermaid();
	} catch {
		for (const figure of figures) {
			figure.classList.add('is-error');
			let note = figure.querySelector<HTMLElement>('.mermaid-error');
			if (!note) {
				note = document.createElement('p');
				note.className = 'mermaid-error';
				note.textContent = '图表模块加载失败，请硬刷新；仍无效则重启 dev（npm run dev:clean）。';
				figure.querySelector('.mermaid')?.after(note);
			}
		}
		return;
	}

	// 每次换页/换主题都重新 initialize，确保 gitGraph 配色等生效
	mermaid.initialize(getMermaidConfig());
	bindMermaidCopyButtons(document);

	const nodes = collectMermaidRenderNodes(document);
	for (const [index, node] of nodes.entries()) {
		const figure = node.closest<HTMLElement>('.mermaid-figure');
		const source = (node.dataset.mermaidSource ?? node.textContent ?? '').trim();
		if (!source) continue;
		try {
			const { svg } = await mermaid.render(
				`gitblog-mmd-${index}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
				source,
			);
			node.innerHTML = svg;
			node.setAttribute('data-processed', 'true');
			figure?.classList.remove('is-error');
			figure?.querySelector('.mermaid-error')?.remove();
		} catch (err) {
			figure?.classList.add('is-error');
			let note = figure?.querySelector<HTMLElement>('.mermaid-error');
			if (figure && !note) {
				note = document.createElement('p');
				note.className = 'mermaid-error';
				note.textContent = '这张图画失败了，可复制右上角源码排查语法。';
				node.after(note);
			}
			console.error('[mermaid] render failed', err);
		}
	}
}

function attachProseObserver(): void {
	proseObserver?.disconnect();
	proseObserver = null;

	const prose = document.querySelector('.prose');
	if (!prose) return;

	let timer: ReturnType<typeof setTimeout> | undefined;
	proseObserver = new MutationObserver(() => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			const needsWork =
				prose.querySelector('.mermaid-figure > .mermaid:not([data-processed])') ||
				prose.querySelector('.expressive-code pre[data-language="mermaid"]') ||
				prose.querySelector('pre > code.language-mermaid');
			if (needsWork) void initMermaidDiagrams(false);
		}, 120);
	});
	proseObserver.observe(prose, { childList: true, subtree: true });
}

function onArticlePageLoad(): void {
	void initMermaidDiagrams(false);
	// View Transitions 换页后旧 .prose 已卸掉，必须绑到当前页
	attachProseObserver();
}

export function bootArticleEnhancements(): void {
	if (!enhancementsBound) {
		enhancementsBound = true;
		initAnchorScroll();
		document.addEventListener('astro:page-load', onArticlePageLoad);
		window.addEventListener('themechange', () => void initMermaidDiagrams(true));
	}
	onArticlePageLoad();
}
