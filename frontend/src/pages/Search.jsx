import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { api } from "../api/axios";

function UserCard({ user }) {
  return (
    <Link
      to={`/profile/${user.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <img
        src={user.profileImage || "/default-avatar.png"}
        alt={user.username}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <p className="text-sm font-semibold">{user.username}</p>
        {user.bio && <p className="text-xs text-gray-400 line-clamp-1">{user.bio}</p>}
      </div>
    </Link>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const { data: results = [], isLoading: searching } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => (await api.get(`/users/search?q=${encodeURIComponent(query)}`)).data,
    enabled: query.trim().length > 0,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions"],
    queryFn: async () => (await api.get("/users/suggestions")).data,
    enabled: query.trim().length === 0,
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) setSearchParams({ q: query.trim() });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <form onSubmit={handleSubmit} className="relative mb-6">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) setSearchParams({});
          }}
          placeholder="Search users..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </form>

      {query.trim() ? (
        <>
          <h2 className="text-xs font-semibold uppercase text-gray-400 mb-2">Results</h2>
          {searching ? (
            <p className="text-sm text-gray-400">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-400">No users found for "{query}"</p>
          ) : (
            results.map((u) => <UserCard key={u.id} user={u} />)
          )}
        </>
      ) : (
        <>
          <h2 className="text-xs font-semibold uppercase text-gray-400 mb-2">Suggested</h2>
          {suggestions.length === 0 ? (
            <p className="text-sm text-gray-400">No suggestions right now.</p>
          ) : (
            suggestions.map((u) => <UserCard key={u.id} user={u} />)
          )}
        </>
      )}
    </div>
  );
}
