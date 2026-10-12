import { defineEcConfig } from 'astro-expressive-code';

export default defineEcConfig({
	// 夜间：github-dark-dimmed；日间：github-light-default
	themes: ['github-dark-dimmed', 'github-light-default'],
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
		borderColor: ['#444c56', '#d0d7de'],
		codeBackground: ['#22272e', '#ffffff'],
		codeForeground: ['#adbac7', '#1f2328'],
		focusBorder: ['rgba(232, 131, 107, 0.55)', 'rgba(196, 75, 47, 0.45)'],
		frames: {
			shadowColor: 'transparent',
			frameBoxShadowCssValue: 'none',
			editorActiveTabForeground: ['#adbac7', '#1f2328'],
			editorActiveTabIndicatorTopColor: ['transparent', 'transparent'],
			editorActiveTabBackground: ['#22272e', '#ffffff'],
			editorTabBarBackground: ['#1c2128', '#f6f8fa'],
			editorTabBarBorderColor: ['#444c56', '#d0d7de'],
			editorTabBarBorderBottomColor: ['#444c56', '#d0d7de'],
			editorBackground: ['#22272e', '#ffffff'],
			terminalTitlebarBackground: ['#1c2128', '#f6f8fa'],
			terminalTitlebarForeground: ['#768390', '#656d76'],
			terminalTitlebarBorderBottomColor: ['#444c56', '#d0d7de'],
			terminalBackground: ['#22272e', '#ffffff'],
		},
	},
});
