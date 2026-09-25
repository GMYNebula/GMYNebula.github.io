const STORAGE_KEY = 'archive-view';

function revealInPanel(panel: HTMLElement): void {
	for (const el of panel.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])')) {
		el.setAttribute('data-revealed', '');
	}
}

function readSavedView(): 'card' | 'timeline' {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === 'card' || saved === 'timeline') return saved;
	} catch {}
	return 'card';
}

function applyArchiveView(view: 'card' | 'timeline'): void {
	const buttons = document.querySelectorAll<HTMLButtonElement>('.view-btn');
	const panels = document.querySelectorAll<HTMLElement>('.view-panel');
	if (!buttons.length || !panels.length) return;

	for (const btn of buttons) {
		const active = btn.dataset.view === view;
		btn.classList.toggle('active', active);
		btn.setAttribute('aria-selected', active ? 'true' : 'false');
	}

	for (const panel of panels) {
		const show = panel.dataset.panel === view;
		if (show) {
			panel.hidden = false;
			panel.classList.remove('panel-enter');
			void panel.offsetWidth;
			panel.classList.add('panel-enter');
			revealInPanel(panel);
		} else {
			panel.hidden = true;
			panel.classList.remove('panel-enter');
		}
	}

	try {
		localStorage.setItem(STORAGE_KEY, view);
	} catch {}
}

export function initArchiveView(): void {
	if (!document.querySelector('.view-switch')) return;
	applyArchiveView(readSavedView());
}

function bindArchiveViewDelegation(): void {
	if (window.__nicocatArchiveViewBound) return;
	window.__nicocatArchiveViewBound = true;

	document.addEventListener('click', (ev) => {
		const btn = (ev.target as Element | null)?.closest<HTMLButtonElement>('.view-btn');
		if (!btn || !btn.closest('.view-switch')) return;
		const view = btn.dataset.view;
		if (view === 'card' || view === 'timeline') applyArchiveView(view);
	});
}

if (typeof document !== 'undefined') {
	bindArchiveViewDelegation();
	document.addEventListener('astro:page-load', initArchiveView);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initArchiveView, { once: true });
	} else {
		initArchiveView();
	}
}

declare global {
	interface Window {
		__nicocatArchiveViewBound?: boolean;
	}
}
