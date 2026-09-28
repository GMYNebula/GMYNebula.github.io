import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categoryNames } from './src/data/categories';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			draft: z.boolean().default(false),
			/** 大类：技术 / 笔记 / 日常（每篇一个） */
			category: z.enum(categoryNames),
			/** 细话题；不要与 category 重复 */
			tags: z.array(z.string()).default([]),
			/** 设为 false 可关闭文末许可说明 */
			license: z.boolean().default(true),
		}),
});

const moments = defineCollection({
	loader: glob({ base: './src/content/moments', pattern: '**/*.md' }),
	schema: z.object({
		/** 写成 2026-09-28T14:30:00+08:00，时区不能省，否则按 UTC 解析 */
		date: z.coerce.date(),
		/** 外链图片地址 */
		images: z.array(z.string().url()).default([]),
		mood: z.string().optional(),
		location: z.string().default('北京'),
		tags: z.array(z.string()).default([]),
		/** 分享的网址，显示成卡片；标题封面由 npm run bookmarks 抓取 */
		link: z.string().url().optional(),
		draft: z.boolean().default(false),
	}),
});

/** 外链地址，或 public/ 下的站内路径（以 / 开头）；都不经 Astro 压缩 */
const albumImage = z.union([z.string().url(), z.string().startsWith('/')]);

const albums = defineCollection({
	loader: glob({ base: './src/content/albums', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		location: z.string().optional(),
		description: z.string().optional(),
		cover: albumImage,
		photos: z
			.array(
				z.object({
					src: albumImage,
					caption: z.string().optional(),
				}),
			)
			.min(1),
		draft: z.boolean().default(false),
	}),
});

/** 一个文件一个分组，分组按文件名排序 */
const bookmarks = defineCollection({
	loader: glob({ base: './src/content/bookmarks', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		links: z
			.array(
				z.object({
					url: z.string().url(),
					note: z.string().optional(),
					/** 以下三项填了就覆盖自动解析的结果 */
					title: z.string().optional(),
					description: z.string().optional(),
					cover: z.string().url().optional(),
				}),
			)
			.min(1),
	}),
});

export const collections = { blog, moments, albums, bookmarks };
