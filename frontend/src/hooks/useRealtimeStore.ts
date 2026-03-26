import { useEffect, useState } from 'react';
import { subscribeToTable, unsubscribeFromChannel } from '@/lib/supabase';

/**
 * Hook for real-time store updates
 * Subscribes to Tenant table changes and updates local state
 */
export function useRealtimeStore(tenantId: string | null) {
  const [storeData, setStoreData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    console.log('🔌 Setting up real-time subscription for tenant:', tenantId);
    setIsConnected(true);

    const channel = subscribeToTable(
      'Tenant',
      (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.id === tenantId) {
          console.log('✨ Store data updated in real-time:', payload.new);
          setStoreData(payload.new);
        }
      },
      { column: 'id', value: tenantId }
    );

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      if (channel) {
        unsubscribeFromChannel(channel);
      }
      setIsConnected(false);
    };
  }, [tenantId]);

  return { storeData, isConnected };
}
