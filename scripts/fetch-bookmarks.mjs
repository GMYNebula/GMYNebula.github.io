// 抓取 src/content/bookmarks/*.md 里新增网址的标题、简介、封面，写入 bookmarks-meta.json。
// 已抓过的跳过；想重抓某条，就从 json 里删掉它再运行。
import { readdir, readFile, writeFile } from 'node:fs/promises';
import yaml from 'js-yaml';

const CONTENT_DIR = new URL('../src/content/bookmarks/', import.meta.url);
const META_PATH = new URL('../src/data/bookmarks-meta.json', import.meta.url);
const HEADERS = {
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
	'Accept-Language': 'zh-CN,zh;q=0.9',
};

const meta = JSON.parse(await readFile(META_PATH, 'utf8'));
const urls = new Set();
for (const file of await readdir(CONTENT_DIR).catch(() => [])) {
	if (!file.endsWith('.md')) continue;
	const source = await readFile(new URL(file, CONTENT_DIR), 'utf8');
	const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
	for (const link of yaml.load(frontmatter)?.links ?? []) urls.add(link.url);
}

for (const url of Object.keys(meta)) {
	if (!urls.has(url)) delete meta[url];
}

for (const url of urls) {
	if (meta[url]) continue;
	try {
		meta[url] = await fetchMeta(url);
		console.log(`✓ ${url}`);
	} catch (err) {
		console.warn(`✗ ${url}：${err.message}`);
	}
}

await writeFile(META_PATH, JSON.stringify(meta, null, '\t') + '\n');

async function fetchMeta(url) {
	const bvid = new URL(url).hostname.endsWith('bilibili.com') && url.match(/BV[0-9A-Za-z]{10}/)?.[0];
	return bvid ? fetchBilibili(bvid) : fetchPage(url);
}

async function fetchBilibili(bvid) {
	const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, { headers: HEADERS });
	const json = await res.json();
	if (json.code !== 0) throw new Error(json.message);
	const { title, desc, pic, owner, duration } = json.data;
	return {
		type: 'video',
		title,
		// 没写简介的视频接口返回 '-'
		description: desc === '-' ? undefined : desc,
		image: pic.replace(/^http:/, 'https:'),
		siteName: '哔哩哔哩',
		author: owner.name,
		duration,
	};
}

async function fetchPage(url) {
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const html = await res.text();
	const resolve = (href) => href && new URL(href, res.url).href;

	const metas = {};
	for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
		const attrs = parseAttrs(tag);
		const key = (attrs.property ?? attrs.name)?.toLowerCase();
		if (key && attrs.content && !(key in metas)) metas[key] = attrs.content;
	}

	const iconTag = (html.match(/<link\b[^>]*>/gi) ?? [])
		.map(parseAttrs)
		.find((attrs) => attrs.rel?.toLowerCase().split(/\s+/).includes('icon'));

	return {
		type: 'page',
		title: metas['og:title'] ?? decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()),
		description: metas['og:description'] ?? metas.description,
		image: resolve(metas['og:image']),
		siteName: metas['og:site_name'],
		icon: resolve(iconTag?.href) ?? new URL('/favicon.ico', res.url).href,
	};
}

function parseAttrs(tag) {
	const attrs = {};
	for (const [, name, , dq, sq] of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
		attrs[name.toLowerCase()] = decode(dq ?? sq);
	}
	return attrs;
}

function decode(text) {
	return text
		?.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}
