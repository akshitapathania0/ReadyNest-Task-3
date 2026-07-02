import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Bookmark, Trash2, Share2 } from "lucide-react";
import { api } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { useSocket } from "../context/SocketContext";
import CommentSection from "./CommentSection";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function PostCard({ post, onDeleted, feedQueryKey }) {
  const { user } = useAuthStore();
  const { socket } = useSocket() || {};
  const queryClient = useQueryClient();

  // Use server-provided values as initial state so they persist across refreshes
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [saved, setSaved] = useState(post.savedByMe ?? false);
  const [shareMsg, setShareMsg] = useState("");

  // Sync if the post prop updates (e.g. query refetch)
  useEffect(() => {
    setLiked(post.likedByMe ?? false);
    setLikeCount(post.likeCount ?? 0);
    setSaved(post.savedByMe ?? false);
    setCommentCount(post.commentCount ?? 0);
  }, [post.id, post.likedByMe, post.likeCount, post.savedByMe, post.commentCount]);

  useEffect(() => {
    if (!socket) return;
    const onLikeUpdate = (payload) => {
      if (payload.postId === post.id) setLikeCount(payload.count);
    };
    const onNewComment = (payload) => {
      if (payload.postId === post.id) setCommentCount((c) => c + 1);
    };
    socket.on("post:like-update", onLikeUpdate);
    socket.on("post:new-comment", onNewComment);
    return () => {
      socket.off("post:like-update", onLikeUpdate);
      socket.off("post:new-comment", onNewComment);
    };
  }, [socket, post.id]);

  const likeMutation = useMutation({
    mutationFn: async () => api.post(`/posts/${post.id}/like`),
    onMutate: () => {
      setLiked((l) => !l);
      setLikeCount((c) => (liked ? c - 1 : c + 1));
    },
    onError: () => {
      setLiked((l) => !l);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
    },
    onSuccess: ({ data }) => {
      // Sync with server truth
      setLiked(data.liked);
      setLikeCount(data.count);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => api.post(`/saved/${post.id}`),
    onMutate: () => setSaved((s) => !s),
    onError: () => setSaved((s) => !s),
    onSuccess: ({ data }) => setSaved(data.saved),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/posts/${post.id}`),
    onSuccess: () => {
      if (feedQueryKey) queryClient.invalidateQueries({ queryKey: feedQueryKey });
      onDeleted?.(post.id);
    },
  });

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.user.username}'s post on InstaFlux`,
          text: post.caption || "Check out this post!",
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied!");
        setTimeout(() => setShareMsg(""), 2000);
      } catch {
        setShareMsg("Copy failed");
        setTimeout(() => setShareMsg(""), 2000);
      }
    }
  }

  const isOwner = user?.id === post.userId;

  return (
    <article className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 mb-6">
      <div className="flex items-center justify-between p-3">
        <Link to={`/profile/${post.user.id}`} className="flex items-center gap-2">
          <img
            src={post.user.profileImage || "/default-avatar.png"}
            alt={post.user.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-semibold text-sm">{post.user.username}</span>
        </Link>
        {isOwner && (
          <button
            onClick={() => {
              if (confirm("Delete this post?")) deleteMutation.mutate();
            }}
            className="text-gray-400 hover:text-red-500"
            aria-label="Delete post"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <img src={post.imageUrl} alt={post.caption || "post"} className="w-full object-cover max-h-[600px]" />

      <div className="p-3">
        <div className="flex items-center gap-4">
          <button onClick={() => likeMutation.mutate()} aria-label="Like">
            <Heart
              size={24}
              className={liked ? "fill-red-500 text-red-500 transition-colors" : "transition-colors"}
            />
          </button>
          <button onClick={() => setShowComments((s) => !s)} aria-label="Comment">
            <MessageCircle size={24} />
          </button>
          <button onClick={handleShare} aria-label="Share" className="relative">
            <Share2 size={24} />
          </button>
          {shareMsg && (
            <span className="text-xs text-green-500 font-medium">{shareMsg}</span>
          )}
          <button onClick={() => saveMutation.mutate()} className="ml-auto" aria-label="Save">
            <Bookmark
              size={24}
              className={saved ? "fill-current transition-colors" : "transition-colors"}
            />
          </button>
        </div>

        <p className="text-sm font-semibold mt-2">
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </p>

        {post.caption && (
          <p className="text-sm mt-1">
            <span className="font-semibold">{post.user.username}</span> {post.caption}
          </p>
        )}

        <button
          onClick={() => setShowComments((s) => !s)}
          className="text-sm text-gray-500 mt-1"
        >
          View all {commentCount} comments
        </button>

        <p className="text-xs text-gray-400 mt-1 uppercase">{timeAgo(post.createdAt)}</p>

        {showComments && (
          <CommentSection postId={post.id} onCommentAdded={() => setCommentCount((c) => c + 1)} />
        )}
      </div>
    </article>
  );
}
