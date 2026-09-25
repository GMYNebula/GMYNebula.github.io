/** 统计 Markdown 正文字数（去语法后按字符计，适合中文博客） */
export function countArticleWords(source: string): number {
	const text = source
		.replace(/^---[\s\S]*?---/m, '')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[#>*_~\-|]/g, '')
		.replace(/\s+/g, '');

	return text.length;
}

export function formatWordCount(count: number): string {
	return count >= 10000 ? `${(count / 10000).toFixed(1)} 万字` : `${count.toLocaleString('zh-CN')} 字`;
}
