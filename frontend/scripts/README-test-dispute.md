# Dispute Agent Test Script

This script allows you to test your local dispute agent by simulating a `DisputeEscalated` event.

## Quick Start

```bash
# Basic usage - provide contract address and request ID
yarn test:dispute --contract 0x123... --requestId 0x456...

# Or use yarn tsx directly
yarn tsx scripts/test-dispute-agent.ts -c 0x123... -r 0x456...
```

## Prerequisites

1. **Next.js server must be running**:
   ```bash
   yarn dev
   ```

2. **Environment variables configured** in `.env.local`:
   - `WEBHOOK_SECRET` - For webhook authentication
   - `OPENAI_API_KEY` - For LLM decisions
   - `AGENT_PRIVATE_KEY` - For on-chain resolution
   - `SUPABASE_*` - For fetching request data

3. **Data in Supabase**:
   - The `request_id` must exist in the `resource_requests` table
   - Must have `input_data` and `output_data` fields populated

## Usage Examples

### 1. Test with Real Contract and Request ID
```bash
yarn test:dispute \
  --contract 0xYourDisputeEscrowContract \
  --requestId 0xYourRequestId
```

### 2. Dry Run (show payload without sending)
```bash
yarn test:dispute \
  --contract 0xYourContract \
  --requestId 0xYourRequestId \
  --dryRun
```

### 3. Test with Custom Parameters
```bash
yarn test:dispute \
  --contract 0xYourContract \
  --requestId 0xYourRequestId \
  --txHash 0xYourTransactionHash \
  --blockNumber 2000000 \
  --network base-sepolia
```

### 4. View Help
```bash
yarn test:dispute --help
```

## What Happens

1. **Script creates webhook payload** with your parameters
2. **Sends POST request** to `http://localhost:3000/api/dispute-webhook`
3. **Agent processes the dispute**:
   - Validates the event
   - Fetches request details from blockchain
   - Queries Supabase for input/output data
   - Makes LLM decision
   - Executes on-chain resolution (if not in test mode)
4. **Returns decision** with refund status and reason

## Expected Response

### Success:
```json
{
  "success": true,
  "requestId": "0x...",
  "decision": {
    "refund": true,
    "reason": "Service output doesn't match requested input"
  },
  "transactionHash": "0x..."
}
```

### Error:
```json
{
  "success": false,
  "error": "Resource request data not found",
  "message": "Details about the error"
}
```

## Troubleshooting

- **"ECONNREFUSED"**: Make sure `yarn dev` is running
- **"Resource request data not found"**: Check that the request_id exists in Supabase
- **"Request not in escalated state"**: The on-chain request must have status = 5 (DisputeEscalated)
- **"Agent does not have DISPUTE_AGENT_ROLE"**: Check that your agent wallet has the role in the factory contract

## Test Mode

To skip actual blockchain calls, set in `.env.local`:
```
SKIP_BLOCKCHAIN_CALLS=true
```

This will return a mock transaction hash instead of executing on-chain.