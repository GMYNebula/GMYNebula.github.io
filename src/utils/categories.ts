import type { CollectionEntry } from 'astro:content';
import {
	categories,
	type CategoryMeta,
	type CategoryName,
	isCategoryName,
} from '../data/categories';
import { getPublishedPosts } from './posts';

export type CategoryInfo = CategoryMeta & {
	slug: string;
	count: number;
	posts: CollectionEntry<'blog'>[];
};

/** 与 Astro 静态路径一致：中文目录名，不做 encodeURIComponent */
export function categoryToSlug(name: CategoryName): string {
	return name;
}

export function slugToCategory(slug: string): string {
	try {
		return decodeURIComponent(slug);
	} catch {
		return slug;
	}
}

export async function getAllCategories(): Promise<CategoryInfo[]> {
	const posts = await getPublishedPosts();

	return categories.map((cat) => {
		const tagged = posts.filter((post) => post.data.category === cat.name);
		return {
			...cat,
			slug: categoryToSlug(cat.name),
			count: tagged.length,
			posts: tagged,
		};
	});
}

export async function getPostsByCategory(name: CategoryName): Promise<CollectionEntry<'blog'>[]> {
	const posts = await getPublishedPosts();
	return posts.filter((post) => post.data.category === name);
}

export function resolveCategory(input: string): CategoryName | null {
	const name = slugToCategory(input);
	return isCategoryName(name) ? name : null;
}

/** 正文 meta 用：标签里不再重复显示大类 */
export function topicTags(tags: string[], category: CategoryName): string[] {
	return tags.filter((tag) => tag !== category);
}
