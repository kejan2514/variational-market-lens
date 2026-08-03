# Variational Market Lens

A live market-intelligence dashboard for Variational Omni's public market data.

> Independent open-source project. Not affiliated with or endorsed by Variational.

## Features

- Live platform volume, TVL, open interest, and market count
- Searchable market screener
- Volume, open-interest, funding, and spread sorting
- Long/short open-interest balance
- Size-aware $1K, $100K, and $1M bid/ask inspection
- Quote freshness indicators
- Funding-rate radar
- Responsive interface and automatic 60-second refresh
- Server-side API proxy with short caching to respect public rate limits

## Data source

The application uses Variational's public read-only endpoint:

```text
GET https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats
```

The trading API is not used and this project cannot place trades.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Validate the production build:

```bash
npm test
```

## Technology

- React 19
- TypeScript
- vinext and Vite
- Cloudflare-compatible server output
- Variational public REST API

## Security and disclaimer

This dashboard is informational software, not financial advice. Market data may be delayed, cached, incomplete, or unavailable. Always verify information through official sources before making financial decisions.

## License

MIT
