// @ts-check

import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis';
import remarkMath from 'remark-math';
import { rehypeDemoteHeadings } from './src/utils/rehype-demote-headings.js';
import { rehypeMermaid } from './src/utils/rehype-mermaid.js';
import { remarkAlert } from 'remark-github-blockquote-alert';

/** 本地 dev/preview：把 /giscus-api/* 代理到 giscus.app/api/*，绕过浏览器 CORS */
const giscusApiProxy = {
	'/giscus-api': {
		target: 'https://giscus.app/api',
		changeOrigin: true,
		rewrite: (path) => path.replace(/^\/giscus-api/, ''),
	},
};

// https://astro.build/config
export default defineConfig({
	site: 'https://nebulacoco.top',
	security: {
		// 允许 giscus.app iframe 在 dev 时拉取 /giscus/*.css
		allowedDomains: [{ hostname: 'giscus.app', protocol: 'https' }],
	},
	vite: {
		optimizeDeps: {
			include: ['mermaid'],
		},
		server: {
			proxy: { ...giscusApiProxy },
			headers: {
				'Access-Control-Allow-Origin': 'https://giscus.app',
			},
		},
		preview: {
			proxy: { ...giscusApiProxy },
		},
	},
	integrations: [expressiveCode(), mdx(), sitemap()],
	markdown: {
		syntaxHighlight: false,
		processor: unified({
			gfm: true,
			smartypants: true,
			remarkPlugins: [remarkAlert, remarkMath],
			rehypePlugins: [
				rehypeDemoteHeadings,
				rehypeMermaid,
				rehypeSlug,
				[
					rehypeAutolinkHeadings,
					{
						behavior: 'append',
						properties: {
							className: ['heading-anchor'],
							ariaLabel: '链接到此标题',
						},
						// 空节点 + CSS ::before，避免 # 进入 headings[].text / 目录
						content: {
							type: 'element',
							tagName: 'span',
							properties: {
								className: ['heading-anchor-mark'],
								'aria-hidden': 'true',
							},
							children: [],
						},
					},
				],
				[
					rehypeExternalLinks,
					{
						target: '_blank',
						rel: ['noopener', 'noreferrer'],
					},
				],
				rehypeAccessibleEmojis,
				rehypeKatex,
			],
		}),
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'ZCOOL XiaoWei',
			cssVariable: '--font-display-cjk',
			fallbacks: ['KaiTi', 'STKaiti', 'Songti SC', 'serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/cute/zcool-xiaowei-chinese-simplified-400-normal.woff2'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'Fredoka',
			cssVariable: '--font-display',
			fallbacks: ['KaiTi', 'Georgia', 'serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/cute/fredoka-latin-400-normal.woff2'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/cute/fredoka-latin-500-normal.woff2'],
						weight: 500,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/cute/fredoka-latin-600-normal.woff2'],
						weight: 600,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'Nunito',
			cssVariable: '--font-body',
			fallbacks: ['PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/cute/nunito-latin-400-normal.woff2'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/cute/nunito-latin-400-italic.woff2'],
						weight: 400,
						style: 'italic',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/cute/nunito-latin-600-normal.woff2'],
						weight: 600,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/cute/nunito-latin-700-normal.woff2'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
