import { render, screen, act } from '@testing-library/react';
import { supabase } from '@/lib/supabase';

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

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock hooks
jest.mock('@/hooks/use-supabase', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false,
    signOut: jest.fn(),
  }),
  useSupabase: () => supabase,
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

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

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
    await act(async () => {
      render(<ClientsPage />);
    });

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
    // Mock error response
    const mockQuery = {
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
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

    expect(screen.getByText('Nie udało się pobrać listy klientów')).toBeInTheDocument();
  });
});
