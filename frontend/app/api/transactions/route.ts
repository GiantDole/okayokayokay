import { NextRequest, NextResponse } from 'next/server';
import {
  getTransactionsByBuyer,
  getBuyerUnresolvedTransactions,
  getResourceRequestsByUser
} from '@/lib/queries/transactions.server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Fetch transactions (from dispute escrow), unresolved, and resource requests (x402 calls)
    const [transactionsResult, unresolvedResult, resourceRequestsResult] = await Promise.all([
      getTransactionsByBuyer(address, 100),
      getBuyerUnresolvedTransactions(address, 50),
      getResourceRequestsByUser(address, 100),
    ]);

    if (transactionsResult.error) {
      return NextResponse.json(
        { error: transactionsResult.error.message },
        { status: 500 }
      );
    }

    if (unresolvedResult.error) {
      return NextResponse.json(
        { error: unresolvedResult.error.message },
        { status: 500 }
      );
    }

    if (resourceRequestsResult.error) {
      return NextResponse.json(
        { error: resourceRequestsResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions: transactionsResult.data || [],
      unresolved: unresolvedResult.data || [],
      resourceRequests: resourceRequestsResult.data || [],
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
