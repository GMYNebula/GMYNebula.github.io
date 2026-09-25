import { defineEcConfig } from 'astro-expressive-code';

export default defineEcConfig({
	// 夜间：ayu-dark；日间：ayu-light
	themes: ['ayu-dark', 'ayu-light'],
	useDarkModeMediaQuery: false,
	customizeTheme(theme) {
		theme.name = theme.type === 'dark' ? 'dark' : 'light';
		return theme;
	},
	defaultProps: {
		wrap: true,
	},
	frames: {
		showCopyToClipboardButton: true,
	},
	styleOverrides: {
		borderRadius: '0.65rem',
		codeFontSize: '0.9rem',
		borderColor: ['#1b1f29', 'rgba(107, 125, 143, 0.15)'],
		codeBackground: ['#10141c', '#fcfcfc'],
		codeForeground: ['#bfbdb6', '#5c6166'],
		focusBorder: ['rgba(232, 131, 107, 0.55)', 'rgba(196, 75, 47, 0.45)'],
		frames: {
			shadowColor: 'transparent',
			frameBoxShadowCssValue: 'none',
			editorActiveTabForeground: ['#bfbdb6', '#5c6166'],
			editorActiveTabIndicatorTopColor: ['#e6b450', '#f29718'],
			editorActiveTabBackground: ['#10141c', '#fcfcfc'],
			editorTabBarBackground: ['#0d1017', '#f8f9fa'],
			editorTabBarBorderColor: ['#1b1f29', 'rgba(107, 125, 143, 0.12)'],
			editorTabBarBorderBottomColor: ['#1b1f29', 'rgba(107, 125, 143, 0.12)'],
			editorBackground: ['#10141c', '#fcfcfc'],
			terminalTitlebarBackground: ['#0d1017', '#f8f9fa'],
			terminalTitlebarForeground: ['#5a6378', '#828e9f'],
			terminalTitlebarBorderBottomColor: ['#1b1f29', 'rgba(107, 125, 143, 0.12)'],
			terminalBackground: ['#0d1017', '#f8f9fa'],
		},
	},
});
