"use client";

import { useEffect, useRef, useState } from "react";
import { CreatorName } from "@/components/CreatorName";
import { RouteTransitionLink } from "@/components/RouteTransitionLink";
import type {
  SocialCommentListPayload,
  SocialCommentView,
  SocialPostListPayload,
  SocialPostView
} from "@/lib/social-types";
import { cn } from "@/lib/utils";

interface SocialCommunityPanelProps {
  canModerate: boolean;
}

function formatRelativeDate(value: string | null | undefined) {
  if (!value) {
    return "unknown";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "unknown";
  }

  const deltaMs = Date.now() - parsed;
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (deltaMs < minute) return "just now";
  if (deltaMs < hour) return `${Math.max(1, Math.floor(deltaMs / minute))}m ago`;
  if (deltaMs < day) return `${Math.max(1, Math.floor(deltaMs / hour))}h ago`;
  if (deltaMs < day * 7) return `${Math.max(1, Math.floor(deltaMs / day))}d ago`;

  return new Date(parsed).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
}

function mergeComments(current: SocialCommentView[], next: SocialCommentView[]) {
  const map = new Map<string, SocialCommentView>();
  [...current, ...next].forEach((entry) => {
    map.set(entry.id, entry);
  });

  return Array.from(map.values()).sort((left, right) => {
    const delta = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    if (delta !== 0) {
      return delta;
    }
    return left.id.localeCompare(right.id);
  });
}

