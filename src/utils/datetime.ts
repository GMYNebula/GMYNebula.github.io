const DATE_OPTS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
};

const DATETIME_OPTS: Intl.DateTimeFormatOptions = {
	...DATE_OPTS,
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
};

/** frontmatter 仅日期（时间为 0 点）时不显示时分 */
export function hasExplicitTime(date: Date): boolean {
	return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
}

export function formatDateTime(input: Date | string): string {
	const date = typeof input === 'string' ? new Date(input) : input;
	if (!hasExplicitTime(date)) {
		return date.toLocaleDateString('zh-CN', DATE_OPTS);
	}
	return date.toLocaleString('zh-CN', DATETIME_OPTS);
}

export function toDatetimeAttr(input: Date | string): string {
	const date = typeof input === 'string' ? new Date(input) : input;
	return date.toISOString();
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** 评论等场景：刚刚 / X 分钟前；过久则回落为 formatDateTime */
export function formatRelativeTime(input: Date | string, now = new Date()): string {
	const date = typeof input === 'string' ? new Date(input) : input;
	const diff = now.getTime() - date.getTime();

	if (diff < 0) return formatDateTime(date);
	if (diff < MINUTE) return '刚刚';
	if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分钟前`;
	if (diff < DAY) return `${Math.floor(diff / HOUR)} 小时前`;

	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / DAY);

	if (dayDiff === 1) return '昨天';
	if (dayDiff < 7) return `${dayDiff} 天前`;

	return formatDateTime(date);
}
