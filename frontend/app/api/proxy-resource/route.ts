import { NextRequest, NextResponse } from 'next/server';
import {
  getResourceById,
  createResourceRequest,
} from '@/lib/queries/resources.server';
import { getOrCreateServerWallet } from '@/lib/server-wallet/manager';
import { makeX402Request } from '@/lib/x402/payment-handler';

/**
 * x402 Resource Proxy with Server Wallet
 *
 * POST /api/proxy-resource
 * Body: {
 *   resourceId: string,
 *   path: string,
 *   params?: Record<string, string>,
 *   sessionId: string (anonymous session ID)
 * }
 *
 * This endpoint uses the session's server wallet to make x402 payments automatically.
 */
export async function POST(req: NextRequest) {
  try {
    const { resourceId, path, params, sessionId } = await req.json();

    if (!resourceId || !path || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: resourceId, path, sessionId' },
        { status: 400 }
      );
    }

    // Get or create server wallet for this session
    const serverWallet = await getOrCreateServerWallet(sessionId);

    // Get resource details
    const { data: resource, error: resourceError } = await getResourceById(resourceId);

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Build URL
    const url = new URL(path, resource.base_url);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    console.log(`[Proxy] Making x402 request to ${url.toString()}`);
    console.log(`[Proxy] Using server wallet: ${serverWallet.wallet_address}`);

    // Make x402 request using private key
    const result = await makeX402Request(url.toString(), serverWallet.private_key);

    if (!result.success) {
      console.error(`[Proxy] Request failed:`, result.error);

      // Log the failed request
      await createResourceRequest({
        resource_id: resourceId,
        user_address: sessionId, // Using session ID as user identifier
        request_path: path,
        request_params: params || null,
        request_headers: null,
        response_data: null,
        response_status: 500,
        tx_hash: null,
        payment_amount: null,
        payment_to_address: null,
        nonce: null,
        status: 'failed',
        error_message: result.error || 'Unknown error',
      });

      return NextResponse.json(
        { error: result.error || 'Request failed' },
        { status: 500 }
      );
    }

    console.log(`[Proxy] Request successful`);
    if (result.paymentDetails) {
      console.log(`[Proxy] Payment made: ${result.paymentDetails.amount} to ${result.paymentDetails.to}`);
      console.log(`[Proxy] Transaction: ${result.paymentDetails.txHash}`);
    }

    // Log the successful request
    await createResourceRequest({
      resource_id: resourceId,
      user_address: sessionId, // Using session ID as user identifier
      request_path: path,
      request_params: params || null,
      request_headers: null,
      response_data: result.data,
      response_status: 200,
      tx_hash: result.paymentDetails?.txHash || null,
      payment_amount: result.paymentDetails?.amount || null,
      payment_to_address: result.paymentDetails?.to || null,
      nonce: null,
      status: 'completed',
      error_message: null,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      paymentDetails: result.paymentDetails,
      serverWallet: serverWallet.wallet_address,
    });
  } catch (err) {
    console.error('Error in proxy-resource API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

