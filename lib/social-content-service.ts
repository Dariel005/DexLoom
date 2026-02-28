import {
  createSocialCommentRecord,
  createSocialPostRecord,
  deleteSocialCommentRecord,
  deleteSocialPostRecord,
  getBlockRelationBetweenUsers,
  getSocialCommentRecordById,
  getSocialPostRecordById,
  listBlockedUserIdsForViewer,
  listSocialCommentRecordsByPostIds,
  listSocialPostRecordsPaginated
} from "@/lib/social-repository";
import { resolveSocialUserSummary } from "@/lib/social-service";
import {
  type SocialCommentListPayload,
  type SocialCommentRecord,
  type SocialCommentView,
  type SocialPostListPayload,
  type SocialPostRecord,
  type SocialPostView,
  type SocialUserSummary
} from "@/lib/social-types";
import { findUserById } from "@/lib/user-store";

function normalizeUserId(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function toSafeTime(value: string | null | undefined) {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildCursor(createdAt: string, id: string) {
  return Buffer.from(`${createdAt}::${id}`, "utf-8").toString("base64");
}

function parseCursor(cursorRaw: string | null | undefined) {
  const cursor = String(cursorRaw ?? "").trim();
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const [createdAt, id] = decoded.split("::");
    if (!createdAt || !id) {
      return null;
    }
    return {
      createdAt,
      id
    };
  } catch {
    return null;
  }
}

function paginateRowsByCursor<T extends { id: string; createdAt: string }>(
  rows: T[],
  cursorRaw: string | null | undefined,
  limitRaw: number
) {
  const limit = Math.max(1, Math.min(80, Math.floor(limitRaw)));
  const cursor = parseCursor(cursorRaw);

  let startIndex = 0;
  if (cursor) {
    const cursorTime = toSafeTime(cursor.createdAt);
    startIndex = rows.findIndex((entry) => {
      const time = toSafeTime(entry.createdAt);
      if (time < cursorTime) {
        return true;
      }
      if (time > cursorTime) {
        return false;
      }
      return entry.id.localeCompare(cursor.id) > 0;
    });

    if (startIndex < 0) {
      return {
        items: [] as T[],
        nextCursor: null as string | null
      };
    }
  }

  const items = rows.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < rows.length;
  const nextCursor =
    hasMore && items.length > 0
      ? buildCursor(items[items.length - 1].createdAt, items[items.length - 1].id)
      : null;

  return {
    items,
    nextCursor
  };
}

async function requireViewer(userIdRaw: string) {
  const userId = normalizeUserId(userIdRaw);
  if (!userId) {
    throw new Error("Invalid user id.");
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User account not found.");
  }

  return userId;
}

async function buildSummaryCache(viewerId: string) {
  const cache = new Map<string, Promise<SocialUserSummary | null>>();

  const getSummary = (targetUserId: string) => {
    const cached = cache.get(targetUserId);
    if (cached) {
      return cached;
    }

    const promise = resolveSocialUserSummary(targetUserId, viewerId, null);
    cache.set(targetUserId, promise);
    return promise;
  };

  return getSummary;
}

function canDeleteContent(authorUserId: string, viewerId: string, allowModerationBypass: boolean) {
  return allowModerationBypass || authorUserId === viewerId;
}

function isVisibleAuthor(
  authorUserId: string,
  viewerId: string,
  blockedSet: ReadonlySet<string>,
  allowModerationBypass: boolean
) {
  if (allowModerationBypass || authorUserId === viewerId) {
    return true;
  }

  return !blockedSet.has(authorUserId);
}

async function toCommentView(
  record: SocialCommentRecord,
  viewerId: string,
  allowModerationBypass: boolean,
  getSummary: (userId: string) => Promise<SocialUserSummary | null>
): Promise<SocialCommentView | null> {
  const author = await getSummary(record.authorUserId);
  if (!author) {
    return null;
  }

  return {
    id: record.id,
    postId: record.postId,
    content: record.content,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    author,
    canDelete: canDeleteContent(record.authorUserId, viewerId, allowModerationBypass)
  };
}

async function collectVisiblePostsPage(
  viewerId: string,
  input: {
    limit: number;
    cursor?: string | null;
    allowModerationBypass?: boolean;
  }
) {
  const allowModerationBypass = input.allowModerationBypass === true;
  const blockedSet = allowModerationBypass ? new Set<string>() : new Set(await listBlockedUserIdsForViewer(viewerId));
  const items: SocialPostRecord[] = [];
  let repositoryCursor = input.cursor ?? null;
  let nextCursor: string | null = null;

  while (items.length < input.limit) {
    const page = await listSocialPostRecordsPaginated({
      limit: Math.min(120, Math.max(input.limit * 2, input.limit)),
      cursor: repositoryCursor
    });

    if (page.items.length === 0) {
      nextCursor = null;
      break;
    }

    for (const [index, entry] of page.items.entries()) {
      if (!isVisibleAuthor(entry.authorUserId, viewerId, blockedSet, allowModerationBypass)) {
        continue;
      }

      items.push(entry);
      if (items.length >= input.limit) {
        nextCursor =
          index < page.items.length - 1 || page.nextCursor
            ? buildCursor(entry.createdAt, entry.id)
            : null;
        break;
      }
    }

    if (items.length >= input.limit) {
      break;
    }

    if (!page.nextCursor) {
      nextCursor = null;
      break;
    }

    repositoryCursor = page.nextCursor;
  }

  return {
    items,
    nextCursor,
    blockedSet
  };
}

export async function listSocialPostsForViewer(
  viewerIdRaw: string,
  input?: {
    limit?: number;
    cursor?: string | null;
    commentsLimit?: number;
    allowModerationBypass?: boolean;
  }
): Promise<SocialPostListPayload> {
  const viewerId = await requireViewer(viewerIdRaw);
  const limit = Math.max(1, Math.min(40, Math.floor(input?.limit ?? 12)));
  const commentsLimit = Math.max(1, Math.min(8, Math.floor(input?.commentsLimit ?? 3)));
  const allowModerationBypass = input?.allowModerationBypass === true;
  const page = await collectVisiblePostsPage(viewerId, {
    limit,
    cursor: input?.cursor ?? null,
    allowModerationBypass
  });
  const getSummary = await buildSummaryCache(viewerId);
  const comments = await listSocialCommentRecordsByPostIds(page.items.map((entry) => entry.id));

  const commentsByPostId = new Map<string, SocialCommentRecord[]>();
  comments.forEach((entry) => {
    const list = commentsByPostId.get(entry.postId) ?? [];
    list.push(entry);
    commentsByPostId.set(entry.postId, list);
  });

  const items: SocialPostView[] = [];
  for (const record of page.items) {
    const author = await getSummary(record.authorUserId);
    if (!author) {
      continue;
    }

    const rawComments = commentsByPostId.get(record.id) ?? [];
    let visibleCount = 0;
    let previewCursor: string | null = null;
    const previewComments: SocialCommentView[] = [];

    for (const comment of rawComments) {
      if (!isVisibleAuthor(comment.authorUserId, viewerId, page.blockedSet, allowModerationBypass)) {
        continue;
      }

      visibleCount += 1;
      if (previewComments.length < commentsLimit) {
        const view = await toCommentView(comment, viewerId, allowModerationBypass, getSummary);
        if (!view) {
          continue;
        }
        previewComments.push(view);
        previewCursor = buildCursor(comment.createdAt, comment.id);
      }
    }

    items.push({
      id: record.id,
      content: record.content,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      author,
      canDelete: canDeleteContent(record.authorUserId, viewerId, allowModerationBypass),
      commentCount: visibleCount,
      comments: previewComments,
      commentsNextCursor: visibleCount > previewComments.length ? previewCursor : null
    });
  }

  return {
    items,
    nextCursor: page.nextCursor
  };
}

export async function createSocialPost(
  viewerIdRaw: string,
  input: {
    content: string;
  }
) {
  const viewerId = await requireViewer(viewerIdRaw);
  const record = await createSocialPostRecord({
    authorUserId: viewerId,
    content: input.content
  });
  const author = await resolveSocialUserSummary(viewerId, viewerId, null);

  return {
    id: record.id,
    content: record.content,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    author,
    canDelete: true,
    commentCount: 0,
    comments: [],
    commentsNextCursor: null
  } satisfies SocialPostView;
}

export async function deleteSocialPost(
  viewerIdRaw: string,
  input: {
    postId: string;
    allowModerationBypass?: boolean;
  }
) {
  const viewerId = await requireViewer(viewerIdRaw);
  const allowModerationBypass = input.allowModerationBypass === true;
  const post = await getSocialPostRecordById(input.postId);
  if (!post) {
    throw new Error("Post not found.");
  }

  if (!canDeleteContent(post.authorUserId, viewerId, allowModerationBypass)) {
    throw new Error("You are not allowed to delete this post.");
  }

  const deleted = await deleteSocialPostRecord(post.id);
  if (!deleted.post) {
    throw new Error("Post not found.");
  }

  return {
    ok: true as const,
    postId: deleted.post.id,
    deletedComments: deleted.deletedComments
  };
}

export async function listSocialCommentsForViewer(
  viewerIdRaw: string,
  input: {
    postId: string;
    limit?: number;
    cursor?: string | null;
    allowModerationBypass?: boolean;
  }
): Promise<SocialCommentListPayload> {
  const viewerId = await requireViewer(viewerIdRaw);
  const allowModerationBypass = input.allowModerationBypass === true;
  const post = await getSocialPostRecordById(input.postId);
  if (!post) {
    throw new Error("Post not found.");
  }

  const blockedSet = allowModerationBypass ? new Set<string>() : new Set(await listBlockedUserIdsForViewer(viewerId));
  if (!isVisibleAuthor(post.authorUserId, viewerId, blockedSet, allowModerationBypass)) {
    throw new Error("Post not found.");
  }

  const allComments = await listSocialCommentRecordsByPostIds([post.id]);
  const visibleComments = allComments.filter((entry) =>
    isVisibleAuthor(entry.authorUserId, viewerId, blockedSet, allowModerationBypass)
  );
  const page = paginateRowsByCursor(
    visibleComments,
    input.cursor ?? null,
    Math.max(1, Math.min(40, Math.floor(input.limit ?? 8)))
  );
  const getSummary = await buildSummaryCache(viewerId);
  const items = (
    await Promise.all(
      page.items.map((entry) => toCommentView(entry, viewerId, allowModerationBypass, getSummary))
    )
  ).filter((entry): entry is SocialCommentView => Boolean(entry));

  return {
    postId: post.id,
    items,
    total: visibleComments.length,
    nextCursor: page.nextCursor
  };
}

export async function createSocialComment(
  viewerIdRaw: string,
  input: {
    postId: string;
    content: string;
  }
) {
  const viewerId = await requireViewer(viewerIdRaw);
  const post = await getSocialPostRecordById(input.postId);
  if (!post) {
    throw new Error("Post not found.");
  }

  if (post.authorUserId !== viewerId) {
    const blockRelation = await getBlockRelationBetweenUsers(viewerId, post.authorUserId);
    if (blockRelation.viewerBlockedTarget || blockRelation.targetBlockedViewer) {
      throw new Error("You cannot comment on this trainer's post.");
    }
  }

  const record = await createSocialCommentRecord({
    postId: post.id,
    authorUserId: viewerId,
    content: input.content
  });
  const author = await resolveSocialUserSummary(viewerId, viewerId, null);

  return {
    id: record.id,
    postId: record.postId,
    content: record.content,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    author,
    canDelete: true
  } satisfies SocialCommentView;
}

export async function deleteSocialComment(
  viewerIdRaw: string,
  input: {
    commentId: string;
    allowModerationBypass?: boolean;
  }
) {
  const viewerId = await requireViewer(viewerIdRaw);
  const allowModerationBypass = input.allowModerationBypass === true;
  const comment = await getSocialCommentRecordById(input.commentId);
  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (!canDeleteContent(comment.authorUserId, viewerId, allowModerationBypass)) {
    throw new Error("You are not allowed to delete this comment.");
  }

  const deleted = await deleteSocialCommentRecord(comment.id);
  if (!deleted) {
    throw new Error("Comment not found.");
  }

  return {
    ok: true as const,
    commentId: deleted.id,
    postId: deleted.postId
  };
}
