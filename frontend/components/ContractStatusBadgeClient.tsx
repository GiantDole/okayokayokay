'use client';

import { useEffect, useState } from 'react';
import ContractStatusBadge from './ContractStatusBadge';

interface ContractStatusBadgeClientProps {
  requestId: string;
  escrowContractAddress: string | null;
  initialStatusLabel?: string;
  initialHasStatus?: boolean;
}

export default function ContractStatusBadgeClient({
  requestId,
  escrowContractAddress,
  initialStatusLabel = 'Loading...',
  initialHasStatus = false,
}: ContractStatusBadgeClientProps) {
  const [statusLabel, setStatusLabel] = useState(initialStatusLabel);
  const [hasStatus, setHasStatus] = useState(initialHasStatus);
  const [loading, setLoading] = useState(!initialStatusLabel);
  const [buyerRefunded, setBuyerRefunded] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!escrowContractAddress) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `/api/contract-status?requestId=${requestId}&escrowAddress=${escrowContractAddress}`
        );
        const data = await res.json();
        
        setStatusLabel(data.statusLabel);
        setHasStatus(data.hasStatus);
        setBuyerRefunded(data.buyerRefunded);
        setLoading(false);
      } catch (error) {
        console.error('[ContractStatusBadgeClient] Error fetching status:', error);
      }
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [requestId, escrowContractAddress]);

  useEffect(() => {
    const handleStatusUpdate = ((event: CustomEvent) => {
      const { 
        requestId: eventRequestId, 
        statusLabel: newStatusLabel, 
        hasStatus: newHasStatus,
        buyerRefunded: newBuyerRefunded 
      } = event.detail;
      
      if (eventRequestId === requestId) {
        console.log('[ContractStatusBadgeClient] Received status update event:', event.detail);
        setStatusLabel(newStatusLabel);
        setHasStatus(newHasStatus);
        setBuyerRefunded(newBuyerRefunded);
        setLoading(false);
      }
    }) as EventListener;

    window.addEventListener('contract-status-update', handleStatusUpdate);

    return () => {
      window.removeEventListener('contract-status-update', handleStatusUpdate);
    };
  }, [requestId]);

  return (
    <ContractStatusBadge
      statusLabel={statusLabel}
      hasStatus={hasStatus}
      loading={loading}
      buyerRefunded={buyerRefunded}
    />
  );
}

