import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { useSocket } from "../context/SocketContext";

export default function CommentSection({ postId, onCommentAdded }) {
  const { user } = useAuthStore();
  const { socket } = useSocket() || {};
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => (await api.get(`/posts/${postId}/comments`)).data,
  });

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      if (payload.postId !== postId) return;
      queryClient.setQueryData(["comments", postId], (old = []) => [...old, payload.comment]);
    };
    socket.on("post:new-comment", handler);
    return () => socket.off("post:new-comment", handler);
  }, [socket, postId, queryClient]);

  const addComment = useMutation({
    mutationFn: async (commentText) =>
      (await api.post(`/posts/${postId}/comments`, { text: commentText })).data,
    onSuccess: (newComment) => {
      queryClient.setQueryData(["comments", postId], (old = []) => [...old, newComment]);
      onCommentAdded?.();
      setText("");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId) => api.delete(`/posts/comments/${commentId}`),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData(["comments", postId], (old = []) =>
        old.filter((c) => c.id !== commentId)
      );
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (text.trim()) addComment.mutate(text.trim());
  }

  return (
    <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-2">
      <div className="max-h-48 overflow-y-auto space-y-1">
        {comments.map((c) => (
          <div key={c.id} className="text-sm flex items-start justify-between gap-2">
            <p>
              <span className="font-semibold">{c.user.username}</span> {c.text}
            </p>
            {c.user.id === user?.id && (
              <button
                onClick={() => deleteComment.mutate(c.id)}
                className="text-xs text-gray-400 hover:text-red-500 shrink-0"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 text-sm bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none py-1"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="text-sm font-semibold text-brand disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </div>
  );
}
