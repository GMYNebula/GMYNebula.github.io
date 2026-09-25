import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
	const posts = await getCollection('blog', ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 按发表时间：prev = 更早一篇，next = 更新一篇 */
export function getAdjacentPosts(
	posts: CollectionEntry<'blog'>[],
	slug: string,
): { prev: CollectionEntry<'blog'> | null; next: CollectionEntry<'blog'> | null } {
	const idx = posts.findIndex((p) => p.id === slug);
	if (idx === -1) return { prev: null, next: null };
	return {
		prev: idx < posts.length - 1 ? posts[idx + 1]! : null,
		next: idx > 0 ? posts[idx - 1]! : null,
	};
}
