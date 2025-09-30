import '@testing-library/jest-dom';

// Mock Next.js router

export const mockRouter = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  push: jest.fn(),
  prefetch: jest.fn(),
  replace: jest.fn(),
};

// Mock useRouter hook
jest.mock('next/navigation', () => ({
  useRouter() {
    return mockRouter;
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

/**
 * Creates a mock function with better TypeScript support
 */
export function createMockFn<T extends (...args: unknown[]) => unknown>(): jest.MockedFunction<T> {
  return jest.fn() as unknown as jest.MockedFunction<T>;
}

/**
 * Helper to create test data for invoices
 */
interface MockInvoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  sellDate: string;
  seller: {
    name: string;
    nip: string;
    address: string;
  };
  buyer: {
    name: string;
    nip: string;
    address: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    netValue: number;
    vatValue: number;
    grossValue: number;
  }>;
  totalNet: number;
  totalVat: number;
  totalGross: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  paymentMethod: string;
  notes: string;
}

export function createMockInvoice(overrides: Partial<MockInvoice> = {}): MockInvoice {
  return {
    id: '1',
    number: 'FV/2025/001',
    issueDate: '2025-01-15',
    dueDate: '2025-02-14',
    sellDate: '2025-01-15',
    seller: {
      name: 'AKNETH Studio',
      nip: '1234567890',
      address: 'ul. Testowa 1, 00-001 Warszawa',
    },
    buyer: {
      name: 'Test Company',
      nip: '0987654321',
      address: 'ul. Kliencka 2, 00-002 Warszawa',
    },
    items: [
      {
        id: '1',
        name: 'Usługi programistyczne',
        quantity: 1,
        unit: 'szt.',
        unitPrice: 1000,
        vatRate: 23,
        netValue: 1000,
        vatValue: 230,
        grossValue: 1230,
      },
    ],
    totalNet: 1000,
    totalVat: 230,
    totalGross: 1230,
    currency: 'PLN',
    status: 'draft' as const,
    paymentMethod: 'transfer',
    notes: '',
    ...overrides,
  };
}

/**
 * Helper to create test data for clients
 */
interface MockClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  nip: string;
  regon: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function createMockClient(overrides: Partial<MockClient> = {}): MockClient {
  return {
    id: '1',
    name: 'Test Client',
    email: 'client@test.com',
    phone: '+48 123 456 789',
    nip: '1234567890',
    regon: '123456789',
    address: {
      street: 'ul. Testowa 1',
      city: 'Warszawa',
      postalCode: '00-001',
      country: 'Polska',
    },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Helper to test loading states
 */
export function expectLoadingState(container: HTMLElement): void {
  const loadingElement = container.querySelector('[data-testid="loading"]');
  expect(loadingElement).toBeInTheDocument();
}

/**
 * Helper to test error states
 */
export function expectErrorState(container: HTMLElement, errorMessage?: string): void {
  const errorElement = container.querySelector('[data-testid="error"]');
  expect(errorElement).toBeInTheDocument();

  if (errorMessage) {
    expect(errorElement).toHaveTextContent(errorMessage);
  }
}
