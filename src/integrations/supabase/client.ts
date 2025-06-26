
// Mock Supabase client for local testing
const mockSupabaseClient = {
  auth: {
    signUp: (credentials: any) => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signInWithPassword: (credentials: any) => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => ({ 
      data: { 
        subscription: { 
          unsubscribe: () => {} 
        } 
      } 
    })
  },
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null })
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    })
  }),
  functions: {
    invoke: (name: string, options?: any) => Promise.resolve({ data: null, error: null })
  }
};

export const supabase = mockSupabaseClient;
