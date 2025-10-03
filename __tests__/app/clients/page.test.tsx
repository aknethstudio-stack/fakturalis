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

// Create stable mock objects
const mockSupabaseInstance = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

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

const mockSupabase = mockSupabaseInstance as jest.Mocked<typeof mockSupabaseInstance>;
const mockLogger = logger as jest.Mocked<typeof logger>;

const mockClients = [
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
    state_province: 'Mazowieckie',
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

    // Mock successful response by default
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
    } as unknown);
  });

  it('renders page header', async () => {
    await act(async () => {
      render(<ClientsPage />);
    });

    expect(screen.getByText('Klienci')).toBeInTheDocument();
    expect(screen.getByText('Zarządzanie bazą klientów i ich danymi kontaktowymi')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    // Mock a slow/pending response
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnValue(new Promise(() => {})), // Never resolves
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
    } as unknown);

    render(<ClientsPage />);

    expect(screen.getByText('Ładowanie klientów...')).toBeInTheDocument();
  });

  it('shows add client button', async () => {
    await act(async () => {
      render(<ClientsPage />);
    });

    expect(screen.getByText('Dodaj klienta')).toBeInTheDocument();
  });

  it('shows search input', async () => {
    await act(async () => {
      render(<ClientsPage />);
    });

    expect(screen.getByPlaceholderText(/szukaj klientów/i)).toBeInTheDocument();
  });

  it('shows empty state when no clients', async () => {
    // Mock empty response
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

    // Wait for async operations to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.getByText('Brak klientów')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock error response - simulate the actual query chain: .eq().order()
    const mockErrorQuery = Promise.resolve({
      data: null,
      error: { message: 'Database error' },
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue(mockErrorQuery),
      or: jest.fn().mockReturnValue(mockErrorQuery),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
    } as unknown);

    render(<ClientsPage />);

    // Wait for the error to be processed
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(screen.getByText('Nie udało się pobrać listy klientów')).toBeInTheDocument();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to fetch clients',
      { message: 'Database error' },
      { component: 'ClientsPage' },
    );
  });

  it('displays client list when data is available', async () => {
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
      or: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('NIP: 1234567890')).toBeInTheDocument();
      expect(screen.getByText('Warsaw, PL')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    const mockOrQuery = jest.fn().mockResolvedValue({
      data: mockClients,
      error: null,
    });

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: mockOrQuery,
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

    const searchInput = screen.getByPlaceholderText(/szukaj klientów/i);

    await act(async () => {
      await user.clear(searchInput);
      await user.type(searchInput, 'Test Company');
    });

    // Wait for re-render after state change
    await waitFor(() => {
      expect(mockOrQuery).toHaveBeenCalledWith(
        'name.ilike.%Test Company%,email.ilike.%Test Company%,vat_id.ilike.%Test Company%',
      );
    });
  });

  it('shows different empty state message when search has no results', async () => {
    const user = userEvent.setup();
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      or: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

    const searchInput = screen.getByPlaceholderText(/szukaj klientów/i);

    await act(async () => {
      await user.type(searchInput, 'nonexistent');
    });

    await waitFor(() => {
      expect(screen.getByText('Nie znaleziono klientów spełniających kryteria wyszukiwania.')).toBeInTheDocument();
    });
  });

  it('shows delete confirmation when trash button is clicked', async () => {
    const user = userEvent.setup();
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
      or: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

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
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
      or: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

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
    const mockDeleteQuery = {
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }),
    };

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
      or: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
      delete: jest.fn().mockReturnValue(mockDeleteQuery),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Usuń klienta');

    await act(async () => {
      await user.click(deleteButton);
    });

    const confirmButton = screen.getByText('Potwierdź');

    await act(async () => {
      await user.click(confirmButton);
    });

    expect(mockLogger.info).toHaveBeenCalledWith('Client deleted successfully', { clientId: 'client-1' });
  });

  it('handles delete error', async () => {
    const user = userEvent.setup();
    const mockDeleteQuery = {
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Delete error' },
        }),
      }),
    };

    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
      or: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
      delete: jest.fn().mockReturnValue(mockDeleteQuery),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Usuń klienta');

    await act(async () => {
      await user.click(deleteButton);
    });

    const confirmButton = screen.getByText('Potwierdź');

    await act(async () => {
      await user.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Nie udało się usunąć klienta')).toBeInTheDocument();
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to delete client',
      { message: 'Delete error' },
      { clientId: 'client-1', component: 'ClientsPage' },
    );
  });

  it('displays edit button for each client', async () => {
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
      or: jest.fn().mockResolvedValue({
        data: mockClients,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockQuery),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
    } as unknown);

    await act(async () => {
      render(<ClientsPage />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Edytuj klienta')).toBeInTheDocument();
    });
  });
});
