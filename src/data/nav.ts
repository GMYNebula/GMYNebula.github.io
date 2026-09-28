import type { ComponentProps } from 'astro/types';
import type Icon from '../components/Icon.astro';

type IconName = ComponentProps<typeof Icon>['name'];

export type NavLink = {
	label: string;
	href: string;
	icon: IconName;
};

export type NavItem = NavLink & {
	/** 有子项时页头渲染为下拉菜单，href 指向第一个子页 */
	children?: NavLink[];
};

export const archiveSections: NavLink[] = [
	{ label: '时间线', href: '/archives', icon: 'calendar' },
	{ label: '分类', href: '/categories', icon: 'layers' },
	{ label: '标签', href: '/tags', icon: 'tag' },
];

export const navItems: NavItem[] = [
	{ label: '首页', href: '/', icon: 'home' },
	{ label: '归档', href: '/archives', icon: 'archive', children: archiveSections },
	{ label: '动态', href: '/moments', icon: 'message' },
	{ label: '相册', href: '/albums', icon: 'image' },
	{ label: '收藏', href: '/bookmarks', icon: 'heart' },
	{ label: '关于', href: '/about', icon: 'cat' },
	{ label: '友链', href: '/friends', icon: 'friends' },
];
