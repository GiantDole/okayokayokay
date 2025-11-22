import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

export interface X402PaymentResult {
  success: boolean;
  data?: any;
  error?: string;
  paymentDetails?: {
    txHash: string;
    amount: string;
    to: string;
  };
}

/**
 * Make an x402 request using a private key
 */
export async function makeX402Request(
  url: string,
  privateKey: string,
  options?: RequestInit
): Promise<X402PaymentResult> {
  try {
    // Create viem wallet client from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const viemWalletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    console.log(`[x402] Making request to ${url} with wallet ${account.address}`);

    // Wrap fetch with x402 payment capability
    const x402Fetch = wrapFetchWithPayment(fetch, { walletClient: viemWalletClient });

    // Make the request - x402-fetch handles 402 responses automatically
    const response = await x402Fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[x402] Request failed: ${response.status} ${errorText}`);
      return {
        success: false,
        error: `Request failed with status ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log('[x402] Request successful');

    // Extract payment details if available from response headers
    const paymentTxHash = response.headers.get('x-payment-tx');
    const paymentAmount = response.headers.get('x-payment-amount');
    const paymentTo = response.headers.get('x-payment-to');

    return {
      success: true,
      data,
      paymentDetails:
        paymentTxHash && paymentAmount && paymentTo
          ? {
              txHash: paymentTxHash,
              amount: paymentAmount,
              to: paymentTo,
            }
          : undefined,
    };
  } catch (err) {
    console.error('[x402] Payment handler error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}
