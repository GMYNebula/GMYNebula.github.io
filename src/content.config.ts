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

export const collections = { blog };
