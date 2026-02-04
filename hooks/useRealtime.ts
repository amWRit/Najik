'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useRealtimeSubscription<T extends { id: string }>(
  table: string,
  filter?: { column: string; value: any }
): RealtimeSubscription<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // Initial fetch
        let query = supabase.from(table).select('*');
        
        if (filter) {
          query = query.eq(filter.column, filter.value);
        }

        const { data: initialData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setData((initialData as T[]) || []);
        setLoading(false);

        // Set up realtime subscription
        channel = supabase
          .channel(`${table}-changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setData((current) => [...current, payload.new as T]);
              } else if (payload.eventType === 'UPDATE') {
                setData((current) =>
                  current.map((item) =>
                    item.id === (payload.new as T).id ? (payload.new as T) : item
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setData((current) =>
                  current.filter((item) => item.id !== (payload.old as T).id)
                );
              }
            }
          )
          .subscribe();
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, filter?.column, filter?.value]);

  return { data, loading, error };
}

export function useRealtimeSingle<T extends { id: string }>(
  table: string,
  id: string
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // Initial fetch
        const { data: initialData, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        setData(initialData as T);
        setLoading(false);

        // Set up realtime subscription
        channel = supabase
          .channel(`${table}-${id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: table,
              filter: `id=eq.${id}`,
            },
            (payload) => {
              setData(payload.new as T);
            }
          )
          .subscribe();
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, id]);

  return { data, loading, error };
}
