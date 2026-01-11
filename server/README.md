# Stock Wizard API

This API provides access to Yahoo Finance data including historical price charts, search suggestions, and related symbol recommendations.

Base URL:

```
https://stock-wizard-server.onrender.com
```

---

## **Endpoints**

### 1. **Fetch Security Data**

**Endpoint:**

```
GET /api/sec
```

**Description:**
Retrieve historical price data for a given security (stock or ETF) within a specified time range and interval.

**Query Parameters:**

| Parameter  | Type   | Description                                                         | Required |
| ---------- | ------ | ------------------------------------------------------------------- | -------- |
| `symbol`   | string | Ticker symbol of the security (e.g., `AAPL`)                        | Yes      |
| `start`    | string | Start date in milliseconds since Unix epoch (e.g., `1696176000000`) | Yes      |
| `end`      | string | End date in milliseconds since Unix epoch (e.g., `1698777600000`)   | Yes      |
| `interval` | string | Data interval (e.g., `1d`, `1wk`, `1mo`)                            | Yes      |

**Response Example:**

```json
[
  {
    "date": "2026-01-10T00:00:00.000Z",
    "open": 150.0,
    "high": 155.0,
    "low": 148.0,
    "close": 154.0,
    "volume": 1200000
  }
]
```

**Error Responses:**

* `400 Bad Request` – if any required parameter is missing.
* `500 Internal Server Error` – if the symbol does not exist.

---

### 2. **Search Suggestions**

**Endpoint:**

```
GET /api/suggestion
```

**Description:**
Provides auto-suggested securities as the user types in a search bar.

**Query Parameters:**

| Parameter | Type   | Description                            | Required |
| --------- | ------ | -------------------------------------- | -------- |
| `search`  | string | Text to search for matching securities | Yes      |

**Response Example:**

```json
[
  "AAPL",
  "AMZN",
  "MSFT",
  "GOOGL"
]
```

> Only returns securities of type `EQUITY` or `ETF`.

---

### 3. **Related Symbol Recommendations**

**Endpoint:**

```
GET /api/recommendation
```

**Description:**
Fetches related symbols and recommendations for a given security based on analyst recommendations.

**Query Parameters:**

| Parameter | Type   | Description                   | Required |
| --------- | ------ | ----------------------------- | -------- |
| `symbol`  | string | Ticker symbol of the security | Yes      |

**Response Example:**

```json
[
  "MSFT",
  "GOOGL",
  "AMZN"
]
```

**Error Responses:**

* `500 Internal Server Error` – if recommendations are not available.

---

## **Usage Example (Frontend with Fetch)**

```javascript
// Fetch historical data for Apple
fetch('https://stock-wizard-server.onrender.com/api/sec?symbol=AAPL&start=1696176000000&end=1698777600000&interval=1d')
  .then(res => res.json())
  .then(data => console.log(data));

// Get search suggestions for "Micro"
fetch('https://stock-wizard-server.onrender.com/api/suggestion?search=Micro')
  .then(res => res.json())
  .then(data => console.log(data));

// Get recommendations for Apple
fetch('https://stock-wizard-server.onrender.com/api/recommendation?symbol=AAPL')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## **Notes**

* All dates must be passed as Unix timestamps (milliseconds).
* Intervals supported by Yahoo Finance include: `1m`, `2m`, `5m`, `15m`, `30m`, `60m`, `90m`, `1d`, `5d`, `1wk`, `1mo`, `3mo`.
* Currently, the API only supports equities and ETFs.
