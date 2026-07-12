<p align="center">
  <img src="./STOCKWIZARD.png" alt="Stock Wizard" width="50%" />
</p>

<h1 align="center">Stock Wizard</h1>

<p align="center">
  An AI-powered stock research dashboard that pairs customizable financial analytics with a suite of Claude agents for news, single-stock analysis, portfolio advice, and pair-trading insights.
</p>

<p align="center">
  <strong>Check it out at: <a href="https://stock-wizard-zeta.vercel.app">stock-wizard-zeta.vercel.app</a></strong>
</p>

## Features

- **Customizable financial analytics widgets** — build your own dashboard by adding the indicators you care about (rolling statistics, moving averages, RSI, KDJ) and see key metrics like annualized return, volatility, and Sharpe ratio for every stock on your watchlist.

- **Company financials** — view a company's profile and financial fundamentals at a glance.

- **News agent** — surfaces the latest news for a stock, reads through each article, and gives you clean AI-written summaries and key takeaways so you don't have to skim a dozen headlines.

- **Stock analysis agent** — ask any question about a stock and get a tailored, AI-written analysis that pulls together its price history, fundamentals, news, and technical indicators to answer you.

- **Robo-advisor agent** — tell it your **risk appetite**, **target annual return**, **investment time horizon**, and any **themes you're interested in** (e.g. AI, clean energy, healthcare), and it builds you a personalized portfolio: a recommended mix of 5–10 stocks and ETFs, how much to allocate to each, the reasoning behind every pick, and the key risk to watch.

- **Pair trading visualizations** — compare a stock against related companies to spot mean-reversion opportunities, visualized so you can see when two names have drifted apart.

## Folder Structure

```
Stock Wizard/
├── frontend/                       # Vite + React + TypeScript client
│   └── src/
│       ├── app/                    # Redux store, typed hooks, query <-> store sync
│       ├── lib/                    # Shared API fetch wrappers
│       ├── assets/
│       └── features/               # One folder per feature area
│           ├── Form/               #   Search bar + timeframe selection
│           ├── Carousel/           #   Watchlist strip
│           ├── Card/               #   Per-stock summary card + metrics
│           ├── Chart/              #   Charts + analytics widget views
│           │   ├── ChartView.tsx   #     Multi-symbol overview + widget selector
│           │   ├── RollingView.tsx #     Rolling-stats widget
│           │   ├── MAView.tsx      #     Moving-average widget
│           │   ├── RSIView.tsx     #     RSI widget
│           │   ├── KDJView.tsx     #     KDJ widget
│           │   ├── PairView.tsx    #     Pair-trading / mean-reversion view
│           │   ├── NewsView.tsx    #     News + AI summaries
│           │   ├── ProfileView.tsx #     Company profile + financials
│           │   └── query.ts        #     Data-fetching hooks for this feature
│           ├── Chatbot/            #   Stock analysis agent panel
│           ├── Settings/           #   Robo-advisor preferences
│           └── Modal/
│
├── server/                         # Express + TypeScript API
│   └── src/
│       ├── security/               # Market data: chart, suggestions, news, profile, financials
│       │   ├── route.ts            #   Router + path definitions
│       │   ├── security.controller.ts  # Request handling + validation
│       │   ├── chart/chart.service.ts      # Business logic per sub-domain
│       │   ├── news/news.service.ts
│       │   ├── news/news.helper.ts         # Pure helpers where needed
│       │   ├── profile/profile.service.ts
│       │   ├── financial/financial.service.ts
│       │   └── suggestion/suggestion.service.ts
│       ├── analytics/              # rolling-stats, moving-average, rsi, kdj, mean-reversion
│       │   ├── route.ts
│       │   ├── analytics.controller.ts
│       │   └── <analytic>/<analytic>.helper.ts   # One folder per indicator
│       ├── advisor/                # Robo-advisor agent
│       │   ├── route.ts
│       │   ├── advisor.controller.ts
│       │   ├── advisor.service.ts
│       │   └── advisor.prompt.ts   #   Prompt templates
│       ├── analysis/               # Stock analysis agent (same layout as advisor)
│       └── shared/                 # Redis cache layer
│
├── .github/workflows/              # CI/CD (ci-cd.yml)
├── package.json                    # Root scripts (boots redis + server + frontend together)
└── CLAUDE.md                       # Architecture notes
```

**Backend convention** — every feature folder is organized the same way, so once you know one you know them all:

```
<feature>/
  route.ts                 # Router + path definitions
  <feature>.controller.ts  # Request/response handling + input validation
  <feature>.service.ts     # Business logic / external API calls
  <feature>.helper.ts      # Pure helpers / static data (where needed)
```

## Tech Stack

**Frontend**
- React 19 + TypeScript, built with Vite
- Redux Toolkit for state (watchlist, form, per-symbol analysis snapshots)
- TanStack Query for server-state fetching and caching
- Chart.js via react-chartjs-2 (luxon time adapter, zoom + annotation plugins)
- react-markdown + remark-gfm for streamed agent output
- simple-statistics / mathjs for client-side metrics

**Backend**
- Node.js + Express 5 + TypeScript (ESM)
- Anthropic Claude SDK for the news, analysis, and advisor agents
- yahoo-finance2 for market data
- Redis for chart-data caching
- jsdom + @mozilla/readability for article extraction

**Infrastructure**
- Frontend deployed on Vercel (proxies `/api/*` to the backend)
- Backend deployed on AWS Elastic Beanstalk
- CI/CD via GitHub Actions

## Getting Started

```bash
npm run install:all   # install root, frontend, and server deps
npm run dev           # boot redis + backend + frontend together
```

- Frontend: http://localhost:5173 (Vite)
- Backend: http://localhost:5001

The backend requires a reachable Redis instance (`REDIS_URL`, default `redis://localhost:6380`) and an Anthropic API key for the agent features. The frontend reads `VITE_API_BASE_URL` (defaults to `http://localhost:5001`). See each half's `.env.example`.
