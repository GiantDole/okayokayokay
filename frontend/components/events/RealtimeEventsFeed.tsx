'use client';

import { useEffect, useState } from 'react';
import { subscribeToNewEvents } from '@/lib/queries/alchemy-events';
import { supabase } from '@/lib/supabase/client';

type AlchemyEvent = {
  id: number;
  type: string | null;
  network: string | null;
  tx_hash: string | null;
  block_number: number | null;
  authorizer: string | null;
  nonce: string | null;
  from_address: string | null;
  to_address: string | null;
  amount: string | null;
  raw_payload: any;
  created_at: string;
};

export function RealtimeEventsFeed() {
  const [events, setEvents] = useState<AlchemyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial events using client directly
    supabase
      .from('alchemy_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          setEvents(data as AlchemyEvent[]);
        }
        setLoading(false);
      });

    // Subscribe to new events
    const unsubscribe = subscribeToNewEvents((newEvent) => {
      console.log('New event received:', newEvent);
      setEvents((prev) => [newEvent, ...prev]);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="p-8">Loading events...</div>;
  }

  if (events.length === 0) {
    return <div className="p-8">No events yet. Waiting for transfers...</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">
        Live Transfer Events ({events.length})
      </h2>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="border rounded p-3 bg-white shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-mono text-sm">
                {event.from_address?.slice(0, 10)}... → {event.to_address?.slice(0, 10)}...
              </div>
              <div className="text-sm font-semibold">{event.amount}</div>
            </div>
            <div className="text-xs text-gray-500">
              Block {event.block_number} • {new Date(event.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
