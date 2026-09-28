import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPublishedAlbums(): Promise<CollectionEntry<'albums'>[]> {
	const albums = await getCollection('albums', ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	return albums.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
