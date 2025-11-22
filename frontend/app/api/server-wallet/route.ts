import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateServerWallet, getServerWallet } from '@/lib/server-wallet/manager';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

/**
 * GET /api/server-wallet?sessionId=...
 * Get or create server wallet for a session and return wallet info + balance
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId parameter is required' },
        { status: 400 }
      );
    }

    // Get or create wallet for this session
    const wallet = await getOrCreateServerWallet(sessionId);

    // Get USDC balance on Base
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function',
        },
      ],
      functionName: 'balanceOf',
      args: [wallet.wallet_address as `0x${string}`],
    });

    return NextResponse.json({
      walletAddress: wallet.wallet_address,
      balance: balance.toString(),
      balanceFormatted: formatUnits(balance as bigint, 6), // USDC has 6 decimals
      sessionId: wallet.session_id,
      createdAt: wallet.created_at,
    });
  } catch (err) {
    console.error('Error in server-wallet API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
