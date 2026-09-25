/** 滚动进入视口时触发 rise 动画 */
function revealIfVisible(el: HTMLElement, io: IntersectionObserver): boolean {
	const rect = el.getBoundingClientRect();
	const vh = window.innerHeight || document.documentElement.clientHeight;
	if (rect.top < vh * 0.96 && rect.bottom > vh * 0.04) {
		el.setAttribute('data-revealed', '');
		io.unobserve(el);
		return true;
	}
	return false;
}

export function initScrollReveal(root: ParentNode = document): void {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		for (const el of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
			el.setAttribute('data-revealed', '');
		}
		return;
	}

	const pending = root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])');
	if (!pending.length) return;

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.setAttribute('data-revealed', '');
				io.unobserve(entry.target);
			}
		},
		{ threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
	);

	for (const el of pending) {
		io.observe(el);
		revealIfVisible(el, io);
	}

	// View Transitions 换页后布局可能晚一拍，再扫一遍已在视口内的元素
	requestAnimationFrame(() => {
		for (const el of root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])')) {
			revealIfVisible(el, io);
		}
	});
}

/** View Transitions 换页后，视口内的 lazy 图有时不会开始请求 */
function kickVisibleLazyImages(): void {
	const vh = window.innerHeight || document.documentElement.clientHeight;
	for (const img of document.querySelectorAll<HTMLImageElement>('img')) {
		// 文章封面已 eager，别用 getAttribute 重写 src（/_image?a&amp;b 易被写坏）
		if (img.closest('.hero-image, .feature-media')) continue;

		const rect = img.getBoundingClientRect();
		if (rect.bottom <= 0 || rect.top >= vh) continue;

		if (img.loading === 'lazy') img.loading = 'eager';

		if (img.complete && img.naturalWidth === 0 && img.src) {
			const src = img.src;
			img.src = src;
		}
	}
}

export function bootMotion(): void {
	initScrollReveal();
	kickVisibleLazyImages();
	requestAnimationFrame(() => kickVisibleLazyImages());
}

if (typeof document !== 'undefined') {
	document.addEventListener('astro:page-load', bootMotion);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', bootMotion, { once: true });
	} else {
		bootMotion();
	}
}
