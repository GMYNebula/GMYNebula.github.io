/** 本地 dev/preview 走同源代理，避免 giscus.app CORS 拦截 preflight */
export function getGiscusApiBase(): string {
	if (typeof window === 'undefined') return 'https://giscus.app/api';

	const { hostname } = window.location;
	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		return '/giscus-api';
	}

	return 'https://giscus.app/api';
}

/**
 * GitHub REST / GraphQL — 始终直连 api.github.com。
 * GitHub 对浏览器跨域开放 CORS（Access-Control-Allow-Origin: *），
 * 与 giscus 官方 widget 一致；勿走本地 /github-api 代理，避免 mutation 行为异常。
 */
export function getGithubApiBase(): string {
	return 'https://api.github.com';
}

export function githubGraphqlUrl(): string {
	return `${getGithubApiBase()}/graphql`;
}
