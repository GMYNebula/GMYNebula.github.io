let scrollHandler: (() => void) | null = null;
let rafId = 0;
let bound = false;

const ACTIVATION_LINE = 0.28;

function parseSlugs(rail: Element): string[] {
	const raw = rail.getAttribute('data-toc-slugs');
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
	} catch {
		return [];
	}
}

function getVisibleTocPanel(rail: Element): Element | null {
	const desktop = rail.querySelector('.toc-desktop');
	const mobile = rail.querySelector('.toc-mobile');
	if (desktop && getComputedStyle(desktop).display !== 'none') return desktop;
	if (mobile && getComputedStyle(mobile).display !== 'none') return mobile;
	return desktop ?? mobile;
}

function pickActiveSlug(slugs: string[]): string {
	const line = window.innerHeight * ACTIVATION_LINE;
	let active = slugs[0];
	for (const slug of slugs) {
		const el = document.getElementById(slug);
		if (!el) continue;
		if (el.getBoundingClientRect().top <= line) active = slug;
	}
	return active;
}

function teardownTocSpy(): void {
	if (scrollHandler) {
		window.removeEventListener('scroll', scrollHandler);
		scrollHandler = null;
	}
	if (rafId) {
		cancelAnimationFrame(rafId);
		rafId = 0;
	}
}

function bootTocSpy(): void {
	teardownTocSpy();

	const rail = document.querySelector('[data-toc-rail]');
	if (!rail) return;

	const slugList = parseSlugs(rail);
	if (!slugList.length) return;

	const headings = slugList
		.map((slug) => document.getElementById(slug))
		.filter((el): el is HTMLElement => !!el);
	if (!headings.length) return;

	const setActive = (slug: string) => {
		for (const link of rail.querySelectorAll<HTMLElement>('[data-toc-link]')) {
			link.classList.toggle('is-active', link.getAttribute('data-toc-link') === slug);
		}

		// 侧边目录只在 fixed 布局（≥1360px）时才需要滚动跟随
		if (!window.matchMedia('(min-width: 1360px)').matches) return;

		const panel = getVisibleTocPanel(rail);
		if (!panel) return;

		for (const link of panel.querySelectorAll<HTMLElement>('[data-toc-link]')) {
			if (link.getAttribute('data-toc-link') === slug) {
				link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				break;
			}
		}
	};

	const update = () => setActive(pickActiveSlug(slugList));

	scrollHandler = () => {
		if (rafId) return;
		rafId = requestAnimationFrame(() => {
			rafId = 0;
			update();
		});
	};

	window.addEventListener('scroll', scrollHandler, { passive: true });
	update();
}

export function initTocSpy(): void {
	if (!bound) {
		document.addEventListener('astro:page-load', bootTocSpy);
		bound = true;
	}
	bootTocSpy();
}
