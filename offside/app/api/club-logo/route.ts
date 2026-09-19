import { NextRequest, NextResponse } from "next/server";

const SEARCH_API = "https://www.thesportsdb.com/api/v1/json/3/searchteams.php";
const REQUEST_TIMEOUT = 5000;

function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team")?.trim();
  if (!team || team.length > 100) {
    return NextResponse.json({ error: "A valid team name is required" }, { status: 400 });
  }

  try {
    const names = [...new Set([team, normalizeTeamName(team)])];
    for (const name of names) {
      const searchResponse = await fetchWithTimeout(
        `${SEARCH_API}?t=${encodeURIComponent(name)}`,
      );
      if (!searchResponse.ok) continue;

      const data = (await searchResponse.json()) as {
        teams?: Array<{ strTeamBadge?: string | null }>;
      };
      const badgeUrl = data.teams?.find((candidate) => candidate.strTeamBadge)?.strTeamBadge;
      if (!badgeUrl) continue;

      const imageResponse = await fetchWithTimeout(badgeUrl);
      if (!imageResponse.ok || !imageResponse.body) continue;

      return new NextResponse(imageResponse.body, {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "Content-Type": imageResponse.headers.get("content-type") ?? "image/png",
        },
      });
    }
  } catch (error) {
    console.warn("Club logo proxy failed:", error);
  }

  return NextResponse.json({ error: "Club logo not found" }, { status: 404 });
}
