import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import { GridSkeleton } from "../components/Skeleton";

export default function Saved() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["saved"],
    queryFn: async () => (await api.get("/saved")).data,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-6">Saved Posts</h1>

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-semibold text-lg">No saved posts yet</p>
          <p className="text-sm mt-1">Tap the bookmark icon on a post to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-3">
          {posts.map((post) => (
            <Link key={post.id} to={`/post/${post.id}`}>
              <img
                src={post.imageUrl}
                alt={post.caption || "saved post"}
                className="aspect-square w-full object-cover hover:opacity-80 transition-opacity"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
