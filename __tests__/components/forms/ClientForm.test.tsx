import { supabase } from '@/lib/supabase';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
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

import ClientForm from '@/components/forms/ClientForm';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('ClientForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'new-client-id' }],
          error: null,
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ id: 'existing-client-id' }],
              error: null,
            }),
          }),
        }),
      }),
    } as unknown);
  });

  it('renders empty form for new client', () => {
    render(<ClientForm />);

    expect(screen.getByLabelText(/nazwa firmy/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /dodaj klienta/i })).toBeInTheDocument();
  });

  it('renders form with client data for editing', () => {
    const client = {
      id: 'test-id',
      name: 'Test Company',
      email: 'test@example.com',
      phone: '+48123456789',
      vat_id: '1234567890',
      address_line1: 'Test Street 1',
      address_line2: 'Apt 2',
      city: 'Warsaw',
      postal_code: '00-001',
      state_province: 'Mazowieckie',
      country_code: 'PL',
      notes: null,
      owner_id: 'test-user-id',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<ClientForm client={client} />);

    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zapisz zmiany/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nazwa klienta jest wymagana/i)).toBeInTheDocument();
    });
  });

  it('accepts valid email format', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const emailInput = screen.getByLabelText(/adres email/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const emailInput = screen.getByLabelText(/adres email/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/clients');
    });
  });

  it('updates existing client', async () => {
    const client = {
      id: 'test-id',
      name: 'Test Company',
      email: 'test@example.com',
      phone: null,
      vat_id: null,
      address_line1: null,
      address_line2: null,
      city: null,
      postal_code: null,
      state_province: null,
      country_code: null,
      notes: null,
      owner_id: 'test-user-id',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const user = userEvent.setup();
    render(<ClientForm client={client} />);

    const nameInput = screen.getByDisplayValue('Test Company');
    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Company');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/clients');
    });
  });

  it('handles form submission errors', async () => {
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }),
    } as unknown);

    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('accepts NIP input', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nipInput = screen.getByLabelText(/nip/i);

    await user.type(nipInput, '1234567890');

    expect(nipInput).toHaveValue('1234567890');
  });

  it('accepts phone input', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const phoneInput = screen.getByLabelText(/telefon/i);

    await user.type(phoneInput, '123456789');

    expect(phoneInput).toHaveValue('123456789');
  });

  it('accepts postal code input', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const postalCodeInput = screen.getByLabelText(/kod pocztowy/i);

    await user.type(postalCodeInput, '00001');

    expect(postalCodeInput).toHaveValue('00001');
  });
});
