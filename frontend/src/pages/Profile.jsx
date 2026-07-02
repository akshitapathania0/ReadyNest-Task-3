import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Grid, Settings, MessageSquare } from "lucide-react";
import { api } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { GridSkeleton } from "../components/Skeleton";

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isOwn = currentUser?.id === id;

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => (await api.get(`/users/${id}`)).data,
  });

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const followMutation = useMutation({
    mutationFn: async () => api.post(`/users/${id}/follow`),
    onSuccess: (res) => {
      const { following, followerCount } = res.data;
      queryClient.setQueryData(["profile", id], (old) => ({
        ...old,
        isFollowing: following,
        _count: { ...old._count, followers: followerCount },
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-8 mb-8">
          <div className="skeleton w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-48" />
          </div>
        </div>
        <GridSkeleton count={9} />
      </div>
    );
  }

  if (isError) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-red-500">User not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        <img
          src={profile.profileImage || "/default-avatar.png"}
          alt={profile.username}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border border-gray-300 dark:border-gray-700"
        />

        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-xl font-semibold">{profile.username}</h1>
            {isOwn ? (
              <Link
                to={`/profile/${id}/edit`}
                className="flex items-center gap-1 px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Settings size={14} /> Edit Profile
              </Link>
            ) : (
              <>
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`px-4 py-1 text-sm font-semibold rounded-md ${
                    profile.isFollowing
                      ? "border border-gray-300 dark:border-gray-700"
                      : "bg-brand text-white"
                  }`}
                >
                  {profile.isFollowing ? "Unfollow" : "Follow"}
                </button>
                {profile.isFollowing && (
                  <button
                    onClick={() => navigate("/messages", { state: { partnerId: id } })}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex gap-6 text-sm mb-3">
            <span><strong>{profile._count.posts}</strong> posts</span>
            <button onClick={() => setShowFollowers(true)} className="hover:underline">
              <strong>{profile._count.followers}</strong> followers
            </button>
            <button onClick={() => setShowFollowing(true)} className="hover:underline">
              <strong>{profile._count.following}</strong> following
            </button>
          </div>

          {profile.bio && <p className="text-sm whitespace-pre-line">{profile.bio}</p>}
        </div>
      </div>

      {/* Post Grid */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 mb-4">
          <Grid size={14} /> Posts
        </div>
        {profile.posts.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-3">
            {profile.posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`}>
                <img
                  src={post.imageUrl}
                  alt={post.caption || "post"}
                  className="aspect-square w-full object-cover hover:opacity-80 transition-opacity"
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <UserListModal title="Followers" userId={id} endpoint="followers" onClose={() => setShowFollowers(false)} />
      )}
      {showFollowing && (
        <UserListModal title="Following" userId={id} endpoint="following" onClose={() => setShowFollowing(false)} />
      )}
    </div>
  );
}

function UserListModal({ title, userId, endpoint, onClose }) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["userlist", userId, endpoint],
    queryFn: async () => (await api.get(`/users/${userId}/${endpoint}`)).data,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl w-72 max-h-96 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        {isLoading ? (
          <p className="p-4 text-gray-400 text-sm">Loading...</p>
        ) : users.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">No {title.toLowerCase()} yet.</p>
        ) : (
          users.map((u) => (
            <Link
              key={u.id}
              to={`/profile/${u.id}`}
              onClick={onClose}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <img src={u.profileImage || "/default-avatar.png"} alt={u.username} className="w-9 h-9 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold">{u.username}</p>
                {u.bio && <p className="text-xs text-gray-400 truncate w-40">{u.bio}</p>}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
