let bound = false;
let dialog: HTMLDialogElement | null = null;

const WIDTH = 750;
const PAD = 56;
const QR_SIZE = 176;

type ShareData = {
	url: string;
	title?: string;
	text?: string;
	date: string;
	site: string;
	tagline: string;
	icon: string;
};

/** 客户端路由切页会换掉 body，弹窗要跟着重建 */
function ensureDialog(): HTMLDialogElement {
	if (dialog?.isConnected) return dialog;

	dialog = document.createElement('dialog');
	dialog.className = 'share-dialog';
	dialog.innerHTML =
		'<img alt="转发图片" />' +
		'<p>手机上长按图片即可保存</p>' +
		'<div class="share-actions">' +
		'<a download="nebulacoco-share.png">保存图片</a>' +
		'<button type="button" data-share-copy>复制链接</button>' +
		'<button type="button" data-share-close>关闭</button>' +
		'</div>';
	document.body.appendChild(dialog);

	dialog.addEventListener('click', async (e) => {
		const target = e.target as Element;
		if (target === dialog || target.closest('[data-share-close]')) dialog?.close();
		const copy = target.closest<HTMLButtonElement>('[data-share-copy]');
		if (copy) {
			await navigator.clipboard.writeText(copy.dataset.url ?? '');
			copy.textContent = '已复制';
		}
	});

	return dialog;
}

function cssVar(name: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** 字体变量里套着 var()，canvas 不认，借一个临时元素拿解析后的字体名 */
function resolvedFont(stack: string): string {
	const probe = document.createElement('span');
	probe.style.fontFamily = stack;
	document.body.appendChild(probe);
	const family = getComputedStyle(probe).fontFamily;
	probe.remove();
	return family;
}

/** 按字符折行，中文没有空格可断；超出行数时最后一行补省略号 */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
	const lines: string[] = [];
	let line = '';
	for (const char of text) {
		if (line && ctx.measureText(line + char).width > maxWidth) {
			lines.push(line);
			line = char;
		} else {
			line += char;
		}
	}
	if (line) lines.push(line);
	if (lines.length <= maxLines) return lines;

	const kept = lines.slice(0, maxLines);
	let last = kept[maxLines - 1];
	while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
	kept[maxLines - 1] = last + '…';
	return kept;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
	const img = new Image();
	img.src = src;
	await img.decode();
	return img;
}

