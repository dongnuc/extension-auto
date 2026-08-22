import { createClient } from '@supabase/supabase-js';
import { extensionSupabaseFetch } from './extension-fetch';

const CENTRAL_SUPABASE_URL = 'https://zfobbtitwwejzqmqgcmi.supabase.co';
const CENTRAL_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kosWaUX7OfuvV2xVp2zcfw_uRX9IzO3';

export const centralSupabase = createClient(CENTRAL_SUPABASE_URL, CENTRAL_SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: extensionSupabaseFetch,
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'gemAutoFlow.centralSupabase.auth',
  },
});
