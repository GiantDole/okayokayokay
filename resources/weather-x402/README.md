# x402 Weather Resource

A paid API endpoint that returns weather data for a given location and date. Requires payment of $0.01 USDC on Base mainnet.

**Working with x402-express!** Uses npm overrides to fix Solana dependency conflicts.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
ADDRESS=0x... # Your Base wallet address to receive payments
```

3. Run locally:
```bash
npm run dev
```

Server runs on `http://localhost:4021`

## Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Set environment variable:
```bash
vercel env add ADDRESS
# Enter your Base wallet address (0x...)
```

3. Deploy:
```bash
npm run deploy
```

Or use the Vercel dashboard:
1. Import your Git repository
2. Set `ADDRESS` environment variable in Settings → Environment Variables
3. Deploy

Your API will be available at: `https://your-project.vercel.app`

## Endpoints

### GET /.well-known/x402

Returns x402 protocol metadata with endpoint descriptions. This allows agents and users to discover your API capabilities.

### GET /weather

**Parameters:**
- `location` (required) - City or location name
- `date` (required) - Date in YYYY-MM-DD format

**Price:** $0.001 USDC (0.1 cent) on Base mainnet

**Example (local):**
```bash
curl "http://localhost:4021/weather?location=San%20Francisco&date=2025-11-21"
```

**Example (production):**
```bash
curl "https://your-project.vercel.app/weather?location=San%20Francisco&date=2025-11-21"
```

**Response (with verification):**
```json
{
  "data": {
    "location": "San Francisco",
    "date": "2025-11-21",
    "conditions": "sunny",
    "temperature": 72,
    "temperatureUnit": "F",
    "humidity": 65,
    "windSpeed": 12,
    "windSpeedUnit": "mph"
  },
  "dataHash": "a3f5e8c9d2b1...",
  "signature": "0x123abc...",
  "merchantPublicKey": "0x456def..."
}
```

**Note:**
- 50% of requests will return faulty data (NaN values, errors, or corrupted data)
- Valid responses include cryptographic verification (hash + signature)
- Use `merchantPublicKey` to verify the `signature` of the `dataHash`
