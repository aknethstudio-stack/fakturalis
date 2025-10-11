import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useParams: () => ({
    id: 'test-client-id',
  }),
}));

// --- START: Correctly Typed Supabase Mocks ---

// This helper creates a mock of the Supabase query builder chain.
// It allows us to mock methods like .select(), .eq(), .order(), etc.
const createMockQueryBuilder = (data: unknown, error: unknown) => {
  const queryBuilder: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    or: jest.fn(),
    delete: jest.fn(),
  };

  const target = () => Promise.resolve({ data, error });

  const mockChain = new Proxy(target, {
    get: (target, prop) => {
      if (prop === 'then') {
        return target().then.bind(target());
      }
      if (!queryBuilder[prop as string]) {
        queryBuilder[prop as string] = jest.fn().mockReturnValue(mockChain);
      }
      return queryBuilder[prop as string];
    },
  }) as unknown as Record<string, jest.Mock>;

  // Pre-setup common query methods to return the chain
  queryBuilder.select?.mockReturnValue(mockChain);
  queryBuilder.eq?.mockReturnValue(mockChain);
  queryBuilder.order?.mockReturnValue(mockChain);
  queryBuilder.or?.mockReturnValue(mockChain);
  queryBuilder.delete?.mockReturnValue(mockChain);

  return mockChain;
};

const mockFrom = jest.fn();

const mockSupabaseInstance = {
  from: mockFrom,
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
  },
};

// --- END: Correctly Typed Supabase Mocks ---

const mockUserInstance = { id: 'test-user-id' };
const mockSignOutInstance = jest.fn();

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseInstance,
}));

