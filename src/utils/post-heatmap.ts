import { buildHeatmapData, type HeatmapData } from '@rsalianto/git-heatmap-core';
import type { CollectionEntry } from 'astro:content';

const pad = (n: number) => String(n).padStart(2, '0');

function formatDateKey(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 博客发文 → git-heatmap 的 HeatmapData（铺满卡片宽度的 52 周网格） */
const BLOG_LEVELS = [
	{ threshold: 0, color: 'var(--ghm-color-l0)', label: '无发文' },
	{ threshold: 1, color: 'var(--ghm-color-l1)', label: '1 篇' },
	{ threshold: 2, color: 'var(--ghm-color-l2)', label: '2 篇' },
	{ threshold: 3, color: 'var(--ghm-color-l3)', label: '3 篇' },
	{ threshold: 4, color: 'var(--ghm-color-l4)', label: '4 篇及以上' },
];

export function buildBlogHeatmapData(posts: CollectionEntry<'blog'>[]): HeatmapData {
	const counts = new Map<string, number>();

	for (const post of posts) {
		const key = formatDateKey(post.data.pubDate);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	const entries = [...counts.entries()].map(([date, count]) => ({ date, count }));
	const data = buildHeatmapData(entries, BLOG_LEVELS);
	return { ...data, source: 'manual' as const };
}
