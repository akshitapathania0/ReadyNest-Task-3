import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Search, PlusSquare, Bookmark, Sun, Moon, LogOut, MessageSquare } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
        <Link to="/" className="text-xl font-bold tracking-tight">
          InstaFlux
        </Link>

        <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-xs mx-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users"
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </form>

        <nav className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Home size={22} />
          </Link>
          <Link
            to="/search"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 sm:hidden"
          >
            <Search size={22} />
          </Link>
          <Link
            to="/create"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <PlusSquare size={22} />
          </Link>
          <Link
            to="/messages"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Messages"
          >
            <MessageSquare size={22} />
          </Link>
          <Link
            to="/saved"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bookmark size={22} />
          </Link>
          <NotificationDropdown />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link to={`/profile/${user?.id}`}>
            <img
              src={user?.profileImage || "/default-avatar.png"}
              alt={user?.username}
              className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-700"
            />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Log out"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </div>
    </header>
  );
}
