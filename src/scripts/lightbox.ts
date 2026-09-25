let bound = false;
let host: HTMLDivElement | null = null;

function ensureHost(): HTMLDivElement {
	if (host) return host;

	host = document.createElement('div');
	host.className = 'image-lightbox';
	host.hidden = true;
	host.innerHTML =
		'<button type="button" class="image-lightbox-close" aria-label="关闭">×</button>' +
		'<figure class="image-lightbox-frame"><img alt="" /></figure>';
	document.body.appendChild(host);

	const close = () => {
		if (!host) return;
		host.hidden = true;
		document.body.classList.remove('lightbox-open');
		const img = host.querySelector('img');
		if (img) {
			img.removeAttribute('src');
			img.alt = '';
		}
	};

	host.addEventListener('click', (e) => {
		if (e.target === host || (e.target as Element).closest('.image-lightbox-close')) close();
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && host && !host.hidden) close();
	});

	return host;
}

function openLightbox(img: HTMLImageElement): void {
	const panel = ensureHost();
	const target = panel.querySelector('img');
	if (!target) return;

	target.src = img.currentSrc || img.src;
	target.alt = img.alt || '放大图片';
	panel.hidden = false;
	document.body.classList.add('lightbox-open');
	panel.querySelector<HTMLButtonElement>('.image-lightbox-close')?.focus();
}

function bindLightbox(root: ParentNode = document): void {
	for (const img of root.querySelectorAll<HTMLImageElement>('.prose img')) {
		if (img.dataset.lightboxBound) continue;
		if (img.closest('.hero-image, .mermaid-figure, .image-lightbox')) continue;
		if (img.closest('a[data-no-lightbox]')) continue;

		img.dataset.lightboxBound = '1';
		img.tabIndex = 0;
		img.style.cursor = 'zoom-in';

		const open = () => openLightbox(img);
		img.addEventListener('click', open);
		img.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				open();
			}
		});
	}
}

export function initLightbox(): void {
	if (!bound) {
		document.addEventListener('astro:page-load', () => bindLightbox());
		bound = true;
	}
	bindLightbox();
}
