"use client";

import { useEffect, useMemo, useState } from "react";

type Quote = { bid: string; ask: string };
type Listing = {
  ticker: string;
  name: string;
  mark_price: string;
  volume_24h: string;
  funding_rate: string;
  funding_interval_s: number;
  base_spread_bps: string;
  open_interest: { long_open_interest: string; short_open_interest: string };
  quotes?: { updated_at?: string; size_1k?: Quote; size_100k?: Quote; size_1m?: Quote };
};
type Stats = {
  total_volume_24h: string;
  cumulative_volume: string;
  tvl: string;
  open_interest: string;
  num_markets: number;
  listings: Listing[];
};
type SortKey = "volume" | "funding" | "spread" | "openInterest";

const formatUsd = (value: string | number, compact = true) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 2 : amount < 1 ? 6 : 2 }).format(amount);
};
const fundingPercent = (value: string) => Number(value) * 100;
const listingOi = (item: Listing) => Number(item.open_interest.long_open_interest) + Number(item.open_interest.short_open_interest);

export function MarketLens() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("volume");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/stats", { cache: "no-store" });
      if (!response.ok) throw new Error("Market feed is temporarily unavailable.");
      const data = await response.json() as Stats;
      setStats(data);
      setSelected((current) => current ? data.listings.find((item) => item.ticker === current.ticker) ?? data.listings[0] : data.listings[0]);
      setUpdatedAt(new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load market data.");
    }
  }

  useEffect(() => { load(); const interval = window.setInterval(load, 60_000); return () => window.clearInterval(interval); }, []);

  const listings = useMemo(() => {
    if (!stats) return [];
    const needle = query.trim().toLowerCase();
    return stats.listings
      .filter((item) => !needle || item.ticker.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sort === "funding") return Math.abs(fundingPercent(b.funding_rate)) - Math.abs(fundingPercent(a.funding_rate));
        if (sort === "spread") return Number(a.base_spread_bps) - Number(b.base_spread_bps);
        if (sort === "openInterest") return listingOi(b) - listingOi(a);
        return Number(b.volume_24h) - Number(a.volume_24h);
      });
  }, [stats, query, sort]);

  const topFunding = useMemo(() => [...(stats?.listings ?? [])].sort((a, b) => Math.abs(fundingPercent(b.funding_rate)) - Math.abs(fundingPercent(a.funding_rate))).slice(0, 6), [stats]);

  return <main className="shell">
    <header className="topbar">
      <a className="brand" href="#top"><span>V</span><div><b>VARIATIONAL</b><small>MARKET LENS</small></div></a>
      <nav><a href="#markets">Markets</a><a href="#liquidity">Liquidity</a><a href="https://docs.variational.io/" target="_blank" rel="noreferrer">Docs ↗</a></nav>
      <div className="live-pill"><i /> LIVE DATA</div>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy"><span className="eyebrow">OMNI MARKET INTELLIGENCE</span><h1>See the market<br/><em>between the quotes.</em></h1><p>Explore funding, open interest, spreads and size-aware liquidity across every Variational Omni market.</p><div className="hero-actions"><a className="primary" href="#markets">Explore markets <span>↓</span></a><button onClick={load}>Refresh feed ↻</button></div></div>
      <div className="signal-art" aria-hidden="true"><div className="signal-ring"><span>526</span><small>MARKETS</small></div><i className="orbit one"/><i className="orbit two"/><i className="pulse p1"/><i className="pulse p2"/></div>
    </section>

    <section className="metric-strip" aria-label="Platform statistics">
      <Metric label="24H VOLUME" value={stats ? formatUsd(stats.total_volume_24h) : "—"} note="Across all markets" />
      <Metric label="OPEN INTEREST" value={stats ? formatUsd(stats.open_interest) : "—"} note="Total outstanding" />
      <Metric label="TOTAL VALUE LOCKED" value={stats ? formatUsd(stats.tvl) : "—"} note="Settlement + OLP" />
      <Metric label="LISTED MARKETS" value={stats ? String(stats.num_markets) : "—"} note={updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading live feed"} accent />
    </section>

    {error && <section className="feed-error"><span>!</span><div><b>LIVE FEED INTERRUPTED</b><p>{error}</p></div><button onClick={load}>Try again</button></section>}

    <section className="dashboard" id="markets">
      <div className="section-head"><div><span>MARKET SCREENER</span><h2>All markets, one signal.</h2></div><p>Public read-only data · USDC denominated</p></div>
      <div className="controls"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticker or market" aria-label="Search markets" /></label><div className="sort-tabs" aria-label="Sort markets">{(["volume","openInterest","funding","spread"] as SortKey[]).map((key) => <button key={key} className={sort === key ? "active" : ""} onClick={() => setSort(key)}>{key === "openInterest" ? "Open interest" : key[0].toUpperCase() + key.slice(1)}</button>)}</div></div>
      <div className="market-layout">
        <div className="market-table" role="table" aria-label="Variational Omni markets">
          <div className="market-row table-head" role="row"><span>Market</span><span>Mark price</span><span>24h volume</span><span>Open interest</span><span>Funding</span><span>Spread</span></div>
          {!stats && Array.from({ length: 8 }, (_, index) => <div className="market-row loading-row" key={index}><i/><i/><i/><i/><i/><i/></div>)}
          {listings.slice(0, 40).map((item) => <button className={`market-row ${selected?.ticker === item.ticker ? "selected" : ""}`} role="row" key={item.ticker} onClick={() => setSelected(item)}>
            <span className="market-name"><b>{item.ticker}</b><small>{item.name}</small></span><span>{formatUsd(item.mark_price, false)}</span><span>{formatUsd(item.volume_24h)}</span><span>{formatUsd(listingOi(item))}</span><span className={fundingPercent(item.funding_rate) >= 0 ? "positive" : "negative"}>{fundingPercent(item.funding_rate).toFixed(4)}%</span><span>{Number(item.base_spread_bps).toFixed(2)} bps</span>
          </button>)}
        </div>
        <aside className="inspector" id="liquidity">
          <div className="inspector-head"><span>LIQUIDITY INSPECTOR</span><b>{selected?.ticker ?? "—"}</b></div>
          {selected ? <>
            <div className="price-focus"><small>MARK PRICE</small><strong>{formatUsd(selected.mark_price, false)}</strong><p>{selected.name}</p></div>
            <div className="oi-balance"><div><span>LONG OI</span><b>{formatUsd(selected.open_interest.long_open_interest)}</b></div><div><span>SHORT OI</span><b>{formatUsd(selected.open_interest.short_open_interest)}</b></div><i style={{ width: `${Math.max(4, Math.min(96, Number(selected.open_interest.long_open_interest) / Math.max(1, listingOi(selected)) * 100))}%` }} /></div>
            <h3>Size-aware quotes</h3><QuoteRow label="$1K" quote={selected.quotes?.size_1k} />
            <QuoteRow label="$100K" quote={selected.quotes?.size_100k} />
            <QuoteRow label="$1M" quote={selected.quotes?.size_1m} />
            <div className="freshness"><i/><span>QUOTE TIMESTAMP</span><b>{selected.quotes?.updated_at ? new Date(selected.quotes.updated_at).toLocaleTimeString() : "Unavailable"}</b></div>
          </> : <div className="empty-inspector">Select a market to inspect liquidity.</div>}
        </aside>
      </div>
    </section>

    <section className="funding-section">
      <div className="section-head"><div><span>FUNDING RADAR</span><h2>Where positioning gets expensive.</h2></div><p>Absolute funding rate leaders</p></div>
      <div className="funding-grid">{topFunding.map((item, index) => { const rate = fundingPercent(item.funding_rate); return <article key={item.ticker}><span>0{index + 1}</span><div><b>{item.ticker}</b><small>{item.name}</small></div><strong className={rate >= 0 ? "positive" : "negative"}>{rate >= 0 ? "+" : ""}{rate.toFixed(4)}%</strong><i style={{ width: `${Math.min(100, Math.abs(rate) * 4)}%` }}/></article>; })}</div>
    </section>

    <footer><div className="brand"><span>V</span><div><b>VARIATIONAL</b><small>MARKET LENS</small></div></div><p>Independent market-data project. Not affiliated with or endorsed by Variational.</p><a href="https://docs.variational.io/for-developers/api" target="_blank" rel="noreferrer">Public API ↗</a></footer>
  </main>;
}

function Metric({ label, value, note, accent = false }: { label: string; value: string; note: string; accent?: boolean }) { return <article className={accent ? "metric accent" : "metric"}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function QuoteRow({ label, quote }: { label: string; quote?: Quote }) { const spread = quote ? (Number(quote.ask) - Number(quote.bid)) / ((Number(quote.ask) + Number(quote.bid)) / 2) * 10_000 : null; return <div className="quote-row"><b>{label}</b><span><small>BID</small>{quote ? formatUsd(quote.bid, false) : "—"}</span><span><small>ASK</small>{quote ? formatUsd(quote.ask, false) : "—"}</span><em>{spread == null ? "—" : `${spread.toFixed(2)} bps`}</em></div>; }
