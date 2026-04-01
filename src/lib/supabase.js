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
    onAuthStateChanged: (callback) => {
      console.warn('Using mock onAuthStateChanged. Auth will not work.');
      // Return a dummy subscription object
      return { data: { subscription: { unsubscribe: () => {} } } };
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
  console.log('Initializing Supabase with URL:', supabaseUrl.substring(0, 15) + '...', 'Key length:', supabaseAnonKey.length);
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client created successfully. Auth:', !!client.auth, 'Functions:', !!client.functions);
    if (!client.auth) {
      console.error('Supabase client created but auth is missing! Keys:', Object.keys(client));
    }
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    client = mockSupabase;
  }
} else {
  console.error('Supabase credentials missing or invalid. URL:', supabaseUrl ? 'provided' : 'missing', 'Key:', supabaseAnonKey ? 'provided' : 'missing');
  client = mockSupabase;
}

export const supabase = client;
