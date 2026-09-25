/** 与 giscus client.js 的 pathname 映射一致 */
export function getDiscussionTerm(pathname: string): string {
	if (pathname.length < 2) return 'index';
	return pathname.substring(1).replace(/\.\w+$/, '');
}

export function cleanPageUrl(href: string): string {
	const url = new URL(href);
	url.searchParams.delete('giscus');
	url.hash = '';
	return url.toString();
}
