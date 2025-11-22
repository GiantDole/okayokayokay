'use client';

import { useAccount, useReadContract } from 'wagmi';
import { useEffect, useState } from 'react';
import { base } from 'wagmi/chains';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
] as const;

export default function UsdcBalance() {
  const { address, isConnected } = useAccount();
  const [formattedBalance, setFormattedBalance] = useState<string>('0.00');

  const { data: balance, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: !!address && isConnected,
    },
  });

  useEffect(() => {
    if (balance !== undefined) {
      // USDC has 6 decimals
      const balanceNum = Number(balance) / 1_000_000;
      setFormattedBalance(balanceNum.toFixed(2));
    }
  }, [balance]);

  // Refresh balance every 10 seconds
  useEffect(() => {
    if (isConnected && address) {
      const interval = setInterval(() => {
        refetch();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, refetch]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-600">USDC:</span>
      <span className="font-medium text-gray-900">{formattedBalance}</span>
    </div>
  );
}
