"use client";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NewsPage() {
  const { data, isLoading } = useSWR("/api/news", fetcher, { revalidateOnFocus: false });

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="font-grotesk text-lg font-medium text-warm mb-1">Football news</h2>
        <p className="text-xs text-steel mb-4">Latest from BBC Sport</p>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 w-full" />)}
          </div>
        )}

        {data?.length === 0 && !isLoading && (
          <p className="text-sm text-steel text-center py-8">No news available right now.</p>
        )}

        <div className="space-y-2">
          {data?.map((item: any, i: number) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 bg-card border border-border rounded-xl p-3 hover:border-indigo transition-colors"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover flex-shrink-0 bg-navy"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-navy flex-shrink-0 flex items-center justify-center text-steel text-lg">
                  ⚽
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-warm leading-snug line-clamp-2">{item.title}</div>
                {item.description && (
                  <p className="text-xs text-steel mt-1 leading-relaxed line-clamp-2 hidden sm:block">{item.description}</p>
                )}
                <div className="text-[10px] text-steel mt-1.5">{timeAgo(item.pubDate)}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
