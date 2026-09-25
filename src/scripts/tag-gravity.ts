/**
 * 标签重力：纯 Matter.js，边界用静态墙，不做额外位置修正。
 */
import Matter from 'matter-js';

type TagPair = {
	el: HTMLElement;
	body: Matter.Body;
	w: number;
	h: number;
};

let rafId = 0;
let engine: Matter.Engine | null = null;
let mouseConstraint: Matter.MouseConstraint | null = null;
let pairs: TagPair[] = [];
let resizeHandler: (() => void) | null = null;
let observer: MutationObserver | null = null;
let clickBlocker: ((e: Event) => void) | null = null;
let dragBlocker: ((e: Event) => void) | null = null;
let pointerDownHandler: ((e: PointerEvent) => void) | null = null;
let pointerMoveHandler: ((e: PointerEvent) => void) | null = null;
let pointerUpHandler: (() => void) | null = null;
let resizeTimer = 0;
let pointerDragged = false;

const DRAG_CLICK_THRESHOLD = 6;

function destroyTagGravity(): void {
	if (rafId) cancelAnimationFrame(rafId);
	rafId = 0;
	window.clearTimeout(resizeTimer);

	if (resizeHandler) {
		window.removeEventListener('resize', resizeHandler);
		resizeHandler = null;
	}

	observer?.disconnect();
	observer = null;

	if (engine) {
		if (mouseConstraint) {
			Matter.Events.off(mouseConstraint);
			mouseConstraint = null;
		}
		Matter.Composite.clear(engine.world, false, true);
		Matter.Engine.clear(engine);
		engine = null;
	}

	const container = document.querySelector('.wordcloud[data-gravity]');
	if (clickBlocker) {
		container?.removeEventListener('click', clickBlocker, true);
		clickBlocker = null;
	}
	if (dragBlocker) {
		container?.removeEventListener('dragstart', dragBlocker, true);
		dragBlocker = null;
	}
	if (pointerDownHandler) {
		container?.removeEventListener('pointerdown', pointerDownHandler, true);
		pointerDownHandler = null;
	}
	if (pointerMoveHandler) {
		container?.removeEventListener('pointermove', pointerMoveHandler, true);
		pointerMoveHandler = null;
	}
	if (pointerUpHandler) {
		container?.removeEventListener('pointerup', pointerUpHandler, true);
		container?.removeEventListener('pointercancel', pointerUpHandler, true);
		pointerUpHandler = null;
	}

	pairs = [];
	pointerDragged = false;
}

function readPad(container: HTMLElement): number {
	return Number.parseFloat(getComputedStyle(container).getPropertyValue('--gravity-pad')) || 14;
}

function readInitialTiltRad(el: HTMLElement): number {
	const inline = el.style.getPropertyValue('--r').trim();
	const raw = inline || getComputedStyle(el).getPropertyValue('--r').trim();
	const deg = raw ? Number.parseFloat(raw) : 0;
	return Number.isFinite(deg) ? (deg * Math.PI) / 180 : 0;
}

function createWalls(width: number, height: number, pad: number): Matter.Body[] {
	const thick = 50;
	const wall = {
		isStatic: true,
		friction: 0.95,
		frictionStatic: 1,
		restitution: 0.05,
	};

	return [
		Matter.Bodies.rectangle(width / 2, height - pad + thick / 2, width + thick * 2, thick, wall),
		Matter.Bodies.rectangle(pad - thick / 2, height / 2, thick, height * 2, wall),
		Matter.Bodies.rectangle(width - pad + thick / 2, height / 2, thick, height * 2, wall),
	];
}

function syncPair({ el, body, w, h }: TagPair): void {
	el.style.left = `${body.position.x - w / 2}px`;
	el.style.top = `${body.position.y - h / 2}px`;
	el.style.transform = `rotate(${(body.angle * 180) / Math.PI}deg)`;
}

function measureTags(container: HTMLElement): { el: HTMLElement; w: number; h: number }[] {
	return [...container.querySelectorAll<HTMLElement>('.word')]
		.map((el) => ({
			el,
			w: el.offsetWidth,
			h: el.offsetHeight,
		}))
		.filter(({ w, h }) => w > 4 && h > 4);
}

function waitForLayout(container: HTMLElement): Promise<{ el: HTMLElement; w: number; h: number }[]> {
	return new Promise((resolve) => {
		const tryMeasure = () => {
			const items = measureTags(container);
			if (items.length > 0) {
				resolve(items);
				return;
			}
			requestAnimationFrame(tryMeasure);
		};
		requestAnimationFrame(tryMeasure);
	});
}

