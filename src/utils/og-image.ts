import type { ImageMetadata } from 'astro';

const cards = import.meta.glob<{ default: ImageMetadata }>('../assets/og/*.webp', {
	eager: true,
});

/** 1200×630 分享卡片，与封面同名，位于 src/assets/og/ */
export function ogCardFor(image: ImageMetadata): ImageMetadata {
	const name = image.src.split('/').pop()?.split('.')[0];
	const match = Object.entries(cards).find(([key]) => key.endsWith(`/${name}.webp`));
	return match ? match[1].default : image;
}
