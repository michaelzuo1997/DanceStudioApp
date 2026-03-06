// Mock for the supabase client used in tests
// All methods are jest.fn() so tests can configure return values

// Build a fully chainable query object. Every method returns `this`,
// and the chain is thenable so `await supabase.from('x').select()...` resolves.
function buildDefaultChain() {
  const result = { data: [], error: null };
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn((resolve) => resolve(result)),
  };
  return chain;
}

export const supabase = {
  rpc: jest.fn(),
  from: jest.fn(() => buildDefaultChain()),
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
};
