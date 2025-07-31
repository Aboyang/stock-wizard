# Stock Wizard

**Wizardry in Wealth, Magic in Metrics**  
_Lumos Your Financial Future_


## Overview

**Stock Wizard** is a web-based financial analytics tool designed to empower retail investors and finance enthusiasts with actionable insights, interactive visualizations, and quant-backed signals — all with a touch of wizardry.

From customizable portfolio tracking to advanced individual stock analysis, Stock Wizard bridges intuitive UI with professional-grade metrics.


## Features

### Customizable Portfolio Tracking
- Add your favorite stock tickers to monitor
- Adjust analysis timeframes (e.g., 1Y, 6M, etc.)
- Instantly view key portfolio metrics:
  - **Annualized Return**
  - **Volatility**
  - **Sharpe Ratio**

### Deep-Dive Stock Analysis
Analyze individual stocks with a variety of dynamic analytics:

#### Rolling Analytics
- **Rolling Mean** – Smoothens short-term noise to reveal long-term trends
- **Rolling Volatility** – Visualizes time-varying risk
- Example: `64.4% Momentum` indicates the stock’s recent return outperformed 64.4% of its own historical returns

#### Moving Average Crossover Signals
- **Golden Cross** (Buy signal): Short-term MA crosses above long-term MA
- **Death Cross** (Sell signal): Short-term MA crosses below long-term MA

#### Mean-Reversion Pair Trading
- Identify the most positively correlated stock pair
- Model historical price spread
- Trade signal is triggered when price spread deviates ±1.5 standard deviations from mean


## Tech Stack

### Frontend
- **React JS** – Modular, reusable component-based UI
- **Redux** – Scalable and predictable state management

### ⚙Backend
- **Node.js** – REST API logic and server-side processes
- **yahoo-finance-2** – Reliable module for fetching real-time and historical stock data


## Live Demo

Explore Stock Wizard now:  
🔗 **[stock-wizard-4llm.vercel.app](http://stock-wizard-4llm.vercel.app)**


## Future Enhancements
- User authentication and watchlist saving
- Responsive mobile experience
- Integrate more strategies including time-series forecasting models


## Feedback
Have a feature idea or found a bug?  
Feel free to open an issue or reach out via GitHub.
