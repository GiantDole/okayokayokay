/**
 * Script to approve the Warm Storage operator for Synapse
 * This is required before uploading data to Filecoin
 *
 * Run with: node scripts/approve-synapse-operator.mjs
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

// Known Warm Storage operator address on Calibration testnet
const WARM_STORAGE_OPERATOR = '0x02925630df557F957f70E112bA06e50965417CA0';

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
  console.log('Warm Storage Operator:', WARM_STORAGE_OPERATOR);
  console.log('');

  // Check current approval status
  console.log('=== Checking Current Approval Status ===');
  try {
    const approval = await synapse.payments.serviceApproval(WARM_STORAGE_OPERATOR);
    console.log('Current approval:', JSON.stringify(approval, (k, v) =>
      typeof v === 'bigint' ? v.toString() : v, 2));

    if (approval.isApproved) {
      console.log('\nOperator is already approved:');
      console.log(`  Rate allowance: ${Number(approval.rateAllowance) / 1e18} USDFC`);
      console.log(`  Lockup allowance: ${Number(approval.lockupAllowance) / 1e18} USDFC`);
      console.log(`  Max lockup period: ${approval.maxLockupPeriod} epochs`);

      // Check if we need to update the approval (lockup period too low)
      if (BigInt(approval.maxLockupPeriod) < BigInt('86400')) {
        console.log('\n⚠️  Max lockup period is insufficient (need >= 86400 epochs)');
        console.log('Will re-approve with higher values...');
      } else {
        console.log('\n✅ Approval parameters are sufficient!');
        return;
      }
    }
  } catch (error) {
    console.log('Could not check approval status:', error.message);
  }

  console.log('');
  console.log('=== Approving Warm Storage Operator ===');

  // Approval parameters
  // Rate allowance: max rate the operator can charge per epoch (30 seconds)
  const rateAllowance = BigInt('100000000000000000'); // 0.1 USDFC per epoch
  // Lockup allowance: max amount that can be locked up
  const lockupAllowance = BigInt('10000000000000000000'); // 10 USDFC (increased)
  // Max lockup period: max number of epochs funds can be locked
  // The storage service requires 86400 epochs minimum
  const maxLockupPeriod = BigInt('100000'); // ~35 days (100000 * 30s)

  console.log('Approval parameters:');
  console.log(`  Rate allowance: ${Number(rateAllowance) / 1e18} USDFC per epoch`);
  console.log(`  Lockup allowance: ${Number(lockupAllowance) / 1e18} USDFC`);
  console.log(`  Max lockup period: ${maxLockupPeriod} epochs (~35 days)`);
  console.log('');

  try {
    console.log('Sending approval transaction...');
    const tx = await synapse.payments.approveService(
      WARM_STORAGE_OPERATOR,
      rateAllowance,
      lockupAllowance,
      maxLockupPeriod,
      'USDFC'
    );

    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    console.log('');

    // Verify approval
    const newApproval = await synapse.payments.serviceApproval(WARM_STORAGE_OPERATOR);
    console.log('=== Approval Verified ===');
    console.log('Is approved:', newApproval.isApproved);
    console.log(`Rate allowance: ${Number(newApproval.rateAllowance) / 1e18} USDFC`);
    console.log(`Lockup allowance: ${Number(newApproval.lockupAllowance) / 1e18} USDFC`);

  } catch (error) {
    console.error('Approval failed:', error);
    process.exit(1);
  }

  console.log('');
  console.log('=== Setup Complete ===');
  console.log('You can now upload data to Filecoin via Synapse!');
}

main().catch(console.error);
