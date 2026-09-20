# Hotel Offer Orchestrator

Aggregate overlapping hotel offers from two mock suppliers, deduplicate hotels by name, and select the best-priced offer per hotel using Temporal.io workflow orchestration.

## Architecture

```
                    ┌──────────────┐
                    │   Express    │
                    │   API        │
                    │  (server)    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Temporal   │
                    │   Workflow   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │ Supplier A │ │Redis  │ │ Supplier B│
        │ (mock)     │ │Cache  │ │ (mock)    │
        └───────────┘ └───────┘ └───────────┘
```

The Express API receives hotel search requests and delegates to a Temporal workflow. The workflow calls both mock suppliers in parallel, deduplicates hotels by name (keeping the cheaper option), caches results in Redis, and returns the final list. Price filtering is implemented directly in Redis using sorted sets.

## Prerequisites

- Docker + Docker Compose
- Node.js 20+ (for local development only)

## Setup & Run

### Docker Deployment (Recommended)

```bash
# Clone the repository & launch all services
docker compose up -d --build
```

This starts all 5 containers required for production/local deployment:
- **api** (`http://localhost:3000`) — Express REST API server (`node:20-slim`)
- **worker** — Temporal worker process running activities and workflows (`node:20-slim`)
- **redis** (`localhost:6379`) — Redis caching layer for price index & hotel payload storage
- **temporal** (`localhost:7233`) — Temporal server engine using `temporalio/admin-tools` CLI dev mode
- **temporal-ui** (`http://localhost:8080`) — Temporal Web UI workflow monitoring dashboard

> **Note on Base Image:** The Dockerfile uses `node:20-slim` to ensure native `glibc` library compatibility required by the `@temporalio/core-bridge` Rust native bindings.

### Local Development

```bash
# Terminal 1: Start Redis & Temporal services in background
docker compose up -d redis temporal

# Terminal 2: Install dependencies & run Temporal Worker
npm install
npm run dev:worker

# Terminal 3: Run API Server with hot reload
npm run dev
```

## API Endpoints

### GET /api/hotels

Returns deduplicated best-price hotel list for a city.

```bash
# All hotels in Delhi
curl "http://localhost:3000/api/hotels?city=delhi"

# Filtered by price range
curl "http://localhost:3000/api/hotels?city=delhi&minPrice=4000&maxPrice=6000"

# City with no results
curl "http://localhost:3000/api/hotels?city=atlantis"
```

**Response format:**
```json
[
  {
    "name": "Holtin",
    "price": 5340,
    "supplier": "Supplier B",
    "commissionPct": 20
  }
]
```

### GET /supplierA/hotels, /supplierB/hotels

Mock supplier endpoints (used internally by Temporal activities).

```bash
curl "http://localhost:3000/supplierA/hotels?city=delhi"
curl "http://localhost:3000/supplierB/hotels?city=delhi&simulateDown=true"
```

### GET /health

Health check reporting status of all dependencies.

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "redis": "up",
  "temporal": "up",
  "supplierA": "up",
  "supplierB": "up"
}
```

## Postman Collection

Import `postman/hotel-offer-orchestrator.postman_collection.json` into Postman:

1. Open Postman → Import → drag the `.json` file
2. Set the `baseUrl` collection variable to `http://localhost:3000`
3. Run the collection — each request includes test assertions

Test cases included:
- Valid city with overlapping hotels (delhi)
- Price-filtered results
- City with no results (atlantis)
- Missing city parameter (400 error)
- Supplier mock endpoints
- Health check
- Simulated supplier failure

## Design Decisions

### Deduplication
Hotel names are normalized to lowercase trimmed strings for comparison. The original casing is preserved in the response. When a hotel appears in both suppliers, the one with the lower price is selected.

### Redis Data Model
- **Sorted Set** (`hotels:<city>:index`): Members are hotel names, scores are prices. Enables O(log N) price-range queries via `ZRANGEBYSCORE`.
- **String keys** (`hotels:<city>:data:<name>`): Full hotel JSON objects with TTL matching the index.
- **TTL**: 5 minutes (300 seconds) — balances freshness vs performance.

### Temporal Retry Policy
- 3 maximum attempts with exponential backoff (1s initial, 2x coefficient, 10s max).
- If one supplier fails permanently after retries, the workflow proceeds with partial results from the other supplier rather than failing entirely.

### Price Filtering
Uses Redis sorted set range queries (`ZRANGEBYSCORE`) for efficient filtering. The cache-first approach checks Redis before triggering a new workflow execution, reducing redundant supplier calls.

## Known Limitations

- No pagination for large result sets
- No authentication/authorization on endpoints
- Mock suppliers use static data (no real external API calls)
- No workflow idempotency keys to prevent duplicate runs
- Single-city caching strategy (not multi-tenant)
