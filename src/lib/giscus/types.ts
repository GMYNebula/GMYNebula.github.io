import type { ReactionGroups } from './reactions';

export interface GiscusUser {
	avatarUrl: string;
	login: string;
	url: string;
}

export interface GiscusReply {
	id: string;
	author: GiscusUser;
	viewerDidAuthor: boolean;
	createdAt: string;
	url: string;
	authorAssociation: string;
	lastEditedAt: string | null;
	deletedAt: string | null;
	isMinimized: boolean;
	bodyHTML: string;
	replyToId: string;
	reactions: ReactionGroups;
}

export interface GiscusComment {
	id: string;
	author: GiscusUser;
	viewerDidAuthor: boolean;
	createdAt: string;
	url: string;
	authorAssociation: string;
	lastEditedAt: string | null;
	deletedAt: string | null;
	isMinimized: boolean;
	bodyHTML: string;
	replyCount: number;
	replies: GiscusReply[];
	reactions: ReactionGroups;
}

export interface GiscusDiscussion {
	id: string;
	url: string;
	locked: boolean;
	totalCommentCount: number;
	totalReplyCount: number;
	comments: GiscusComment[];
	pageInfo: {
		hasNextPage: boolean;
		endCursor: string;
	};
}

export interface GiscusDiscussionResponse {
	viewer: GiscusUser;
	discussion: GiscusDiscussion;
}

export type CommentSort = 'newest' | 'oldest';
