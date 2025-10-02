// Mock for @supabase modules to avoid ES module issues in Jest

export const createClientComponentClient = jest.fn(() => ({
  auth: {
    getUser: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
}));

export const createServerComponentClient = jest.fn();
export const createRouteHandlerClient = jest.fn();
