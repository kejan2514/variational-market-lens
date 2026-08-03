import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Variational Market Lens", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Variational Market Lens<\/title>/i);
  assert.match(html, /See the market/);
  assert.match(html, /MARKET SCREENER/);
  assert.match(html, /Independent market-data project/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("uses the official public market data endpoint", async () => {
  const route = await readFile(new URL("../app/api/stats/route.ts", import.meta.url), "utf8");
  const source = await readFile(new URL("../app/MarketLens.tsx", import.meta.url), "utf8");
  assert.match(route, /omni-client-api\.prod\.ap-northeast-1\.variational\.io\/metadata\/stats/);
  assert.match(route, /s-maxage=30/);
  assert.match(source, /\/api\/stats/);
  assert.match(source, /size_100k/);
  assert.match(source, /funding_rate/);
});
