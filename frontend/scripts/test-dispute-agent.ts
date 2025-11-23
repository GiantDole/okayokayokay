#!/usr/bin/env node

/**
 * Test script to trigger the dispute agent locally
 *
 * Usage:
 * yarn tsx scripts/test-dispute-agent.ts --contract 0x... --requestId 0x... [options]
 *
 * Or with npm:
 * npx tsx scripts/test-dispute-agent.ts --contract 0x... --requestId 0x...
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { parseArgs } from 'util';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.blue);
  console.log('='.repeat(60));
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    contract: {
      type: 'string',
      short: 'c',
    },
    requestId: {
      type: 'string',
      short: 'r',
    },
    txHash: {
      type: 'string',
      short: 't',
      default: '0x' + '1'.repeat(64), // Mock transaction hash
    },
    blockNumber: {
      type: 'string',
      short: 'b',
      default: '1000000', // Mock block number
    },
    network: {
      type: 'string',
      short: 'n',
      default: 'base-mainnet',
    },
    endpoint: {
      type: 'string',
      short: 'e',
      default: 'http://localhost:3000/api/dispute-webhook',
    },
    dryRun: {
      type: 'boolean',
      short: 'd',
      default: false,
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false,
    },
  },
});

// Show help
if (values.help || !values.contract || !values.requestId) {
  log(`
Dispute Agent Test Script
========================

This script triggers your local dispute agent with a DisputeEscalated event.

USAGE:
  yarn tsx scripts/test-dispute-agent.ts --contract <address> --requestId <bytes32> [options]

REQUIRED:
  -c, --contract <address>    DisputeEscrow contract address
  -r, --requestId <bytes32>   Request ID (32-byte hex string)

OPTIONS:
  -t, --txHash <hash>         Transaction hash (default: mock)
  -b, --blockNumber <number>  Block number (default: 1000000)
  -n, --network <name>        Network name (default: base-mainnet)
  -e, --endpoint <url>        Agent endpoint (default: http://localhost:3000/api/dispute-webhook)
  -d, --dryRun                Show payload without sending
  -h, --help                  Show this help message

EXAMPLES:
  # Basic test with contract and request ID
  yarn tsx scripts/test-dispute-agent.ts \\
    --contract 0x123...abc \\
    --requestId 0x456...def

  # Test with custom network and dry run
  yarn tsx scripts/test-dispute-agent.ts \\
    -c 0x123...abc \\
    -r 0x456...def \\
    -n base-sepolia \\
    --dryRun

  # Test with all parameters
  yarn tsx scripts/test-dispute-agent.ts \\
    --contract 0x123...abc \\
    --requestId 0x456...def \\
    --txHash 0x789...ghi \\
    --blockNumber 2000000 \\
    --network base-mainnet
`, colors.cyan);
  process.exit(values.help ? 0 : 1);
}

// Validate inputs
function validateInputs() {
  // Validate contract address
  if (!ethers.isAddress(values.contract)) {
    log(`Error: Invalid contract address: ${values.contract}`, colors.red);
    process.exit(1);
  }

  // Validate request ID (should be 32 bytes hex)
  const requestIdRegex = /^0x[a-fA-F0-9]{64}$/;
  if (!requestIdRegex.test(values.requestId!)) {
    log(`Error: Invalid request ID format. Expected 32-byte hex (0x + 64 chars)`, colors.red);
    log(`Received: ${values.requestId}`, colors.red);
    process.exit(1);
  }

  // Validate transaction hash if provided
  if (values.txHash && !requestIdRegex.test(values.txHash)) {
    log(`Error: Invalid transaction hash format`, colors.red);
    process.exit(1);
  }
}

// Main test function
async function testDisputeAgent() {
  logSection('Dispute Agent Test Script');

  // Validate inputs
  validateInputs();

  // Prepare webhook payload
  const webhookPayload = {
    event: 'DisputeEscalated',
    contractAddress: values.contract,
    transactionHash: values.txHash,
    blockNumber: parseInt(values.blockNumber!),
    timestamp: Math.floor(Date.now() / 1000),
    args: {
      requestId: values.requestId,
    },
    network: values.network,
  };

  // Display test parameters
  log('\nTest Parameters:', colors.bright);
  log(`  Contract Address: ${values.contract}`, colors.cyan);
  log(`  Request ID: ${values.requestId}`, colors.cyan);
  log(`  Network: ${values.network}`, colors.cyan);
  log(`  Endpoint: ${values.endpoint}`, colors.cyan);
  log(`  Webhook Secret: ${process.env.WEBHOOK_SECRET ? 'Configured' : 'Not configured'}`, colors.cyan);

  // Display payload
  logSection('Webhook Payload');
  console.log(JSON.stringify(webhookPayload, null, 2));

  // Dry run mode - just show the payload
  if (values.dryRun) {
    log('\n✅ Dry run complete - payload shown above', colors.green);
    log('Remove --dryRun flag to actually send the webhook', colors.yellow);
    return;
  }

  // Send webhook to agent
  logSection('Sending Webhook to Agent');
  log(`Sending POST request to ${values.endpoint}...`, colors.cyan);

  try {
    const response = await fetch(values.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': process.env.WEBHOOK_SECRET || 'test-webhook-secret-123',
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseData = await response.json();

    // Display response
    logSection('Agent Response');
    log(`Status: ${response.status} ${response.statusText}`,
        response.ok ? colors.green : colors.red);

    console.log('\nResponse Body:');
    console.log(JSON.stringify(responseData, null, 2));

    // Interpret the response
    if (responseData.success) {
      logSection('✅ Dispute Resolution Complete');
      if (responseData.decision) {
        log(`Decision: ${responseData.decision.refund ? 'REFUND BUYER' : 'PAY SELLER'}`,
            responseData.decision.refund ? colors.cyan : colors.yellow);
        log(`Reason: ${responseData.decision.reason}`, colors.reset);
      }
      if (responseData.transactionHash) {
        log(`Transaction Hash: ${responseData.transactionHash}`, colors.green);

        // Check if it's a mock transaction
        if (responseData.transactionHash === '0x' + '0'.repeat(64)) {
          log(`(This is a mock transaction - blockchain calls may be disabled)`, colors.yellow);
        }
      }
    } else {
      logSection('❌ Dispute Resolution Failed');
      log(`Error: ${responseData.error || 'Unknown error'}`, colors.red);
      if (responseData.message) {
        log(`Message: ${responseData.message}`, colors.red);
      }
    }

  } catch (error) {
    logSection('❌ Request Failed');
    log(`Error: ${error}`, colors.red);

    // Common error handling
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        log('\nMake sure your Next.js development server is running:', colors.yellow);
        log('  yarn dev', colors.cyan);
      } else if (error.message.includes('fetch')) {
        log('\nNetwork error - check if the endpoint is accessible', colors.yellow);
      }
    }

    process.exit(1);
  }
}

// Run the test
testDisputeAgent().catch(error => {
  log(`\nFatal error: ${error}`, colors.bright + colors.red);
  process.exit(1);
});