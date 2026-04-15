import { createClient } from '@supabase/supabase-js';

// Robust environment variable loading
const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL').replace(/[\n\r\s]/g, '');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY').replace(/[\n\r\s]/g, '');

// Mock object to prevent crashes if credentials are missing or invalid
const mockSupabase = {
  auth: {
    // Supabase v2 uses onAuthStateChange (not onAuthStateChanged)
    onAuthStateChange: (callback) => {
      console.warn('Using mock onAuthStateChange. Auth will not work.');
      return { data: { subscription: { unsubscribe: () => { } } } };
    },
    signInWithPassword: () => Promise.reject(new Error('Supabase não configurado')),
    signUp: () => Promise.reject(new Error('Supabase não configurado')),
    signOut: () => Promise.resolve(),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null })
      }),
      order: () => Promise.resolve({ data: [], error: null })
    }),
    upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  })
};

let client;

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

if (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Persist session in localStorage for PWA support
        persistSession: true,
        autoRefreshToken: true,
        // Disable URL session detection — we use email/password, not OAuth
        detectSessionInUrl: false,
        storage: globalThis.localStorage,
      }
    });
    if (!client.auth) {
      console.warn('Supabase auth is missing from client, falling back to mock.');
      client = mockSupabase;
    }
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    client = mockSupabase;
  }
} else {
  client = mockSupabase;
}

export const supabase = client;

export const supabaseAdminAuth = supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'sb-admin-auth-token',
      detectSessionInUrl: false
    }
  })
  : mockSupabase;