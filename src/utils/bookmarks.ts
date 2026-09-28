import { getCollection } from 'astro:content';
import metaJson from '../data/bookmarks-meta.json';

/** `npm run bookmarks` 写入 bookmarks-meta.json 的解析结果 */
export type BookmarkMeta = {
	type: 'video' | 'page';
	title?: string;
	description?: string;
	image?: string;
	siteName?: string;
	icon?: string;
	/** 仅 B 站视频 */
	author?: string;
	/** 仅 B 站视频，单位秒 */
	duration?: number;
};

const metaMap = metaJson as Record<string, BookmarkMeta>;

/** 网址 → 卡片展示信息；没抓到元数据时标题退回域名 */
export function getLinkCard(url: string) {
	const meta = metaMap[url];
	const host = new URL(url).hostname.replace(/^www\./, '');
	return {
		url,
		title: meta?.title ?? host,
		description: meta?.description,
		image: meta?.image,
		source: meta?.author ? `${meta.siteName} · ${meta.author}` : host,
		icon: meta?.type === 'page' ? meta.icon : undefined,
		duration: meta?.duration,
	};
}

export async function getBookmarkGroups() {
	const groups = await getCollection('bookmarks');
	return groups
		.sort((a, b) => a.id.localeCompare(b.id))
		.map((group) => ({
			id: group.id,
			name: group.data.title,
			items: group.data.links.map((link) => {
				const card = getLinkCard(link.url);
				return {
					...card,
					note: link.note,
					title: link.title ?? card.title,
					description: link.description ?? card.description,
					image: link.cover ?? card.image,
				};
			}),
		}));
}
