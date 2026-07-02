import { useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../api/axios";
import PostCard from "../components/PostCard";
import { PostSkeleton } from "../components/Skeleton";

const FEED_KEY = ["feed"];

async function fetchFeed({ pageParam }) {
  const params = pageParam ? `?cursor=${pageParam}` : "";
  const { data } = await api.get(`/posts/feed${params}`);
  return data;
}

export default function Home() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: FEED_KEY,
    queryFn: fetchFeed,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null,
  });

  const sentinelRef = useRef(null);

  const onIntersect = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(onIntersect, { threshold: 0.5 });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onIntersect]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center text-red-500">
        {error.message}
      </div>
    );
  }

  const posts = data.pages.flatMap((p) => p.posts);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-semibold">No posts yet</p>
          <p className="text-sm mt-1">Follow some users to see their posts here.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} feedQueryKey={FEED_KEY} />
        ))
      )}

      <div ref={sentinelRef} className="h-8" />

      {isFetchingNextPage && <PostSkeleton />}
    </div>
  );
}
