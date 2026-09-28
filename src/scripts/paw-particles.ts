import { tsParticles, type Container, type ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { loadImageShape } from '@tsparticles/shape-image';

const CONTAINER_ID = 'nicocat-paws';
/** 调参后递增，避免复用旧容器 */
const EFFECT_REV = 10;

type PawGlobals = {
	bound?: boolean;
	engineReady?: boolean;
	rev?: number;
	container?: Container;
	mountId?: number;
	scrollTimer?: number;
};

function globals(): PawGlobals {
	const w = window as Window & { __nicocatPaws?: PawGlobals };
	if (!w.__nicocatPaws) w.__nicocatPaws = {};
	return w.__nicocatPaws;
}

function shouldEnable(): boolean {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
	if (window.matchMedia('(pointer: coarse)').matches) return false;
	return true;
}

function pawColor(): string {
	return document.documentElement.getAttribute('data-theme') === 'light'
		? '#c44b2f'
		: '#e8836b';
}

function buildOptions(): ISourceOptions {
	return {
		fullScreen: {
			enable: true,
			// 与 .site-bg 同为 -1，靠 DOM 顺序叠在背景上、正文框下
			zIndex: -1,
		},
		fpsLimit: 30,
		detectRetina: true,
		pauseOnBlur: true,
		smooth: true,
		interactivity: {
			events: {
				onClick: { enable: false },
				onHover: { enable: false },
				resize: { enable: true },
			},
		},
		particles: {
			number: {
				value: 22,
				density: { enable: false, width: 1920, height: 1080 },
				limit: { mode: 'delete', value: 22 },
			},
			color: { value: pawColor() },
			opacity: { value: { min: 0.4, max: 0.72 } },
			size: { value: { min: 10, max: 18 } },
			rotate: {
				value: { min: 0, max: 360 },
				direction: 'random',
				animation: {
					enable: true,
					speed: 0.35, // 固定转速，不随机加速
					sync: false,
					decay: 0,
				},
			},
			move: {
				enable: true,
				direction: 'bottom',
				// 匀速：固定速度，关闭重力/衰减/漂移
				speed: 0.45,
				straight: true,
				random: false,
				drift: 0,
				decay: 0,
				gravity: {
					enable: false,
					acceleration: 0,
					maxSpeed: 0.45,
				},
				spin: {
					enable: false,
					acceleration: 0,
				},
				outModes: { default: 'out' },
			},
			shape: {
				type: 'image',
				options: {
					image: {
						src: '/effects/paw.svg',
						width: 32,
						height: 32,
						replaceColor: true,
					},
				},
			},
		},
	};
}

async function ensureEngine(): Promise<void> {
	const g = globals();
	if (g.engineReady) return;
	await loadSlim(tsParticles);
	await loadImageShape(tsParticles);
	g.engineReady = true;
}

function destroyAllPaws(): void {
	const g = globals();
	if (g.container && !g.container.destroyed) {
		g.container.destroy(true);
	}
	g.container = undefined;
	g.rev = 0;

	for (const c of [...tsParticles.items]) {
		if (c.id === CONTAINER_ID && !c.destroyed) c.destroy(true);
	}

	document.getElementById(CONTAINER_ID)?.remove();
	document.getElementById('nicocat-paws-host')?.remove();
}

async function mount(): Promise<void> {
	const g = globals();
	const mountId = (g.mountId ?? 0) + 1;
	g.mountId = mountId;

	await ensureEngine();
	if (g.mountId !== mountId) return;

	destroyAllPaws();

	const loaded = await tsParticles.load({
		id: CONTAINER_ID,
		options: buildOptions(),
	});
	if (g.mountId !== mountId) {
		loaded?.destroy(true);
		return;
	}

	g.container = loaded;
	g.rev = EFFECT_REV;
}

function pause(): void {
	const c = globals().container;
	if (c && !c.destroyed) c.pause();
}

function resume(): void {
	const c = globals().container;
	if (c && !c.destroyed) c.play();
}

function bindOnce(): void {
	const g = globals();
	if (g.bound) return;
	g.bound = true;

	document.addEventListener('astro:page-load', () => {
		void window.__nicocatPawsBoot?.();
	});

	// 滚轮滚动时暂停，停滚后再播 —— 不黏着视口乱晃
	window.addEventListener(
		'scroll',
		() => {
			pause();
			window.clearTimeout(g.scrollTimer);
			g.scrollTimer = window.setTimeout(() => resume(), 180);
		},
		{ passive: true },
	);

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			pause();
			return;
		}
		// 回前台重建，避免暂停期间堆积的大 delta 造成「突然加速」
		globals().rev = 0;
		void window.__nicocatPawsBoot?.();
	});

	let lastTheme = document.documentElement.getAttribute('data-theme');
	const themeObserver = new MutationObserver(() => {
		const next = document.documentElement.getAttribute('data-theme');
		if (next === lastTheme) return;
		lastTheme = next;
		globals().rev = 0; // 强制按新主题色重建
		void window.__nicocatPawsBoot?.();
	});
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme'],
	});
}

export async function bootPawParticles(): Promise<void> {
	bindOnce();

	if (!shouldEnable()) {
		destroyAllPaws();
		return;
	}

	const g = globals();
	if (
		g.container &&
		!g.container.destroyed &&
		(document.getElementById(CONTAINER_ID) || document.querySelector(`#${CONTAINER_ID}, canvas[data-generated]`)) &&
		g.rev === EFFECT_REV
	) {
		return;
	}

	await mount();
}

declare global {
	interface Window {
		__nicocatPawsBoot?: () => Promise<void>;
	}
}

if (typeof document !== 'undefined') {
	window.__nicocatPawsBoot = bootPawParticles;
	bindOnce();
	void bootPawParticles();
}
