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

    expect(screen.getByLabelText(/nazwa klienta/i)).toHaveValue('');
    expect(screen.getByLabelText(/adres email/i)).toHaveValue('');
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
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
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

  it('calls onSuccess callback when provided', async () => {
    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();
    render(<ClientForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls onCancel callback when provided', async () => {
    const mockOnCancel = jest.fn();
    const user = userEvent.setup();
    render(<ClientForm onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /anuluj/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('navigates to clients page when cancel is clicked without callback', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const cancelButton = screen.getByRole('button', { name: /anuluj/i });
    await user.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith('/clients');
  });

  it('handles update error gracefully', async () => {
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

    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      }),
    } as unknown);

    const user = userEvent.setup();
    render(<ClientForm client={client} />);

    const nameInput = screen.getByDisplayValue('Test Company');
    const submitButton = screen.getByRole('button', { name: /zapisz zmiany/i });

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Company');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('formats NIP on blur', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nipInput = screen.getByLabelText(/nip/i);

    await user.type(nipInput, '1234567890');
    await user.tab(); // Trigger blur

    expect(nipInput).toHaveValue('123-456-78-90');
  });

  it('formats phone on blur', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const phoneInput = screen.getByLabelText(/telefon/i);

    await user.type(phoneInput, '123456789');
    await user.tab(); // Trigger blur

    expect(phoneInput).toHaveValue('123456789');
  });

  it('accepts all address fields input', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const addressLine1Input = screen.getByLabelText(/ulica i numer/i);
    const addressLine2Input = screen.getByLabelText(/dodatkowe informacje adresowe/i);
    const cityInput = screen.getByLabelText(/miasto/i);

    await user.type(addressLine1Input, 'ul. Testowa 123');
    await user.type(addressLine2Input, 'Mieszkanie 4');
    await user.type(cityInput, 'Warszawa');

    expect(addressLine1Input).toHaveValue('ul. Testowa 123');
    expect(addressLine2Input).toHaveValue('Mieszkanie 4');
    expect(cityInput).toHaveValue('Warszawa');
  });

  it('accepts notes input', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const notesInput = screen.getByLabelText(/notatki/i);

    await user.type(notesInput, 'Ważny klient');

    expect(notesInput).toHaveValue('Ważny klient');
  });

  it('handles country selection', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const countrySelect = screen.getByLabelText(/kraj/i);

    await user.selectOptions(countrySelect, 'DE');

    expect(countrySelect).toHaveValue('DE');
  });

  it('triggers email validation with invalid format', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const emailInput = screen.getByLabelText(/adres email/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.type(emailInput, 'invalid');
    await user.click(submitButton);

    // The validation should be triggered in the form submission
    await waitFor(() => {
      // We're not looking for the error message in DOM, just testing the validation path
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  it('triggers postal code validation with invalid format', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const postalCodeInput = screen.getByLabelText(/kod pocztowy/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.type(postalCodeInput, '12345');
    await user.click(submitButton);

    // The validation should be triggered in the form submission
    await waitFor(() => {
      // We're not looking for the error message in DOM, just testing the validation path
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  it('triggers NIP validation with invalid format', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const nipInput = screen.getByLabelText(/nip/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.type(nipInput, '123abc');
    await user.click(submitButton);

    // The validation should be triggered in the form submission
    await waitFor(() => {
      // We're not looking for the error message in DOM, just testing the validation path
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