// Mock hooks with stable references
jest.mock('@/hooks/use-supabase', () => ({
  useAuth: () => ({
    user: mockUserInstance,
    loading: false,
    signOut: mockSignOutInstance,
  }),
  useSupabase: () => mockSupabaseInstance,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import ClientsPage from '@/app/clients/page';
import { logger } from '@/lib/logger';
import type { Client } from '@/types/database';

const _mockSupabase = mockSupabaseInstance as jest.Mocked<typeof mockSupabaseInstance>;
const mockLogger = logger as jest.Mocked<typeof logger>;

// Correctly typed mock data
const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Test Company 1',
    email: 'test1@example.com',
    phone: '+48123456789',
    vat_id: '1234567890',
    address_line1: 'Test Street 1',
    address_line2: null,
    city: 'Warsaw',
    postal_code: '00-001',
    country_code: 'PL',
    notes: null,
    owner_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('ClientsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Create a simple mock that just returns a promise with the right structure
    const simpleMockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    // Make the chain awaitable - when awaited, it returns { data, error }
    Object.assign(simpleMockChain, {
      then: (resolve: (value: { data: unknown; error: null }) => unknown) => {
        return Promise.resolve({ data: mockClients, error: null }).then(resolve);
      },
    });

    // Default mock will be set up by individual tests as needed
    // mockFrom.mockReturnValue(simpleMockChain);
  });

  it('SIMPLE TEST - does basic data loading work', async () => {
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));
    render(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    });
  });

  it('renders page header', () => {
    // Mock to prevent errors during render
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));

    render(<ClientsPage />);
    expect(screen.getByText('Klienci')).toBeInTheDocument();
    expect(screen.getByText('Zarządzanie bazą klientów i ich danymi kontaktowymi')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    // Create a mock that will delay before resolving
    const slowMockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      then: jest.fn((resolve: (value: { data: unknown; error: null }) => unknown) => {
        // Delay the resolution to simulate loading
        return new Promise((res) => {
          setTimeout(() => {
            resolve({ data: mockClients, error: null });
            res({ data: mockClients, error: null });
          }, 100);
        });
      }),
    };

    mockFrom.mockReturnValueOnce(slowMockChain);

    render(<ClientsPage />);

    // Initially should show loading state
    expect(screen.getByText('Ładowanie klientów...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });
  });

  it('shows add client button', async () => {
    // Mock to prevent errors during render
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));

    render(<ClientsPage />);

    const addButton = screen.getByText('Dodaj klienta');
    expect(addButton).toBeInTheDocument();
    expect(addButton.closest('a')).toHaveAttribute('href', '/clients/new');
  });

  it('shows search input', () => {
    // Mock to prevent errors during render
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));

    render(<ClientsPage />);

    const searchInput = screen.getByPlaceholderText('Szukaj klientów po nazwie, emailu lub NIP...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('shows empty state when no clients', async () => {
    // Mock empty response for this test only
    mockFrom.mockReturnValueOnce(createMockQueryBuilder([], null));
    render(<ClientsPage />);
    await waitFor(() => expect(screen.getByText('Brak klientów')).toBeInTheDocument());
  });

  it('handles API errors gracefully', async () => {
    // Mock error response for this test only
    const dbError = { message: 'Database error', code: '500', details: '', hint: '' };
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(null, dbError));

    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Nie udało się pobrać listy klientów')).toBeInTheDocument();
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to fetch clients',
      expect.objectContaining({ message: 'Database error' }),
      { component: 'ClientsPage' },
    );
  });

  it('displays client list when data is available', async () => {
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));
    render(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('NIP: 1234567890')).toBeInTheDocument();
      expect(screen.getByText('Warsaw, PL')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    const mockQueryChain = createMockQueryBuilder(mockClients, null);
    mockFrom.mockReturnValue(mockQueryChain);

    render(<ClientsPage />);
    await waitFor(() => expect(screen.getByPlaceholderText(/szukaj klientów/i)).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/szukaj klientów/i);
    await act(async () => {
      await user.clear(searchInput);
      await user.type(searchInput, 'Test Company');
    });

    // Debounce in component is ~300ms, let's wait for it
    await new Promise((r) => setTimeout(r, 350));

    await waitFor(() => {
      expect(mockQueryChain.or).toHaveBeenCalledWith(
        'name.ilike.%Test Company%,email.ilike.%Test Company%,vat_id.ilike.%Test Company%',
      );
    });
  });

  it('shows different empty state message when search has no results', async () => {
    const user = userEvent.setup();
    // Initial load is successful with clients
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));

    render(<ClientsPage />);
    await waitFor(() => expect(screen.getByText('Test Company 1')).toBeInTheDocument());

    // Mock for the search returning no results
    const mockEmptyQueryChain = createMockQueryBuilder([], null);
    mockFrom.mockReturnValue(mockEmptyQueryChain);

    const searchInput = screen.getByPlaceholderText(/szukaj klientów/i);
    await act(async () => {
      await user.type(searchInput, 'nonexistent');
    });

    // Debounce
    await new Promise((r) => setTimeout(r, 350));

    await waitFor(() => {
      expect(screen.getByText('Nie znaleziono klientów spełniających kryteria wyszukiwania.')).toBeInTheDocument();
    });
  });

  it('shows delete confirmation when trash button is clicked', async () => {
    const user = userEvent.setup();

    // Mock to display clients
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));

    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Usuń klienta');
    await act(async () => {
      await user.click(deleteButton);
    });

    expect(screen.getByText('Potwierdź')).toBeInTheDocument();
    expect(screen.getByText('Anuluj')).toBeInTheDocument();
  });

  it('cancels delete when cancel button is clicked', async () => {
    const user = userEvent.setup();

    // Mock to display clients
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));

    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Usuń klienta');
    await act(async () => {
      await user.click(deleteButton);
    });

    const cancelButton = screen.getByText('Anuluj');
    await act(async () => {
      await user.click(cancelButton);
    });

    expect(screen.queryByText('Potwierdź')).not.toBeInTheDocument();
    expect(screen.queryByText('Anuluj')).not.toBeInTheDocument();
  });

  it('handles successful delete', async () => {
    const user = userEvent.setup();

    // Mock initial data load
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));

    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    // Mock delete operation
    const mockDeleteChain = createMockQueryBuilder(null, null);
    mockFrom.mockReturnValueOnce(mockDeleteChain);

    // Mock refresh after delete - empty list
    mockFrom.mockReturnValueOnce(createMockQueryBuilder([], null));

    const deleteButton = screen.getByTitle('Usuń klienta');
    await act(async () => {
      await user.click(deleteButton);
    });

    const confirmButton = screen.getByText('Potwierdź');
    await act(async () => {
      await user.click(confirmButton);
    });

    // Check that delete was called with correct parameters
    await waitFor(() => {
      expect(mockDeleteChain.delete).toHaveBeenCalled();
      expect(mockDeleteChain.eq).toHaveBeenCalledWith('id', 'client-1');
      expect(mockDeleteChain.eq).toHaveBeenCalledWith('owner_id', 'test-user-id');
    });
  });

  it('handles delete error', async () => {
    const user = userEvent.setup();

    // Mock initial data load
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));

    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    // Mock delete operation with error
    const deleteError = { message: 'Delete failed', code: '500', details: '', hint: '' };
    const mockDeleteChain = createMockQueryBuilder(null, deleteError);
    mockFrom.mockReturnValueOnce(mockDeleteChain);

    const deleteButton = screen.getByTitle('Usuń klienta');
    await act(async () => {
      await user.click(deleteButton);
    });

    const confirmButton = screen.getByText('Potwierdź');
    await act(async () => {
      await user.click(confirmButton);
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Nie udało się usunąć klienta')).toBeInTheDocument();
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to delete client',
      expect.objectContaining({ message: 'Delete failed' }),
      expect.objectContaining({ clientId: 'client-1', component: 'ClientsPage' }),
    );
  });

  it('displays edit button for each client', async () => {
    mockFrom.mockReturnValueOnce(createMockQueryBuilder(mockClients, null));
    render(<ClientsPage />);
    await waitFor(() => {
      expect(screen.getByTitle('Edytuj klienta')).toBeInTheDocument();
    });
  });
});