export function SocialCommunityPanel({ canModerate }: SocialCommunityPanelProps) {
  const initializedRef = useRef(false);
  const [posts, setPosts] = useState<SocialPostView[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [postDraft, setPostDraft] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeDeleteKey, setActiveDeleteKey] = useState<string | null>(null);
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPosts = async (options?: { append?: boolean; cursor?: string | null }) => {
    const append = options?.append === true;
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set("limit", "8");
      params.set("commentsLimit", "3");
      if (options?.cursor) {
        params.set("cursor", options.cursor);
      }

      const response = await fetch(`/api/social/posts?${params.toString()}`, {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json().catch(() => ({}))) as
        | SocialPostListPayload
        | { message?: string };

      if (!response.ok) {
        throw new Error("message" in payload ? payload.message ?? "Unable to load posts." : "Unable to load posts.");
      }

      const result = payload as SocialPostListPayload;
      setPosts((current) => {
        if (!append) {
          return Array.isArray(result.items) ? result.items : [];
        }

        const map = new Map<string, SocialPostView>();
        current.forEach((entry) => map.set(entry.id, entry));
        (Array.isArray(result.items) ? result.items : []).forEach((entry) => map.set(entry.id, entry));
        return Array.from(map.values()).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
      });
      setNextCursor(result.nextCursor ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load posts.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    void loadPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!postDraft.trim()) {
      setErrorMessage("Write something before publishing.");
      return;
    }

    setIsCreatingPost(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postDraft })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        post?: SocialPostView;
      };

      if (!response.ok || !payload.post) {
        throw new Error(payload.message ?? "Unable to publish post.");
      }

      setPosts((current) => [payload.post as SocialPostView, ...current]);
      setPostDraft("");
      setInfoMessage("Post published.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to publish post.");
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setActiveDeleteKey(`post:${postId}`);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await fetch("/api/social/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to delete post.");
      }

      setPosts((current) => current.filter((entry) => entry.id !== postId));
      setInfoMessage(canModerate ? "Post removed from community." : "Post deleted.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete post.");
    } finally {
      setActiveDeleteKey(null);
    }
  };

  const handleLoadMoreComments = async (postId: string, cursor: string) => {
    setLoadingCommentsPostId(postId);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set("postId", postId);
      params.set("limit", "8");
      params.set("cursor", cursor);

      const response = await fetch(`/api/social/comments?${params.toString()}`, {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json().catch(() => ({}))) as
        | SocialCommentListPayload
        | { message?: string };

      if (!response.ok) {
        throw new Error("message" in payload ? payload.message ?? "Unable to load comments." : "Unable to load comments.");
      }

      const result = payload as SocialCommentListPayload;
      setPosts((current) =>
        current.map((entry) =>
          entry.id === postId
            ? {
                ...entry,
                commentCount: result.total,
                comments: mergeComments(entry.comments, result.items),
                commentsNextCursor: result.nextCursor
              }
            : entry
        )
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load comments.");
    } finally {
      setLoadingCommentsPostId(null);
    }
  };

  const handleCreateComment = async (postId: string) => {
    const content = commentDrafts[postId]?.trim() ?? "";
    if (!content) {
      setErrorMessage("Write a comment before sending it.");
      return;
    }

    setActiveCommentPostId(postId);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        comment?: SocialCommentView;
      };
      if (!response.ok || !payload.comment) {
        throw new Error(payload.message ?? "Unable to publish comment.");
      }

      setPosts((current) =>
        current.map((entry) =>
          entry.id === postId
            ? {
                ...entry,
                commentCount: entry.commentCount + 1,
                comments: mergeComments([payload.comment as SocialCommentView], entry.comments)
              }
            : entry
        )
      );
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      setInfoMessage("Comment published.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to publish comment.");
    } finally {
      setActiveCommentPostId(null);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    setActiveDeleteKey(`comment:${commentId}`);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const response = await fetch("/api/social/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to delete comment.");
      }

      setPosts((current) =>
        current.map((entry) =>
          entry.id === postId
            ? {
                ...entry,
                commentCount: Math.max(0, entry.commentCount - 1),
                comments: entry.comments.filter((comment) => comment.id !== commentId)
              }
            : entry
        )
      );
      setInfoMessage(canModerate ? "Comment removed from community." : "Comment deleted.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete comment.");
    } finally {
      setActiveDeleteKey(null);
    }
  };

  return (
    <section className="space-y-4">
      <section className="profile-surface social-arcade-panel social-community-panel p-4">
        <div className="social-arcade-stack-head flex flex-wrap items-center justify-between gap-2">
          <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
            Community Broadcast
          </p>
          <span className="text-xs text-black/60">
            {canModerate ? "Moderator tools enabled" : "Trainer feed"}
          </span>
        </div>
        <div className="grid gap-3">
          <textarea
            value={postDraft}
            onChange={(event) => setPostDraft(event.target.value)}
            rows={3}
            maxLength={560}
            placeholder="Share an update with the community..."
            className="social-arcade-field social-community-textarea rounded-lg border border-black/20 bg-white/88 px-3 py-2 text-sm text-black/78"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-black/58">
              {canModerate
                ? "Moderators can remove posts and comments directly from this feed."
                : "Keep it concise. Community posts are visible across the social hub."}
            </p>
            <button
              type="button"
              disabled={isCreatingPost}
              onClick={() => {
                void handleCreatePost();
              }}
              className={cn(
                "social-arcade-btn social-arcade-btn-green px-3 py-1.5 text-xs",
                isCreatingPost && "opacity-60"
              )}
            >
              {isCreatingPost ? "Publishing..." : "Publish post"}
            </button>
          </div>
          {infoMessage ? (
            <p className="rounded-lg border border-emerald-400/35 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              {infoMessage}
            </p>
          ) : null}
          {errorMessage ? (
            <p className="rounded-lg border border-rose-400/35 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </section>

      <section className="profile-surface social-arcade-panel social-community-panel p-4">
        <div className="social-arcade-stack-head flex items-center justify-between gap-2">
          <p className="social-arcade-title pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
            Live Community Feed
          </p>
          <span className="text-xs text-black/60">{posts.length} loaded</span>
        </div>

        <div className="pokemon-scrollbar mt-2 max-h-[48vh] space-y-3 overflow-y-auto pr-1">
          {isLoading && posts.length === 0 ? (
            <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
              Loading community posts...
            </p>
          ) : posts.length === 0 ? (
            <p className="social-arcade-empty rounded-lg border border-dashed border-black/25 bg-white/75 px-3 py-3 text-xs text-black/62">
              No posts yet. Publish the first update.
            </p>
          ) : (
            posts.map((post) => {
              const deleteKey = `post:${post.id}`;
              const isDeletingPost = activeDeleteKey === deleteKey;
              const isSubmittingComment = activeCommentPostId === post.id;
              const isLoadingComments = loadingCommentsPostId === post.id;
              const draft = commentDrafts[post.id] ?? "";

              return (
                <article
                  key={post.id}
                  className="social-community-card rounded-xl border border-black/20 bg-white/82 px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CreatorName
                          name={post.author?.displayName ?? "Unknown Trainer"}
                          role={post.author?.role}
                          compact
                          className="text-sm font-semibold text-black/88"
                          badgeClassName="text-[10px]"
                        />
                        <span className="text-[11px] text-black/54">{formatRelativeDate(post.createdAt)}</span>
                        <span className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[11px] text-black/60">
                          {post.commentCount} comments
                        </span>
                      </div>
                      {post.author?.profileHref ? (
                        <RouteTransitionLink
                          href={post.author.profileHref}
                          className="mt-1 inline-flex text-[11px] text-black/55 underline decoration-black/25 underline-offset-2"
                        >
                          Open profile
                        </RouteTransitionLink>
                      ) : null}
                    </div>
                    {post.canDelete ? (
                      <button
                        type="button"
                        disabled={isDeletingPost}
                        onClick={() => {
                          void handleDeletePost(post.id);
                        }}
                        className={cn(
                          "social-arcade-btn social-arcade-btn-red px-2 py-1 text-xs",
                          isDeletingPost && "opacity-60"
                        )}
                      >
                        {isDeletingPost ? "Removing..." : canModerate ? "Moderate delete" : "Delete"}
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-black/78">
                    {post.content}
                  </p>

                  <div className="mt-3 rounded-lg border border-black/15 bg-white/64 p-3">
                    <div className="space-y-2">
                      {post.comments.length === 0 ? (
                        <p className="text-xs text-black/58">No comments yet.</p>
                      ) : (
                        post.comments.map((comment) => {
                          const isDeletingComment = activeDeleteKey === `comment:${comment.id}`;
                          return (
                            <div
                              key={comment.id}
                              className="social-community-comment flex flex-wrap items-start justify-between gap-2 rounded-lg border border-black/10 bg-white/76 px-2.5 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <CreatorName
                                    name={comment.author?.displayName ?? "Unknown Trainer"}
                                    role={comment.author?.role}
                                    compact
                                    className="text-xs font-semibold text-black/84"
                                    badgeClassName="text-[9px]"
                                  />
                                  <span className="text-[11px] text-black/54">
                                    {formatRelativeDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-black/74">
                                  {comment.content}
                                </p>
                              </div>
                              {comment.canDelete ? (
                                <button
                                  type="button"
                                  disabled={isDeletingComment}
                                  onClick={() => {
                                    void handleDeleteComment(comment.id, post.id);
                                  }}
                                  className={cn(
                                    "social-arcade-btn social-arcade-btn-neutral px-1.5 py-0.5 text-[11px]",
                                    isDeletingComment && "opacity-60"
                                  )}
                                >
                                  {isDeletingComment ? "..." : "Delete"}
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {post.commentsNextCursor ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          disabled={isLoadingComments}
                          onClick={() => {
                            if (post.commentsNextCursor) {
                              void handleLoadMoreComments(post.id, post.commentsNextCursor);
                            }
                          }}
                          className={cn(
                            "social-arcade-btn social-arcade-btn-neutral px-2 py-1 text-xs",
                            isLoadingComments && "opacity-60"
                          )}
                        >
                          {isLoadingComments ? "Loading..." : "Load more comments"}
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <textarea
                        value={draft}
                        onChange={(event) =>
                          setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                        }
                        rows={2}
                        maxLength={320}
                        placeholder="Write a comment..."
                        className="social-arcade-field social-community-textarea min-h-[72px] flex-1 rounded-lg border border-black/20 bg-white/86 px-3 py-2 text-xs text-black/76"
                      />
                      <button
                        type="button"
                        disabled={isSubmittingComment}
                        onClick={() => {
                          void handleCreateComment(post.id);
                        }}
                        className={cn(
                          "social-arcade-btn social-arcade-btn-green px-3 py-1.5 text-xs sm:self-end",
                          isSubmittingComment && "opacity-60"
                        )}
                      >
                        {isSubmittingComment ? "Sending..." : "Comment"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {nextCursor ? (
          <div className="mt-3">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={() => {
                if (nextCursor) {
                  void loadPosts({ append: true, cursor: nextCursor });
                }
              }}
              className={cn(
                "social-arcade-btn social-arcade-btn-neutral px-2.5 py-1 text-xs",
                isLoadingMore && "opacity-60"
              )}
            >
              {isLoadingMore ? "Loading..." : "Load more posts"}
            </button>
          </div>
        ) : null}
      </section>
    </section>
  );
}
