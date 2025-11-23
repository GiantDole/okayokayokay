/**
 * Script to deposit USDFC into Synapse Payments contract
 * This is required before uploading data to Filecoin
 *
 * Run with: node scripts/fund-synapse-payments.mjs
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Synapse } from '@filoz/synapse-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const FILECOIN_PRIVATE_KEY = process.env.FILECOIN_PRIVATE_KEY;
const FILECOIN_RPC_URL = process.env.FILECOIN_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';

// Amount to deposit (in USDFC - 18 decimals on Filecoin)
const DEPOSIT_AMOUNT = BigInt('1000000000000000000'); // 1 USDFC

async function main() {
  if (!FILECOIN_PRIVATE_KEY) {
    console.error('FILECOIN_PRIVATE_KEY not set in .env.local');
    process.exit(1);
  }

  console.log('Initializing Synapse SDK on Calibration testnet...\n');

  const synapse = await Synapse.create({
    privateKey: FILECOIN_PRIVATE_KEY,
    rpcURL: FILECOIN_RPC_URL,
  });

  const signer = synapse.getSigner();
  const walletAddress = await signer.getAddress();

  console.log('Wallet Address:', walletAddress);
  console.log('');

  // Check current balances
  console.log('=== Current Balances ===');

  const walletUsdfc = await synapse.payments.walletBalance('USDFC');
  console.log(`Wallet USDFC Balance: ${walletUsdfc.toString()} (raw)`);
  console.log(`Wallet USDFC Balance: ${Number(walletUsdfc) / 1e18} USDFC`);

  const paymentsBalance = await synapse.payments.balance();
  console.log(`Payments Contract Balance: ${paymentsBalance.toString()} (raw)`);
  console.log(`Payments Contract Balance: ${Number(paymentsBalance) / 1e18} USDFC`);

  console.log('');

  // Check if we need to deposit
  if (paymentsBalance >= DEPOSIT_AMOUNT) {
    console.log('Payments contract already has sufficient funds. No deposit needed.');
    return;
  }

  if (walletUsdfc < DEPOSIT_AMOUNT) {
    console.error(`Insufficient USDFC in wallet. Need at least ${Number(DEPOSIT_AMOUNT) / 1e18} USDFC`);
    console.error('Get testnet USDFC from the Synapse faucet or testnet sources.');
    process.exit(1);
  }

  // Deposit USDFC into payments contract
  console.log(`=== Depositing ${Number(DEPOSIT_AMOUNT) / 1e18} USDFC ===`);
  console.log('This will also approve the operator if needed...');
  console.log('');

  try {
    // The deposit function handles approval automatically
    // Signature: deposit(amount, token, options)
    const result = await synapse.payments.deposit(DEPOSIT_AMOUNT, 'USDFC', {
      onAllowanceCheck: (current, needed) => {
        console.log(`Checking current allowance: ${current} (need ${needed})...`);
      },
      onApprovalTransaction: (tx) => {
        console.log(`Approval transaction sent: ${tx.hash}`);
      },
      onApprovalConfirmed: () => {
        console.log('Approval confirmed!');
      },
      onDepositStarting: () => {
        console.log('Starting deposit transaction...');
      },
    });

    console.log('');
    console.log('Deposit successful!');
    console.log('Transaction:', result);

    // Check new balance
    const newBalance = await synapse.payments.balance();
    console.log('');
    console.log(`New Payments Contract Balance: ${Number(newBalance) / 1e18} USDFC`);

  } catch (error) {
    console.error('Deposit failed:', error);
    process.exit(1);
  }

  // Now approve the Warm Storage service operator
  console.log('');
  console.log('=== Approving Warm Storage Operator ===');

  try {
    // Get storage info to find the warm storage address
    const storageInfo = await synapse.storage.getStorageInfo();
    console.log('Warm Storage Address:', storageInfo.warmStorageAddress);

    // Approve the operator with a rate allowance
    // Rate is in USDFC per epoch (30 seconds on Filecoin)
    const rateAllowance = BigInt('100000000000000000'); // 0.1 USDFC per epoch
    const lockupAllowance = BigInt('1000000000000000000'); // 1 USDFC lockup

    console.log('Approving operator...');
    await synapse.payments.approveService(
      storageInfo.warmStorageAddress,
      rateAllowance,
      lockupAllowance
    );

    console.log('Operator approved successfully!');
  } catch (error) {
    // May already be approved
    console.log('Operator approval:', error instanceof Error ? error.message : error);
  }

  console.log('');
  console.log('=== Setup Complete ===');
  console.log('You can now upload data to Filecoin via Synapse!');
}

main().catch(console.error);
