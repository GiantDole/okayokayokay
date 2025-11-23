#!/usr/bin/env npx tsx

/**
 * Find disputes that can be tested with the dispute agent
 * This queries Supabase for resource_requests that likely have disputes
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function findTestableDisputes() {
  log('\n🔍 Finding Testable Disputes', colors.bright + colors.magenta);
  log('=' .repeat(50));

  try {
    // 1. Find recent resource requests with both input and output data
    log('\n📊 Querying resource_requests table...', colors.cyan);

    const { data: requests, error } = await supabase
      .from('resource_requests')
      .select('*')
      .not('output_data', 'is', null)
      .not('escrow_contract_address', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    if (!requests || requests.length === 0) {
      log('\nNo resource requests found with complete data', colors.yellow);
      return;
    }

    log(`\nFound ${requests.length} resource requests with data:`, colors.green);

    // 2. Display each request
    requests.forEach((req, index) => {
      log(`\n${index + 1}. Request ID: ${colors.bright}${req.request_id}${colors.reset}`);
      log(`   Contract: ${req.escrow_contract_address || 'N/A'}`);
      log(`   User: ${req.user_address}`);
      log(`   Seller: ${req.seller_address}`);
      log(`   Status: ${req.status}`);
      log(`   Created: ${new Date(req.created_at).toLocaleString()}`);

      if (req.input_data) {
        log(`   Input: ${JSON.stringify(req.input_data).substring(0, 100)}...`);
      }

      if (req.output_data) {
        log(`   Output: ${JSON.stringify(req.output_data).substring(0, 100)}...`);
      }

      // Test command
      if (req.escrow_contract_address) {
        log(`\n   ${colors.cyan}Test command:${colors.reset}`);
        log(`   npx tsx scripts/test-dispute-agent.ts ${req.request_id} ${req.escrow_contract_address}`);
      }
    });

    // 3. Also check for any disputes in the disputes table
    log('\n\n📊 Checking disputes table...', colors.cyan);

    const { data: disputes, error: disputeError } = await supabase
      .from('disputes')
      .select(`
        *,
        transactions!inner(request_id)
      `)
      .order('filed_at', { ascending: false })
      .limit(5);

    if (disputeError) {
      log(`Error fetching disputes: ${disputeError.message}`, colors.yellow);
    } else if (disputes && disputes.length > 0) {
      log(`\nFound ${disputes.length} disputes in disputes table:`, colors.green);
      disputes.forEach((dispute, index) => {
        log(`\n${index + 1}. Dispute ID: ${dispute.id}`);
        log(`   Transaction Request ID: ${dispute.transactions?.request_id || 'N/A'}`);
        log(`   Filed by: ${dispute.filed_by}`);
        log(`   Filed at: ${new Date(dispute.filed_at).toLocaleString()}`);
        log(`   Escalated: ${dispute.escalated_at ? 'Yes' : 'No'}`);
      });
    } else {
      log('\nNo disputes found in disputes table', colors.yellow);
    }

  } catch (error) {
    log('\n❌ Error querying data:', colors.bright + colors.yellow);
    log(`${error}`, colors.yellow);
  }
}

// Main execution
async function main() {
  // Check environment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    log('Error: Missing Supabase configuration in .env.local', colors.bright + colors.yellow);
    log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  await findTestableDisputes();

  log('\n\n💡 Tips:', colors.bright + colors.blue);
  log('1. Use the test command shown above to test a specific dispute');
  log('2. Set SKIP_BLOCKCHAIN_CALLS=true in .env.local to test without on-chain execution');
  log('3. The agent needs a request with status "DisputeEscalated" to process it');
  log('4. Make sure the resource_requests entry has both input_data and output_data');
}

// Run the script
main().catch(error => {
  log(`\nFatal error: ${error}`, colors.bright + colors.yellow);
  process.exit(1);
});