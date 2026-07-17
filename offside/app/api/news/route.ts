import { NextResponse } from "next/server";

// Lightweight, dependency-free RSS parsing — avoids pulling in an XML library
// just to read a handful of <item> blocks. Cached for 30 min to stay fast
// and avoid hammering the upstream feed.
export async function GET() {
  try {
    const res = await fetch("https://feeds.bbci.co.uk/sport/football/rss.xml", {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "OffsideApp/1.0" },
    });
    const xml = await res.text();

    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 8).map((m) => {
      const block = m[1];
      const title = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] ?? "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
      const description = block.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/)?.[1] ?? "";
      return { title, link, pubDate, description: description.replace(/<[^>]+>/g, "").slice(0, 140) };
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
