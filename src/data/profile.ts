/** 作者资料（自旧站 gmynebula.github.io 迁入） */
export const profile = {
	avatar: '/img/avatar.png',
	/** QQ 式头像挂件（透明底装饰层，叠在圆形头像上） */
	pendant: '/effects/cat-pendant.png',
	icon: '/img/icon.png',
	email: '1017570673@qq.com',
	qq: '1017570673',
	/** 可选：QQ 里「分享名片」生成的 https://qm.qq.com/q/... 链接，比 tencent:// 更稳 */
	qqCardUrl: '',
	github: 'https://github.com/GMYNebula',
	bilibili: 'https://space.bilibili.com/2422828',
	csdn: 'https://blog.csdn.net/gmynebula',
	qr: {
		wechat: '/img/wechat-qr.png',
		qqPay: '/img/qq-qr.png',
	},
} as const;

/** 友链页展示的本站信息（部署后把 url 改成正式域名） */
export const siteLinkCard = {
	name: '星云可可の小窝',
	description: '爱猫娘，也爱编程',
	url: 'https://nebulacoco.top',
	icon: '/img/icon.png',
} as const;
