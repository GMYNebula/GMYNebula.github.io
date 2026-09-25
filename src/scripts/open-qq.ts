const MOBILE_RE = /Android|iPhone|iPad|iPod/i;

function isMobile(): boolean {
	return MOBILE_RE.test(navigator.userAgent);
}

function invokeProtocol(url: string): void {
	window.location.href = url;
}

/** 新版 NTQQ：打开资料卡，用户可点「加好友」 */
function buildNtqqProfileUrl(uin: string): string {
	const actionParams = JSON.stringify({
		uin,
		sourceType: 'QrCodeShareBuddyLink',
	});
	return `tencent://ntqq-open?subCmd=profile&action=openMiniBuddyProfile&actionParams=${encodeURIComponent(actionParams)}`;
}

/** 旧版 QQ 客户端加好友 */
function buildLegacyAddContactUrl(uin: string): string {
	return `tencent://AddContact/?fromId=50&fromSubId=1&subcmd=all&uin=${uin}`;
}

/** 手机 QQ 资料卡 */
function buildMobileProfileUrl(uin: string): string {
	return `mqqapi://card/show_pslcard?src_type=internal&version=1&uin=${uin}&card_type=person&source=sharecard`;
}

export function openQQAddFriend(uin: string, cardUrl?: string, useLegacy = false): void {
	if (cardUrl) {
		window.open(cardUrl, '_blank', 'noopener,noreferrer');
		return;
	}

	if (isMobile()) {
		invokeProtocol(buildMobileProfileUrl(uin));
		return;
	}

	if (useLegacy) {
		invokeProtocol(buildLegacyAddContactUrl(uin));
		return;
	}

	invokeProtocol(buildNtqqProfileUrl(uin));
}

export async function copyQQFallback(uin: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(uin);
		return true;
	} catch {
		return false;
	}
}

export function bindQQAddButtons(root: ParentNode = document): void {
	for (const btn of root.querySelectorAll<HTMLElement>('[data-qq-add]')) {
		if (btn.dataset.bound) continue;
		btn.dataset.bound = '1';

		const uin = btn.dataset.qqUin ?? '';
		const cardUrl = btn.dataset.qqCard?.trim() || undefined;
		const hint = btn.closest('.about-card')?.querySelector<HTMLElement>('[data-qq-hint]');
		let useLegacy = false;

		btn.addEventListener('click', async (e) => {
			e.preventDefault();
			openQQAddFriend(uin, cardUrl, useLegacy);
			if (!cardUrl && !isMobile()) useLegacy = true;

			window.setTimeout(async () => {
				const copied = await copyQQFallback(uin);
				if (!hint) return;
				hint.hidden = false;
				if (copied) {
					hint.textContent = cardUrl
						? `没打开 QQ？已复制 QQ 号 ${uin}`
						: `没到加好友页？已复制 QQ 号 ${uin}；再点一次图标会尝试旧版协议`;
				} else {
					hint.textContent = `没到加好友页？请手动搜索 QQ 号：${uin}`;
				}
			}, 1500);
		});
	}
}