async function bootTagGravity(): Promise<void> {
	destroyTagGravity();

	const container = document.querySelector<HTMLElement>('.wordcloud[data-gravity]');
	if (!container) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	try {
		await document.fonts?.ready;
		const items = await waitForLayout(container);
		if (!items.length) return;

		const pad = readPad(container);
		const width = container.clientWidth;
		const height = container.clientHeight;
		if (width < 40 || height < 40) return;

		const innerW = Math.max(width - pad * 2, 40);
		container.dataset.gravityReady = 'true';

		engine = Matter.Engine.create({
			gravity: { x: 0, y: 1, scale: 0.00005 },
			positionIterations: 8,
			velocityIterations: 6,
		});

		Matter.Composite.add(engine.world, createWalls(width, height, pad));

		pairs = items.map(({ el, w, h }, i) => {
			const x = pad + w / 2 + Math.random() * Math.max(innerW - w, 0);
			const y = -(h / 2 + 40 + i * 16);
			const chamfer = Math.min(h / 2, w / 2, w * 0.35);

			const body = Matter.Bodies.rectangle(x, y, w, h, {
				...(chamfer > 2 ? { chamfer: { radius: chamfer } } : {}),
				restitution: 0.12,
				friction: 0.72,
				frictionStatic: 0.98,
				frictionAir: 0.016,
				density: 0.001,
				angle: readInitialTiltRad(el),
			});

			Matter.Composite.add(engine.world, body);
			const pair = { el, body, w, h };
			syncPair(pair);
			return pair;
		});

		const mouse = Matter.Mouse.create(container);
		mouseConstraint = Matter.MouseConstraint.create(engine, {
			mouse,
			constraint: {
				stiffness: 0.4,
				damping: 0.1,
			},
		});
		Matter.Composite.add(engine.world, mouseConstraint);

		mouse.element.removeEventListener('touchstart', mouse.mousedown);
		mouse.element.removeEventListener('touchmove', mouse.mousemove);
		mouse.element.removeEventListener('touchend', mouse.mouseup);
		mouse.element.addEventListener('touchstart', mouse.mousedown, { passive: false });
		mouse.element.addEventListener(
			'touchmove',
			(e) => {
				if (mouseConstraint?.body) e.preventDefault();
				mouse.mousemove(e as unknown as MouseEvent);
			},
			{ passive: false },
		);
		mouse.element.addEventListener('touchend', mouse.mouseup);

		const ensureLoop = () => {
			if (!rafId && engine) rafId = requestAnimationFrame(step);
		};

		Matter.Events.on(mouseConstraint, 'startdrag', ensureLoop);
		Matter.Events.on(mouseConstraint, 'enddrag', ensureLoop);
		Matter.Events.on(mouseConstraint, 'mousedown', (e) => {
			if (e.body) {
				Matter.Sleeping.set(e.body, false);
				ensureLoop();
			}
		});

		let pointerStart: { x: number; y: number } | null = null;

		pointerDownHandler = (e) => {
			if (e.button !== 0) return;
			pointerStart = { x: e.clientX, y: e.clientY };
			pointerDragged = false;
		};
		pointerMoveHandler = (e) => {
			if (!pointerStart || e.buttons === 0) return;
			const dx = e.clientX - pointerStart.x;
			const dy = e.clientY - pointerStart.y;
			if (dx * dx + dy * dy > DRAG_CLICK_THRESHOLD * DRAG_CLICK_THRESHOLD) {
				pointerDragged = true;
			}
		};
		pointerUpHandler = () => {
			pointerStart = null;
		};

		clickBlocker = (e) => {
			if (!pointerDragged) return;
			e.preventDefault();
			e.stopPropagation();
			pointerDragged = false;
		};
		dragBlocker = (e) => {
			e.preventDefault();
		};

		container.addEventListener('pointerdown', pointerDownHandler, true);
		container.addEventListener('pointermove', pointerMoveHandler, true);
		container.addEventListener('pointerup', pointerUpHandler, true);
		container.addEventListener('pointercancel', pointerUpHandler, true);
		container.addEventListener('click', clickBlocker, true);
		container.addEventListener('dragstart', dragBlocker, true);

		const step = () => {
			if (!engine) return;

			Matter.Engine.update(engine, 1000 / 60);
			for (const pair of pairs) syncPair(pair);

			const dragging = Boolean(mouseConstraint?.body);
			const awake = pairs.some(({ body }) => !body.isSleeping);
			if (!dragging && !awake) return;

			rafId = requestAnimationFrame(step);
		};

		rafId = requestAnimationFrame(step);

		resizeHandler = () => {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(() => {
				delete container.dataset.gravityReady;
				void bootTagGravity();
			}, 200);
		};
		window.addEventListener('resize', resizeHandler, { passive: true });

		observer = new MutationObserver(() => {
			if (!document.contains(container)) {
				delete container.dataset.gravityReady;
				destroyTagGravity();
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
	} catch (err) {
		console.error('[tag-gravity]', err);
		delete container.dataset.gravityReady;
	}
}

function initTagGravity(): void {
	void bootTagGravity();
}

if (typeof document !== 'undefined') {
	document.addEventListener('astro:page-load', initTagGravity);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initTagGravity, { once: true });
	} else {
		initTagGravity();
	}
}

export { destroyTagGravity, initTagGravity };
