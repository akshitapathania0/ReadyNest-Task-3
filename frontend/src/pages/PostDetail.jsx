import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { api } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import CommentSection from "../components/CommentSection";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [caption, setCaption] = useState("");

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => (await api.get(`/posts/${id}`)).data,
    onSuccess: (data) => setCaption(data.caption || ""),
  });

  const likeMutation = useMutation({
    mutationFn: async () => api.post(`/posts/${id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["post", id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      navigate("/");
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => api.put(`/posts/${id}`, { caption }),
    onSuccess: (res) => {
      queryClient.setQueryData(["post", id], (old) => ({ ...old, caption: res.data.caption }));
      setEditMode(false);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex gap-6">
        <div className="skeleton flex-1 aspect-square rounded-lg" />
        <div className="w-80 space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-3 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-20 text-red-500">Post not found.</div>;
  }

  const isOwner = user?.id === post.user.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {/* Image */}
        <div className="md:w-1/2 bg-black">
          <img src={post.imageUrl} alt={post.caption || "post"} className="w-full h-full object-contain max-h-[70vh]" />
        </div>

        {/* Info panel */}
        <div className="md:w-1/2 flex flex-col">
          {/* Author */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <Link to={`/profile/${post.user.id}`} className="flex items-center gap-2">
              <img
                src={post.user.profileImage || "/default-avatar.png"}
                alt={post.user.username}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="font-semibold text-sm">{post.user.username}</span>
            </Link>
            {isOwner && (
              <div className="flex gap-2">
                <button onClick={() => setEditMode((e) => !e)} className="text-gray-400 hover:text-brand">
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => confirm("Delete?") && deleteMutation.mutate()}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="p-4 flex-1 overflow-y-auto">
            {editMode ? (
              <div className="mb-3">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full text-sm rounded-md px-2 py-1 bg-gray-100 dark:bg-gray-800 resize-none focus:outline-none"
                />
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => editMutation.mutate()}
                    className="text-xs font-semibold text-brand"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditMode(false)} className="text-xs text-gray-400">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              post.caption && (
                <p className="text-sm mb-3">
                  <span className="font-semibold">{post.user.username}</span> {post.caption}
                </p>
              )
            )}

            <CommentSection postId={post.id} />
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <button onClick={() => likeMutation.mutate()} aria-label="Like">
                <Heart
                  size={22}
                  className={post.likedByMe ? "fill-red-500 text-red-500" : ""}
                />
              </button>
            </div>
            <p className="text-sm font-semibold mt-1">{post.likeCount} likes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
