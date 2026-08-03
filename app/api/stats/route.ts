const API_URL = "https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats";

export async function GET() {
  try {
    const response = await fetch(API_URL, { headers: { accept: "application/json" }, cf: { cacheTtl: 30, cacheEverything: true } } as RequestInit & { cf: { cacheTtl: number; cacheEverything: boolean } });
    if (!response.ok) return Response.json({ error: "Upstream market feed unavailable" }, { status: 502 });
    return new Response(await response.text(), { headers: { "content-type": "application/json", "cache-control": "public, max-age=15, s-maxage=30" } });
  } catch {
    return Response.json({ error: "Could not reach the market feed" }, { status: 502 });
  }
}
