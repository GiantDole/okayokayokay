import { getAllEvents } from '@/lib/queries/alchemy-events.server';

export default async function EventsPage() {
  const { data: events, error } = await getAllEvents(50);

  if (error) {
    return <div>Error loading events: {error.message}</div>;
  }

  if (!events || events.length === 0) {
    return <div className="p-8">No events found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Transfer Authorization Events</h1>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Block:</span> {event.block_number}
              </div>
              <div>
                <span className="font-semibold">Amount:</span> {event.amount}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">From:</span>{' '}
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {event.from_address}
                </code>
              </div>
              <div className="col-span-2">
                <span className="font-semibold">To:</span>{' '}
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {event.to_address}
                </code>
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Authorizer:</span>{' '}
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {event.authorizer}
                </code>
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Nonce:</span>{' '}
                <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                  {event.nonce}
                </code>
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Tx Hash:</span>{' '}
                <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                  {event.tx_hash}
                </code>
              </div>
              <div className="col-span-2 text-gray-500 text-xs">
                {new Date(event.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
