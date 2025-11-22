# okayokayokay

Dispute resolution platform for x402 payments with multi-layer arbitration.

## Overview

A decentralized escrow and dispute resolution system for x402 (HTTP 402 Payment Required) transactions. Service providers register and receive individual escrow contracts that handle payment settlement, dispute management, and fund distribution.

## Workflow

1. **Service Registration**: Service providers register through the factory contract, deploying a dedicated escrow contract
2. **Payment Flow**:
   - Buyer makes x402 payment through facilitator
   - Funds are transferred to the service's escrow contract
   - Operator confirms the transaction with API response hash
3. **Dispute Resolution**:
   - **Layer 1**: Direct resolution between buyer and seller (10-minute window)
   - **Layer 2**: Centralized dispute agent arbitration (2-day escalation window)
   - **Layer 3**: (Future) Decentralized jury/Kleros integration

## Architecture

- **Frontend**: Next.js customer/merchant dashboard
- **Smart Contracts**: Factory pattern with per-service escrow contracts
- **Backend**: Alchemy webhooks for blockchain event tracking
- **Database**: Supabase for transaction and dispute data

## Development

```bash
yarn install       # Install dependencies
yarn dev          # Run frontend
forge build       # Build contracts
