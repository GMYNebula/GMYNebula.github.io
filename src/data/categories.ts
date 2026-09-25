/** 固定大类：每篇文章 frontmatter 填一个 category，细话题用 tags */
export const categoryNames = ['技术', '笔记', '日常'] as const;

export type CategoryName = (typeof categoryNames)[number];

export type CategoryMeta = {
	name: CategoryName;
	description: string;
	tone: 'coral' | 'teal' | 'amber' | 'violet' | 'sky' | 'rose';
	icon: 'code' | 'file-text' | 'cat';
};

export const categories: CategoryMeta[] = [
	{
		name: '技术',
		description: '编程、工具与折腾',
		tone: 'coral',
		icon: 'code',
	},
	{
		name: '笔记',
		description: '学习记录与整理',
		tone: 'teal',
		icon: 'file-text',
	},
	{
		name: '日常',
		description: '碎碎念与小确幸',
		tone: 'amber',
		icon: 'cat',
	},
];

export function isCategoryName(value: string): value is CategoryName {
	return (categoryNames as readonly string[]).includes(value);
}

export function getCategoryMeta(name: CategoryName | string | undefined): CategoryMeta | undefined {
	if (!name || !isCategoryName(name)) return undefined;
	return categories.find((c) => c.name === name);
}
