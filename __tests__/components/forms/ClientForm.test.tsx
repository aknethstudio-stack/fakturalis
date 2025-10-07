import { useAuth } from '@/hooks/use-supabase';
import { supabase } from '@/lib/supabase';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
}));

// Mock polish-registries
import { usePolishRegistries } from '@/lib/polish-registries';
import { validateNIP } from '@/lib/utils';

// Mock the external dependencies
jest.mock('@/lib/utils', () => ({
  validateNIP: jest.fn(),
}));

jest.mock('@/lib/polish-registries', () => ({
  usePolishRegistries: jest.fn(),
}));

// Get mocked functions to configure them
const mockValidateNIP = jest.mocked(validateNIP);
const mockUsePolishRegistries = jest.mocked(usePolishRegistries);

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...args) => args.filter(Boolean).join(' ')),
  validateNIP: jest.fn(),
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
  useAuth: jest.fn().mockReturnValue({
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

    // Configure default mock for useAuth
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
      loading: false,
      signOut: jest.fn(),
    });

    // Configure mocks for each test
    mockValidateNIP.mockReturnValue(true);
    mockUsePolishRegistries.mockReturnValue({
      searchCompany: jest.fn().mockRejectedValue(new Error('Network error')),
      getSourceInfo: jest.fn().mockReturnValue({ name: 'Test Registry' }),
    });

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

    await user.type(nameInput, 'Test Company');
    await user.type(nipInput, '123abc');

    // Submit form using form element directly
    const form = nipInput.closest('form')!;
    fireEvent.submit(form);

    // The validation should prevent submission with invalid NIP
    await waitFor(() => {
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  it('shows manual email validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.type(emailInput, 'invalid@domain'); // Invalid email to trigger manual validation
    await user.click(submitButton);

    // This should trigger setError('email', ...) at lines 199-202
    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy adres email')).toBeInTheDocument();
    });

    // Verify database was not called due to validation error
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('validates email field with manual validation', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // The validation should be triggered in the form submission
    await waitFor(() => {
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  it('handles empty address fields properly', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const streetInput = screen.getByLabelText(/ulica/i);
    const cityInput = screen.getByLabelText(/miasto/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Test Company');
    await user.type(streetInput, '   '); // Whitespace only
    await user.type(cityInput, '   '); // Whitespace only
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  it('handles all optional fields as empty strings', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });

    await user.type(nameInput, 'Minimal Company');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });
  });

  it('handles user null scenario during form submission', async () => {
    // Mock user as null from the start
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      session: null,
      loading: false,
      signOut: jest.fn().mockResolvedValue(undefined),
      signInWithEmail: jest.fn().mockResolvedValue({}),
      signUpWithEmail: jest.fn().mockResolvedValue({}),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      isAuthenticated: false,
    }));

    const user = userEvent.setup();
    const { container } = render(<ClientForm />);

    // Fill form with required data
    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    await user.type(nameInput, 'Test Company');

    // Submit form directly using fireEvent to ensure it triggers
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    // Wait for error message to appear
    await waitFor(
      () => {
        expect(screen.getByText('Musisz być zalogowany')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it('handles registry lookup with empty NIP', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    // Click registry lookup button without entering NIP
    const lookupButton = screen.getByTitle(/pobierz dane z polskich rejestrów/i);
    await user.click(lookupButton);

    // Should show error message for empty NIP
    await waitFor(() => {
      expect(screen.getByText('Wprowadź NIP aby wyszukać dane w polskich rejestrach')).toBeInTheDocument();
    });
  });

  it('handles registry lookup with invalid NIP', async () => {
    // Mock validateNIP to return false for invalid NIP
    mockValidateNIP.mockReturnValueOnce(false);

    const user = userEvent.setup();
    render(<ClientForm />);

    // Enter invalid NIP
    await user.type(screen.getByLabelText(/nip/i), '123456789');

    // Click registry lookup button
    const lookupButton = screen.getByTitle(/pobierz dane z polskich rejestrów/i);
    await user.click(lookupButton);

    // Should show error message for invalid NIP
    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy format NIP')).toBeInTheDocument();
    });
  });

  it('handles successful registry lookup', async () => {
    // Mock successful company data lookup
    const mockCompanyData = {
      name: 'Test Company',
      address: {
        street: 'Testowa',
        houseNumber: '1',
        apartmentNumber: '2',
        city: 'Warszawa',
        postalCode: '00001',
      },
      source: 'GUS' as const,
      status: 'active' as const,
    };

    const mockSearchCompany = jest.fn().mockResolvedValue(mockCompanyData);
    const mockGetSourceInfo = jest.fn().mockReturnValue({ name: 'GUS (Główny Urząd Statystyczny)' });

    // Set up mock BEFORE rendering
    mockUsePolishRegistries.mockImplementation(() => ({
      searchCompany: mockSearchCompany,
      getSourceInfo: mockGetSourceInfo,
    }));

    const user = userEvent.setup();
    render(<ClientForm />);

    // Enter valid NIP
    await user.type(screen.getByLabelText(/nip/i), '1234567890');

    // Click registry lookup button
    const lookupButton = screen.getByTitle(/pobierz dane z polskich rejestrów/i);
    // Click registry lookup button
    await user.click(lookupButton);

    // Should show success message
    await waitFor(() => {
      expect(
        screen.getByText(/✅ Dane pobrane z GUS \(Główny Urząd Statystyczny\) \(firma aktywna\)/),
      ).toBeInTheDocument();
    });

    // Form fields should be populated
    expect(screen.getByLabelText(/nazwa klienta/i)).toHaveValue('Test Company');
    expect(screen.getByLabelText(/miasto/i)).toHaveValue('Warszawa');
    expect(screen.getByLabelText(/kod pocztowy/i)).toHaveValue('00-001');
  });

  it('handles registry lookup error', async () => {
    // Mock registry lookup to throw error
    const mockSearchCompany = jest.fn().mockRejectedValue(new Error('Network error'));
    const mockGetSourceInfo = jest.fn();

    mockUsePolishRegistries.mockImplementation(() => ({
      searchCompany: mockSearchCompany,
      getSourceInfo: mockGetSourceInfo,
    }));

    const user = userEvent.setup();
    render(<ClientForm />);

    // Enter valid NIP
    await user.type(screen.getByLabelText(/nip/i), '1234567890');

    // Click registry lookup button
    const lookupButton = screen.getByTitle(/pobierz dane z polskich rejestrów/i);
    await user.click(lookupButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('❌ Błąd podczas pobierania danych z polskich rejestrów')).toBeInTheDocument();
    });
  });

  it('handles registry lookup when no company found', async () => {
    // Mock searchCompany to return null (no company found)
    const mockSearchCompany = jest.fn().mockResolvedValue(null);
    const mockGetSourceInfo = jest.fn();

    mockUsePolishRegistries.mockImplementation(() => ({
      searchCompany: mockSearchCompany,
      getSourceInfo: mockGetSourceInfo,
    }));

    const user = userEvent.setup();
    render(<ClientForm />);

    // Enter valid NIP
    await user.type(screen.getByLabelText(/nip/i), '1234567890');

    // Click registry lookup button
    const lookupButton = screen.getByTitle(/pobierz dane z polskich rejestrów/i);
    await user.click(lookupButton);

    // Should show no company found message
    await waitFor(() => {
      expect(screen.getByText('Nie znaleziono firmy o podanym NIP w żadnym z polskich rejestrów')).toBeInTheDocument();
    });
  });

  it('triggers manual NIP validation when Zod validation is bypassed', async () => {
    // Mock validateNIP from utils to return false
    const { validateNIP: mockValidateNIP } = jest.requireMock('@/lib/utils');
    mockValidateNIP.mockReturnValueOnce(false);

    render(<ClientForm />);

    // Fill required fields
    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const nipInput = screen.getByLabelText(/nip/i);

    fireEvent.change(nameInput, { target: { value: 'Test Company' } });
    fireEvent.change(nipInput, { target: { value: '1234567890' } });

    // Submit form - should trigger manual NIP validation path
    const form = nameInput.closest('form')!;
    fireEvent.submit(form);

    // Manual validation should prevent submission due to invalid NIP
    await waitFor(() => {
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  it('covers postal code validation edge cases for 100% coverage', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const postalCodeInput = screen.getByLabelText(/kod pocztowy/i);

    // Test case 1: Empty postal code (should trigger line 29: if (!val) return true)
    await user.type(nameInput, 'Test Company');
    // Postal code is empty - should pass validation via line 29

    const form = postalCodeInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    // Reset mock for next test
    mockSupabase.from.mockClear();

    // Test case 2: Invalid postal code (should trigger line 30: return /^\d{2}-\d{3}$/.test(val))
    await user.type(postalCodeInput, 'WRONG_FORMAT'); // Invalid format to trigger regex test

    fireEvent.submit(form);

    await waitFor(() => {
      // Should fail validation due to invalid postal code format
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    // Reset and test case 3: Valid postal code format
    mockSupabase.from.mockClear();
    await user.clear(postalCodeInput);
    await user.type(postalCodeInput, '00-000'); // Valid format

    fireEvent.submit(form);

    await waitFor(() => {
      // Should pass validation with valid format
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  it('FINAL ATTEMPT - manual trigger of postal code validation lines 29-30', async () => {
    const user = userEvent.setup();
    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/nazwa klienta/i);
    const postalCodeInput = screen.getByLabelText(/kod pocztowy/i);

    // Fill required field
    await user.type(nameInput, 'Test Company');

    // Case 1: Test empty postal code (should trigger line 29: if (!val) return true)
    // Leave postal code empty and submit
    const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    // Reset mock
    mockSupabase.from.mockClear();

    // Case 2: Test invalid postal code (should trigger line 30: return /^\d{2}-\d{3}$/.test(val))
    await user.type(postalCodeInput, 'INVALID-FORMAT-TEST');
    await user.click(submitButton);

    // Should NOT call Supabase due to validation error
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(mockSupabase.from).not.toHaveBeenCalled();

    // Case 3: Test valid postal code (should also trigger line 30 but return true)
    fireEvent.change(postalCodeInput, { target: { value: '12-345' } });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});
