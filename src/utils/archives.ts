import type { CollectionEntry } from 'astro:content';
import { getPublishedPosts } from './posts';

export type ArchiveMonth = {
	month: number;
	label: string;
	posts: CollectionEntry<'blog'>[];
};

export type ArchiveYear = {
	year: number;
	months: ArchiveMonth[];
	count: number;
};

const monthLabels = [
	'1 月',
	'2 月',
	'3 月',
	'4 月',
	'5 月',
	'6 月',
	'7 月',
	'8 月',
	'9 月',
	'10 月',
	'11 月',
	'12 月',
];

export async function getArchives(): Promise<ArchiveYear[]> {
	const posts = await getPublishedPosts();
	const byYear = new Map<number, Map<number, CollectionEntry<'blog'>[]>>();

	for (const post of posts) {
		const year = post.data.pubDate.getFullYear();
		const month = post.data.pubDate.getMonth();
		if (!byYear.has(year)) byYear.set(year, new Map());
		const months = byYear.get(year)!;
		if (!months.has(month)) months.set(month, []);
		months.get(month)!.push(post);
	}

	return [...byYear.entries()]
		.sort((a, b) => b[0] - a[0])
		.map(([year, months]) => {
			const monthEntries = [...months.entries()]
				.sort((a, b) => b[0] - a[0])
				.map(([month, list]) => ({
					month,
					label: monthLabels[month],
					posts: list,
				}));
			return {
				year,
				months: monthEntries,
				count: monthEntries.reduce((n, m) => n + m.posts.length, 0),
			};
		});
}
