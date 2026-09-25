/** 与 rehype-mermaid 共用：识别图类型、把 dev HMR 漏掉的原始代码块升级成 figure */
export function mermaidLabel(source: string): string {
	const head = source.trim().split(/\r?\n/)[0]?.trim() ?? '';
	if (/^(flowchart|graph)\b/.test(head)) return '流程图';
	if (head.startsWith('sequenceDiagram')) return '时序图';
	if (head.startsWith('stateDiagram')) return '状态图';
	if (head.startsWith('classDiagram')) return '类图';
	if (head.startsWith('erDiagram')) return 'ER 图';
	if (head.startsWith('gantt')) return '甘特图';
	if (head.startsWith('pie')) return '饼图';
	if (head.startsWith('gitGraph')) return 'Git 图';
	if (head.startsWith('journey')) return '旅程图';
	if (head.startsWith('timeline')) return '时间线';
	if (head.startsWith('mindmap')) return '思维导图';
	return '图表';
}

function readMermaidSource(el: Element): string {
	const fromData = (el as HTMLElement).dataset.mermaidSource?.trim();
	if (fromData) return fromData;
	return (el.textContent ?? '').trim();
}

/** 从 Expressive Code / 原始 pre 里抽出 mermaid 源码 */
function extractRawMermaidSource(block: Element): string | null {
	const pre = block.matches('pre')
		? block
		: block.querySelector('pre[data-language="mermaid"], pre > code.language-mermaid')?.closest('pre') ??
			block.querySelector('pre');
	if (!pre) return null;

	const lang =
		pre.getAttribute('data-language') ??
		pre.querySelector('code')?.className.match(/language-(\S+)/)?.[1] ??
		'';
	if (lang !== 'mermaid') {
		const code = pre.querySelector('code');
		if (!code?.classList.contains('language-mermaid')) return null;
	}

	return readMermaidSource(pre);
}

export function buildMermaidFigure(source: string): HTMLElement {
	const figure = document.createElement('figure');
	figure.className = 'mermaid-figure';

	const cap = document.createElement('figcaption');
	cap.className = 'mermaid-cap';

	const label = document.createElement('span');
	label.className = 'mermaid-label';
	label.textContent = mermaidLabel(source);

	const copyBtn = document.createElement('button');
	copyBtn.type = 'button';
	copyBtn.className = 'mermaid-copy-btn btn-icon';
	copyBtn.dataset.mermaidCopy = '';
	copyBtn.setAttribute('aria-label', '复制 Mermaid 源码');

	cap.append(label, copyBtn);

	const host = document.createElement('div');
	host.className = 'mermaid';
	host.dataset.mermaidSource = source;
	host.textContent = source;

	figure.append(cap, host);
	return figure;
}

/**
 * dev 保存 Markdown 时，偶发 rehype 未跑、页面变成 EC 代码块；
 * 或正文热替换后客户端脚本未重绘。先把原始块升级成 figure。
 */
export function upgradeMermaidBlocks(root: ParentNode = document): void {
	const prose =
		root instanceof Element && root.classList.contains('prose')
			? root
			: root.querySelector('.prose');
	if (!prose) return;

	const selectors = [
		'.expressive-code pre[data-language="mermaid"]',
		'pre:has(> code.language-mermaid)',
		'pre > code.language-mermaid',
	].join(',');

	for (const hit of prose.querySelectorAll(selectors)) {
		const pre = hit.matches('pre') ? hit : hit.closest('pre');
		if (!pre || pre.closest('.mermaid-figure')) continue;

		const source = extractRawMermaidSource(pre);
		if (!source) continue;

		const figure = buildMermaidFigure(source);
		const ec = pre.closest('.expressive-code');
		if (ec) {
			ec.replaceWith(figure);
		} else {
			pre.replaceWith(figure);
		}
	}
}

export function collectMermaidRenderNodes(root: ParentNode = document): HTMLElement[] {
	upgradeMermaidBlocks(root);
	return [
		...root.querySelectorAll<HTMLElement>('.mermaid-figure > .mermaid:not([data-processed])'),
	];
}
