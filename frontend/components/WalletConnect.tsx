'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Auto-store wallet address in sessionStorage for API calls
  useEffect(() => {
    if (isConnected && address) {
      sessionStorage.setItem('wallet_address', address);
    } else {
      sessionStorage.removeItem('wallet_address');
    }
  }, [isConnected, address]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <div className="text-xs text-gray-500">Connected as</div>
          <div className="font-medium text-gray-900">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-medium"
        >
          Connect with {connector.name}
        </button>
      ))}
    </div>
  );
}
