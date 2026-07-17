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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="font-grotesk text-lg font-medium text-warm mb-1">Football news</h2>
        <p className="text-xs text-steel mb-4">Latest from BBC Sport</p>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
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
              className="block bg-card border border-border rounded-xl p-3.5 hover:border-indigo transition-colors"
            >
              <div className="text-sm font-medium text-warm leading-snug">{item.title}</div>
              {item.description && (
                <p className="text-xs text-steel mt-1.5 leading-relaxed">{item.description}</p>
              )}
              <div className="text-[10px] text-steel mt-2">{timeAgo(item.pubDate)}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