async function drawCard(data: ShareData): Promise<string> {
	const { encode } = await import('uqr');
	const body = resolvedFont('var(--font-body-stack)');
	const display = resolvedFont('var(--font-display-stack)');
	// 标题字体按字符分片加载，卡片上的字页面里不一定出现过
	await Promise.all([
		document.fonts.load(`600 38px ${display}`, data.title ?? ''),
		document.fonts.load(`600 30px ${display}`, data.site),
		document.fonts.load(`26px ${body}`, `${data.text ?? ''}${data.tagline}${data.date}`),
	]);

	const color = {
		bg: cssVar('--surface'),
		ink: cssVar('--ink'),
		soft: cssVar('--ink-soft'),
		muted: cssVar('--muted'),
		accent: cssVar('--accent'),
		line: cssVar('--line'),
	};
	const inner = WIDTH - PAD * 2;

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;

	ctx.font = `600 38px ${display}`;
	const titleLines = data.title ? wrap(ctx, data.title, inner, 3) : [];
	ctx.font = `26px ${body}`;
	const textLines = data.text ? wrap(ctx, data.text, inner, data.title ? 4 : 7) : [];
	ctx.font = `20px ${body}`;
	const urlLines = wrap(ctx, data.url, inner - QR_SIZE - 32, 2);

	const headerH = 64;
	const titleH = titleLines.length * 54;
	const textH = textLines.length * 44;
	const contentTop = PAD + headerH + 64;
	const footerTop = contentTop + titleH + (titleH && textH ? 16 : 0) + textH + 56;
	const height = footerTop + QR_SIZE + PAD;

	const scale = 2;
	canvas.width = WIDTH * scale;
	canvas.height = height * scale;
	ctx.scale(scale, scale);
	ctx.textBaseline = 'top';

	ctx.fillStyle = color.bg;
	ctx.fillRect(0, 0, WIDTH, height);
	ctx.fillStyle = color.accent;
	ctx.fillRect(0, 0, WIDTH, 8);

	const icon = await loadImage(data.icon);
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(PAD, PAD, headerH, headerH, 16);
	ctx.clip();
	ctx.drawImage(icon, PAD, PAD, headerH, headerH);
	ctx.restore();

	ctx.fillStyle = color.ink;
	ctx.font = `600 30px ${display}`;
	ctx.fillText(data.site, PAD + headerH + 18, PAD + 4);
	ctx.fillStyle = color.muted;
	ctx.font = `20px ${body}`;
	ctx.fillText(data.tagline, PAD + headerH + 18, PAD + 42);

	ctx.fillStyle = color.line;
	ctx.fillRect(PAD, PAD + headerH + 32, inner, 1);

	let y = contentTop;
	ctx.fillStyle = color.ink;
	ctx.font = `600 38px ${display}`;
	for (const line of titleLines) {
		ctx.fillText(line, PAD, y);
		y += 54;
	}
	if (titleH && textH) y += 16;
	ctx.fillStyle = color.soft;
	ctx.font = `26px ${body}`;
	for (const line of textLines) {
		ctx.fillText(line, PAD, y);
		y += 44;
	}

	ctx.fillStyle = color.muted;
	ctx.font = `22px ${body}`;
	ctx.fillText(data.date, PAD, footerTop + 8);
	ctx.fillStyle = color.soft;
	ctx.fillText('扫码或长按识别二维码阅读', PAD, footerTop + 48);
	ctx.fillStyle = color.muted;
	ctx.font = `20px ${body}`;
	urlLines.forEach((line, i) => ctx.fillText(line, PAD, footerTop + 96 + i * 30));

	// 二维码在深色主题下也画成白底黑块，否则不好识别
	const qrX = WIDTH - PAD - QR_SIZE;
	ctx.fillStyle = '#fff';
	ctx.beginPath();
	ctx.roundRect(qrX, footerTop, QR_SIZE, QR_SIZE, 12);
	ctx.fill();
	const qr = encode(data.url, { ecc: 'M' });
	const cell = (QR_SIZE - 16) / qr.size;
	ctx.fillStyle = '#111';
	qr.data.forEach((row, r) =>
		row.forEach((on, c) => {
			if (on) ctx.fillRect(qrX + 8 + c * cell, footerTop + 8 + r * cell, cell + 0.5, cell + 0.5);
		}),
	);

	return canvas.toDataURL('image/png');
}

async function openShare(button: HTMLElement): Promise<void> {
	const d = button.dataset;
	const panel = ensureDialog();
	const img = panel.querySelector('img')!;
	const download = panel.querySelector('a')!;
	const copy = panel.querySelector<HTMLButtonElement>('[data-share-copy]')!;

	img.removeAttribute('src');
	copy.textContent = '复制链接';
	copy.dataset.url = d.shareUrl;
	panel.showModal();

	const src = await drawCard({
		url: d.shareUrl ?? location.href,
		title: d.shareTitle,
		text: d.shareText,
		date: d.shareDate ?? '',
		site: d.shareSite ?? '',
		tagline: d.shareTagline ?? '',
		icon: d.shareIcon ?? '',
	});
	img.src = src;
	download.href = src;
}

export function initShareCard(): void {
	if (bound) return;
	bound = true;
	document.addEventListener('click', (e) => {
		const button = (e.target as Element).closest<HTMLElement>('[data-share]');
		if (button) openShare(button);
	});
}
