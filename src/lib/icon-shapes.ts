/** Lucide 官方路径：https://lucide.dev — 客户端 inline SVG 与 Icon.astro 共用 */
export type LucideShape =
	| { type: 'path'; d: string }
	| { type: 'circle'; cx: number; cy: number; r: number }
	| { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number; ry?: number };

/** lucide.dev/icons/copy — 叠放双页，小尺寸比 path 版双文档更清晰 */
export const LUCIDE_COPY: LucideShape[] = [
	{ type: 'rect', x: 8, y: 8, width: 14, height: 14, rx: 2, ry: 2 },
	{ type: 'path', d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' },
];

/** lucide.dev/icons/check */
export const LUCIDE_CHECK: LucideShape[] = [{ type: 'path', d: 'M20 6 9 17l-5-5' }];

export function lucideSvg(shapes: LucideShape[], size = 15, strokeWidth = 1.8): string {
	const body = shapes
		.map((shape) => {
			if (shape.type === 'path') return `<path d="${shape.d}"/>`;
			if (shape.type === 'circle') {
				return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}"/>`;
			}
			const rx = shape.rx ?? 0;
			const ry = shape.ry ?? 0;
			return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${rx}" ry="${ry}"/>`;
		})
		.join('');

	return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
