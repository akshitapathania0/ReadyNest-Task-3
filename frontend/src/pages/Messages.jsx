import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { api } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { useSocket } from "../context/SocketContext";
import { Send, ArrowLeft } from "lucide-react";

function timeStamp(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Messages() {
  const { user } = useAuthStore();
  const { socket } = useSocket() || {};
  const queryClient = useQueryClient();
  const location = useLocation();
  const [activePartnerId, setActivePartnerId] = useState(
    location.state?.partnerId ?? null
  );
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get("/messages").then((r) => r.data),
  });

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ["messages", activePartnerId],
    queryFn: () => api.get(`/messages/${activePartnerId}`).then((r) => r.data),
    enabled: !!activePartnerId,
    refetchInterval: false,
  });

  const sendMutation = useMutation({
    mutationFn: (txt) => api.post(`/messages/${activePartnerId}`, { text: txt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activePartnerId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

  // Real-time socket messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      const partnerId =
        msg.senderId === user.id ? msg.receiverId : msg.senderId;
      queryClient.setQueryData(["messages", partnerId], (old = []) => {
        if (old.find((m) => m.id === msg.id)) return old;
        return [...old, msg];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }, [socket, user?.id, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find((c) => c.partner.id === activePartnerId);

  function handleSend(e) {
    e.preventDefault();
    if (text.trim()) sendMutation.mutate(text.trim());
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Messages</h1>
      <div className="flex border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden h-[70vh]">
        {/* Sidebar */}
        <div
          className={`w-full sm:w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 overflow-y-auto ${
            activePartnerId ? "hidden sm:flex flex-col" : "flex flex-col"
          }`}
        >
          {loadingConvs ? (
            <p className="p-4 text-sm text-gray-400">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">
              Follow users to start messaging them.
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partner.id}
                onClick={() => setActivePartnerId(conv.partner.id)}
                className={`flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                  activePartnerId === conv.partner.id
                    ? "bg-gray-100 dark:bg-gray-900"
                    : ""
                }`}
              >
                <img
                  src={conv.partner.profileImage || "/default-avatar.png"}
                  alt={conv.partner.username}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{conv.partner.username}</p>
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessage.senderId === user.id ? "You: " : ""}
                      {conv.lastMessage.text}
                    </p>
                  )}
                </div>
                {conv.unread > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Chat panel */}
        {activePartnerId ? (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <button
                className="sm:hidden p-1"
                onClick={() => setActivePartnerId(null)}
              >
                <ArrowLeft size={20} />
              </button>
              {activeConv && (
                <>
                  <img
                    src={activeConv.partner.profileImage || "/default-avatar.png"}
                    alt={activeConv.partner.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-semibold text-sm">{activeConv.partner.username}</span>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loadingMsgs ? (
                <p className="text-sm text-gray-400">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">
                  No messages yet. Say hi!
                </p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                          isMine
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-gray-100 dark:bg-gray-800 rounded-bl-sm"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isMine ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {timeStamp(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message…"
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim() || sendMutation.isPending}
                className="p-2 text-blue-500 disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center text-gray-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
