/** 将 ```mermaid 转为 figure + div.mermaid（须在 EC 之前；div 才能让 gitGraph getBBox 算到尺寸） */
import { mermaidLabel } from '../lib/mermaid-blocks.ts';

export function rehypeMermaid() {
	return (tree) => {
		walkParents(tree, (node, index, parent) => {
			if (node.tagName !== 'pre' || !parent || index == null) return;
			const code = node.children?.[0];
			if (code?.tagName !== 'code') return;

			const classes = normalizeClassName(code.properties?.className);
			if (!classes.includes('language-mermaid')) return;

			const textNode = code.children?.[0];
			if (textNode?.type !== 'text') return;

			const source = textNode.value;
			const label = mermaidLabel(source);

			parent.children[index] = {
				type: 'element',
				tagName: 'figure',
				properties: { className: ['mermaid-figure'] },
				children: [
					{
						type: 'element',
						tagName: 'figcaption',
						properties: { className: ['mermaid-cap'] },
						children: [
							{
								type: 'element',
								tagName: 'span',
								properties: { className: ['mermaid-label'] },
								children: [{ type: 'text', value: label }],
							},
							{
								type: 'element',
								tagName: 'button',
								properties: {
									type: 'button',
									className: ['mermaid-copy-btn', 'btn-icon'],
									'data-mermaid-copy': '',
									'aria-label': '复制 Mermaid 源码',
								},
								children: [],
							},
						],
					},
					{
						type: 'element',
						tagName: 'div',
						properties: {
							className: ['mermaid'],
							'data-mermaid-source': source,
						},
						children: [{ type: 'text', value: source }],
					},
				],
			};
		});
	};
}

function normalizeClassName(value) {
	if (!value) return [];
	return Array.isArray(value) ? value.map(String) : [String(value)];
}

function walkParents(node, fn, parent = null, index = null) {
	fn(node, index, parent);
	if (node.children) {
		for (let i = 0; i < node.children.length; i++) {
			walkParents(node.children[i], fn, node, i);
		}
	}
}
