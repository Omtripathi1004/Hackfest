// src/hooks/useSupabaseSnapshot.ts
// -----------------------------------------------
// This hook fetches all crops + mandis + 7d price
// history from Supabase and converts it into the
// exact same FALLBACK_SNAPSHOT shape that the app
// already uses — so NO other component needs to change.
// -----------------------------------------------

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FALLBACK_SNAPSHOT } from '../data/fallbackSnapshot';
import type { CropSnapshot } from '../data/fallbackSnapshot';

interface UseSupabaseSnapshotResult {
  data: Record<string, CropSnapshot>;
  loading: boolean;
  error: string | null;
  isLive: boolean; // true = from Supabase, false = using fallback
}

export function useSupabaseSnapshot(): UseSupabaseSnapshotResult {
  const [data, setData] = useState<Record<string, CropSnapshot>>(FALLBACK_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchFromSupabase() {
      try {
        if (!supabase) {
          throw new Error('Supabase client is not configured (check VITE_SUPABASE_URL in .env)');
        }

        // 1. Fetch all crops
        const { data: crops, error: cropsError } = await supabase
          .from('crops')
          .select('*');

        if (cropsError) throw cropsError;
        if (!crops || crops.length === 0) throw new Error('No crops in Supabase');

        // 2. Fetch all mandis
        const { data: mandis, error: mandisError } = await supabase
          .from('mandis')
          .select('*');

        if (mandisError) throw mandisError;

        // 3. Fetch all price history
        const { data: history, error: historyError } = await supabase
          .from('mandi_price_history')
          .select('*')
          .order('day_index', { ascending: true });

        if (historyError) throw historyError;

        // 4. Build history map: { mandi_id -> [price0, price1, ... price6] }
        const historyMap: Record<string, (number | null)[]> = {};
        (history || []).forEach((h) => {
          if (!historyMap[h.mandi_id]) {
            historyMap[h.mandi_id] = [null, null, null, null, null, null, null];
          }
          historyMap[h.mandi_id][h.day_index] = h.price;
        });

        // 5. Build the snapshot in the exact CropSnapshot shape
        const snapshot: Record<string, CropSnapshot> = {};

        crops.forEach((crop) => {
          const cropMandis = (mandis || [])
            .filter((m) => m.crop_id === crop.id)
            .map((m) => ({
              id: m.id,
              name: m.name,
              nameHi: m.name_hi,
              district: m.district,
              stateCode: m.state_code,
              distanceKm: m.distance_km,
              todayModal: m.today_modal,
              prevModal: m.prev_modal,
              lastReportedDate: m.last_reported_date,
              arrivalsTonnes: Number(m.arrivals_tonnes),
              history7d: historyMap[m.id] ?? [null, null, null, null, null, null, null],
              lat: Number(m.lat),
              lng: Number(m.lng),
            }));

          snapshot[crop.id] = {
            id: crop.id,
            name: crop.name,
            nameHi: crop.name_hi,
            unit: crop.unit,
            seasonalOctAvg: crop.seasonal_oct_avg,
            msp: crop.msp,
            mandis: cropMandis,
          };
        });

        setData(snapshot);
        setIsLive(true);
        setError(null);
        console.log('[BazarSetu] ✅ Loaded live data from Supabase');
      } catch (err: any) {
        console.warn('[BazarSetu] Supabase fetch failed, using fallback data:', err.message);
        setData(FALLBACK_SNAPSHOT);
        setIsLive(false);
        setError(err.message || 'Failed to load from Supabase');
      } finally {
        setLoading(false);
      }
    }

    fetchFromSupabase();
  }, []);

  return { data, loading, error, isLive };
}
