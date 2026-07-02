import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../api/axios";
import { useSocket } from "../context/SocketContext";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function notificationText(n) {
  if (n.type === "LIKE") return "liked your post";
  if (n.type === "COMMENT") return "commented on your post";
  if (n.type === "FOLLOW") return "started following you";
  return "";
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const { socket } = useSocket() || {};
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
  });

  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      queryClient.setQueryData(["notifications"], (old = []) => [notification, ...old]);
    };
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [socket, queryClient]);

  const markAllRead = useMutation({
    mutationFn: async () => api.put("/notifications/read-all"),
    onSuccess: () => {
      queryClient.setQueryData(["notifications"], (old = []) =>
        old.map((n) => ({ ...n, read: true }))
      );
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unreadCount > 0) markAllRead.mutate();
        }}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 text-[10px] flex items-center justify-center bg-red-500 text-white rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                to={n.type === "FOLLOW" ? `/profile/${n.actor.id}` : `/post/${n.postId}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 ${
                  !n.read ? "bg-blue-50 dark:bg-blue-950/30" : ""
                }`}
              >
                <img
                  src={n.actor.profileImage || "/default-avatar.png"}
                  alt={n.actor.username}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="flex-1 text-sm">
                  <span className="font-semibold">{n.actor.username}</span>{" "}
                  {notificationText(n)}
                  <div className="text-xs text-gray-400">{timeAgo(n.createdAt)} ago</div>
                </div>
                {n.post?.imageUrl && (
                  <img src={n.post.imageUrl} alt="" className="w-9 h-9 rounded object-cover" />
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
