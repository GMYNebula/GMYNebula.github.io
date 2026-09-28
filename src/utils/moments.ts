import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPublishedMoments(): Promise<CollectionEntry<'moments'>[]> {
	const moments = await getCollection('moments', ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	return moments.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
