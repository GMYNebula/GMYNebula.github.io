import type { CollectionEntry } from 'astro:content';
import { getPublishedPosts } from './posts';

export type TagInfo = {
	name: string;
	slug: string;
	count: number;
	posts: CollectionEntry<'blog'>[];
};

export function tagToSlug(tag: string): string {
	return encodeURIComponent(tag);
}

export function slugToTag(slug: string): string {
	return decodeURIComponent(slug);
}

export async function getAllTags(): Promise<TagInfo[]> {
	const posts = await getPublishedPosts();
	const map = new Map<string, CollectionEntry<'blog'>[]>();

	for (const post of posts) {
		for (const tag of post.data.tags) {
			const list = map.get(tag) ?? [];
			list.push(post);
			map.set(tag, list);
		}
	}

	return [...map.entries()]
		.map(([name, tagged]) => ({
			name,
			slug: tagToSlug(name),
			count: tagged.length,
			posts: tagged,
		}))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export async function getPostsByTag(tag: string): Promise<CollectionEntry<'blog'>[]> {
	const posts = await getPublishedPosts();
	return posts.filter((post) => post.data.tags.includes(tag));
}
