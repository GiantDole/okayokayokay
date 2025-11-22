'use client';

import { useEffect, useState } from 'react';
import { getSessionId } from '@/lib/session';

interface ServerWalletData {
  walletAddress: string;
  balance: string;
  balanceFormatted: string;
  sessionId: string;
  createdAt: string;
}

export default function ServerWalletInfo() {
  const [walletData, setWalletData] = useState<ServerWalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWallet() {
      const sessionId = getSessionId();

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/server-wallet?sessionId=${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to load server wallet');
        }

        const data = await response.json();
        setWalletData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wallet');
      } finally {
        setLoading(false);
      }
    }

    loadWallet();

    // Refresh balance every 10 seconds
    const interval = setInterval(loadWallet, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !walletData) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <div className="text-sm text-blue-600">Loading server wallet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded">
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!walletData) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Wallet</h3>
          <p className="text-xs text-gray-500 mt-1">Managed server wallet for x402 payments</p>
        </div>
        {walletData.balanceFormatted === '0.00' && (
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
            Needs funding
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="bg-white p-3 rounded border border-blue-100">
          <div className="text-xs text-gray-500 mb-1">Balance (USDC on Base)</div>
          <div className="text-2xl font-bold text-gray-900">
            ${walletData.balanceFormatted}
          </div>
        </div>

        <div className="bg-white p-3 rounded border border-blue-100">
          <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
          <code className="text-xs font-mono text-gray-900 break-all">
            {walletData.walletAddress}
          </code>
        </div>
      </div>

      <button
        onClick={() => {
          navigator.clipboard.writeText(walletData.walletAddress);
          alert('Address copied! Send USDC on Base to this address to fund your payment wallet.');
        }}
        className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition font-medium"
      >
        Copy Address to Fund Wallet
      </button>

      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-gray-600">
          💡 This wallet automatically handles all x402 payments for you. No signing required!
        </p>
      </div>
    </div>
  );
}
