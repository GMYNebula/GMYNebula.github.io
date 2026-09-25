import type { MermaidConfig } from 'mermaid';

/** 白底画布 + 珊瑚/青绿描边的 Mermaid 主题（日/夜站点主题共用） */
export function getMermaidConfig(): MermaidConfig {
	const light = document.documentElement.getAttribute('data-theme') === 'light';
	const accent = light ? '#c44b2f' : '#e8836b';
	const accentSoft = light ? '#e8c4b8' : '#dba898';
	const teal = light ? '#6bb5a8' : '#7fc4b5';

	return {
		startOnLoad: false,
		theme: 'base',
		securityLevel: 'loose',
		fontFamily: 'Nunito, PingFang SC, Microsoft YaHei, Noto Sans SC, sans-serif',
		themeVariables: {
			background: '#ffffff',
			mainBkg: '#ffffff',
			primaryColor: '#ffffff',
			secondaryColor: '#fff7f3',
			tertiaryColor: '#f3faf8',
			primaryTextColor: '#171a1e',
			secondaryTextColor: '#171a1e',
			tertiaryTextColor: '#171a1e',
			textColor: '#3e4650',
			nodeTextColor: '#171a1e',
			primaryBorderColor: accentSoft,
			secondaryBorderColor: accent,
			tertiaryBorderColor: teal,
			lineColor: '#c8d0d8',
			arrowheadColor: accent,
			defaultLinkColor: '#b8c2cc',
			edgeLabelBackground: '#ffffff',
			clusterBkg: '#f8fafc',
			clusterBorder: '#dde4ec',
			titleColor: '#171a1e',
			nodeBorder: accentSoft,
			fontSize: '14px',
			fontWeight: '600',
			radius: '14px',
			strokeWidth: '1.75px',
			useGradient: false,
			git0: accent,
			git1: teal,
			git2: '#b8a4f0',
			git3: '#e6b450',
			gitBranchLabel0: '#ffffff',
			gitBranchLabel1: '#171a1e',
			gitBranchLabel2: '#171a1e',
			gitBranchLabel3: '#171a1e',
			commitLabelColor: '#171a1e',
			commitLabelBackground: '#ffffff',
			commitLabelFontSize: '14px',
		},
		gitGraph: {
			showBranches: true,
			showCommitLabel: true,
			rotateCommitLabel: false,
			mainBranchName: 'main',
			useMaxWidth: false,
			diagramPadding: 12,
		},
		flowchart: {
			htmlLabels: true,
			curve: 'basis',
			padding: 20,
			nodeSpacing: 52,
			rankSpacing: 56,
			useMaxWidth: true,
			diagramPadding: 16,
		},
	};
}

export function resetMermaidNodes(root: ParentNode = document): void {
	for (const node of root.querySelectorAll<HTMLElement>('.mermaid-figure > .mermaid[data-processed]')) {
		const source = node.dataset.mermaidSource?.trim();
		if (!source) continue;
		node.removeAttribute('data-processed');
		node.replaceChildren(document.createTextNode(source));
	}
}
