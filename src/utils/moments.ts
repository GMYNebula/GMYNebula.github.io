import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPublishedMoments(): Promise<CollectionEntry<'moments'>[]> {
	const moments = await getCollection('moments', ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	return moments.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 动态卡片的手账装饰：deco 是贴在卡片上的小物件，paper 是卡片底纹；按从旧到新的顺序轮换，发新动态时旧动态的样式不变 */
export const MOMENT_STYLES = [
	{ deco: 'tape-stripe', paper: 'lined' },
	{ deco: 'clip', paper: 'grid' },
	{ deco: 'tape-dots', paper: 'plain' },
	{ deco: 'stamp', paper: 'dots' },
	{ deco: 'tape-grid', paper: 'plain' },
	{ deco: 'pin', paper: 'lined' },
	{ deco: 'tape-paw', paper: 'dots' },
	{ deco: 'postmark', paper: 'kraft' },
	{ deco: 'tape-gingham', paper: 'grid' },
	{ deco: 'corners', paper: 'plain' },
	{ deco: 'tape-star', paper: 'dots' },
	{ deco: 'binder', paper: 'lined' },
	{ deco: 'tape-lace', paper: 'plain' },
	{ deco: 'sticker', paper: 'grid' },
	{ deco: 'tape-text', paper: 'dots' },
	{ deco: 'dog-ear', paper: 'lined' },
	{ deco: 'sticky', paper: 'sticky' },
] as const;

export type MomentDecoName = (typeof MOMENT_STYLES)[number]['deco'];

/** 动态正文转纯文字，给转发卡片用；动态只写简单 Markdown，粗略去掉标记即可 */
export function momentPlainText(markdown = '') {
	return markdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[*_`~>#]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}
