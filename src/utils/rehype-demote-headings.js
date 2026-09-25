/** 页顶已有 h1 标题，正文 Markdown 标题整体降一级（# → h2，## → h3 …） */
export function rehypeDemoteHeadings() {
	return (tree) => {
		walk(tree, (node) => {
			if (node.type !== 'element' || !/^h[1-6]$/.test(node.tagName)) return;
			const level = Number(node.tagName.charAt(1));
			if (level >= 6) return;
			node.tagName = `h${level + 1}`;
		});
	};
}

/** 与 rehypeDemoteHeadings 配套，供 Astro headings 目录数据使用 */
export function demoteHeadingDepth(depth) {
	return Math.min(depth + 1, 6);
}

function walk(node, fn) {
	fn(node);
	if (node.children) {
		for (const child of node.children) walk(child, fn);
	}
}
