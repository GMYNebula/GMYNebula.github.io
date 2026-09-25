import '@rsalianto/git-heatmap-vanilla';
import type { HeatmapData } from '@rsalianto/git-heatmap-core';

type GitHeatmapEl = HTMLElement & { data: HeatmapData | null };

const DAY_LABEL_W = 32;
const CELL_GAP = 3;
const MIN_CELL = 7;
const MAX_CELL = 18;

let bound = false;

function fitCellSize(containerWidth: number, weekCount: number): number {
	if (weekCount <= 0 || containerWidth <= 0) return 11;
	const track = containerWidth - DAY_LABEL_W;
	const size = Math.floor((track - (weekCount - 1) * CELL_GAP) / weekCount);
	return Math.max(MIN_CELL, Math.min(MAX_CELL, size));
}

function syncHeatmapLayout(el: GitHeatmapEl): void {
	// 晚于 git-heatmap 内部的 scrollLeft 赋值再校正
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			const scroll = el.shadowRoot?.querySelector<HTMLElement>('.ghm-scroll');
			if (!scroll) return;
			scroll.style.width = '100%';
			if (scroll.scrollWidth <= scroll.clientWidth + 2) {
				scroll.scrollLeft = 0;
			} else {
				scroll.scrollLeft = scroll.scrollWidth - scroll.clientWidth;
			}
		});
	});
}

function applyHeatmap(host: HTMLElement, el: GitHeatmapEl, data: HeatmapData, raw: string): void {
	const width = host.clientWidth;
	const cellSize = fitCellSize(width, data.weeks.length);
	const mountKey = `${raw}:${width}:${cellSize}`;

	if (host.dataset.mounted === mountKey) return;

	el.setAttribute('cell-size', String(cellSize));
	el.setAttribute('cell-gap', String(CELL_GAP));
	el.setAttribute('cell-radius', '2');
	el.data = data;
	host.dataset.mounted = mountKey;
	syncHeatmapLayout(el);
}

export function mountBlogHeatmap(root: ParentNode = document): void {
	const host = root.querySelector<HTMLElement>('[data-blog-heatmap-json]');
	if (!host) return;

	const el = host.querySelector<GitHeatmapEl>('git-heatmap');
	if (!el) return;

	const raw = host.getAttribute('data-blog-heatmap-json');
	if (!raw) return;

	let data: HeatmapData;
	try {
		data = JSON.parse(raw) as HeatmapData;
	} catch (err) {
		console.error('[heatmap]', err);
		return;
	}

	applyHeatmap(host, el, data, raw);

	if (host.dataset.roBound) return;
	host.dataset.roBound = '1';

	const ro = new ResizeObserver(() => {
		host.dataset.mounted = '';
		applyHeatmap(host, el, data, raw);
	});
	ro.observe(host);
}

export function initBlogHeatmap(): void {
	if (!bound) {
		document.addEventListener('astro:page-load', () => mountBlogHeatmap());
		bound = true;
	}
	mountBlogHeatmap();
}
