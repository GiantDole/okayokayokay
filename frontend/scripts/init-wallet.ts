#!/usr/bin/env tsx
/**
 * Initialize Coinbase CDP Wallet for x402 Payments
 *
 * This script:
 * 1. Creates a new Coinbase CDP wallet (or loads existing)
 * 2. Displays the wallet address for funding
 * 3. Outputs the wallet ID to add to .env.local
 *
 * Run: npx tsx scripts/init-wallet.ts
 */

import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔧 Initializing Coinbase CDP Wallet...\n');

  const apiKeyName = process.env.COINBASE_API_KEY_NAME;
  const privateKey = process.env.COINBASE_API_PRIVATE_KEY;

  if (!apiKeyName || !privateKey) {
    console.error('❌ Error: Coinbase API credentials not found!');
    console.error('\nPlease set in .env.local:');
    console.error('  COINBASE_API_KEY_NAME=your-api-key-name');
    console.error('  COINBASE_API_PRIVATE_KEY=your-private-key');
    console.error('\nGet API keys from: https://portal.cdp.coinbase.com/');
    process.exit(1);
  }

  try {
    // Configure Coinbase SDK
    Coinbase.configure({
      apiKeyName,
      privateKey,
    });

    let wallet: Wallet;
    const existingWalletId = process.env.COINBASE_WALLET_ID;

    if (existingWalletId) {
      console.log('📂 Loading existing wallet:', existingWalletId);
      wallet = await Wallet.fetch(existingWalletId);
    } else {
      console.log('🆕 Creating new wallet on Base Mainnet...');
      const user = await Coinbase.defaultUser();
      wallet = await user.createWallet({
        networkId: Coinbase.networks.BaseMainnet,
      });
    }

    const address = await wallet.getDefaultAddress();
    const walletId = wallet.getId();

    console.log('\n✅ Wallet initialized successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Wallet Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Wallet ID:', walletId);
    console.log('Address:  ', address.getId());
    console.log('Network:  ', 'Base Mainnet (Chain ID: 8453)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!existingWalletId) {
      console.log('📝 Add this to your .env.local file:\n');
      console.log(`COINBASE_WALLET_ID=${walletId}\n`);
    }

    console.log('💰 Fund this wallet with USDC on Base:');
    console.log(`   Address: ${address.getId()}`);
    console.log('   Token:   USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)');
    console.log('   Network: Base Mainnet\n');

    // Try to get balance
    try {
      const balance = await wallet.getBalance(Coinbase.assets.Usdc);
      console.log('💵 Current USDC Balance:', balance.toString());
    } catch (e) {
      console.log('💵 Current USDC Balance: 0 (or unable to fetch)');
    }

    console.log('\n✨ Ready to process x402 payments!');
  } catch (error) {
    console.error('\n❌ Error initializing wallet:', error);
    process.exit(1);
  }
}

main();
