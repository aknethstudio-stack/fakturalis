# Testing Helpers Documentation

## Overview

This document describes the test helper utilities available in `__tests__/test-helpers.ts` for the
InvoiceForge project. These utilities make it easier to write consistent, maintainable tests.

## Mock Data Creators

### `createMockInvoice(overrides?)`

Creates a complete mock invoice object with realistic default values.

**Parameters:**

- `overrides` (optional): Partial invoice object to override default values

**Example:**

```typescript
// Basic usage with defaults
const invoice = createMockInvoice();
console.log(invoice.number); // "FV/2025/001"

// With custom values
const paidInvoice = createMockInvoice({
  status: 'paid',
  totalGross: 5000,
  number: 'FV/2025/999',
});
```

**Default Values:**

- ID: '1'
- Number: 'FV/2025/001'
- Status: 'draft'
- Currency: 'PLN'
- Total: 1230 PLN gross (1000 net + 230 VAT)
- Seller: AKNETH Studio
- Buyer: Test Company
- Single item: Programming services

### `createMockClient(overrides?)`

Creates a complete mock client object with realistic default values.

**Parameters:**

- `overrides` (optional): Partial client object to override default values

**Example:**

```typescript
// Basic usage
const client = createMockClient();

// Custom client
const customClient = createMockClient({
  name: 'Custom Corp',
  email: 'contact@custom.com',
  nip: '9876543210',
});
```

**Default Values:**

- Name: 'Test Client'
- Email: 'client@test.com'
- Phone: '+48 123 456 789'
- NIP: '1234567890'
- Address in Warsaw, Poland

## Mock Functions

### `createMockFn<T>()`

Creates a properly typed Jest mock function.

**Type Parameter:**

- `T`: Function signature type

**Example:**

```typescript
// Typed callback mock
const mockCallback = createMockFn<(value: string) => number>();
mockCallback.mockReturnValue(42);

// Usage in component
const result = mockCallback('test');
expect(mockCallback).toHaveBeenCalledWith('test');
expect(result).toBe(42);
```

## Router Mocking

### `mockRouter`

Pre-configured mock for Next.js `useRouter` hook. Automatically mocks:

- `useRouter()` → returns `mockRouter` object
- `useSearchParams()` → returns empty URLSearchParams
- `usePathname()` → returns '/'

**Available Methods:**

- `back()`, `forward()`, `refresh()`
- `push()`, `prefetch()`, `replace()`

**Example:**

```typescript
// In your test
mockRouter.push('/invoices/123');
expect(mockRouter.push).toHaveBeenCalledWith('/invoices/123');

// Reset mocks between tests
beforeEach(() => {
  Object.values(mockRouter).forEach((mock) => mock.mockClear());
});
```

## UI State Helpers

### `expectLoadingState(container)`

Asserts that a loading state is displayed in the container.

**Parameters:**

- `container`: HTMLElement from render result

**Requirements:**

- Element must have `data-testid="loading"` attribute

**Example:**

```typescript
const { container } = render(<MyComponent loading={true} />);
expectLoadingState(container);
```

### `expectErrorState(container, errorMessage?)`

Asserts that an error state is displayed in the container.

**Parameters:**

- `container`: HTMLElement from render result
- `errorMessage` (optional): Expected error message text

**Requirements:**

- Element must have `data-testid="error"` attribute

**Example:**

```typescript
const { container } = render(<MyComponent error="Network failed" />);

// Check error exists
expectErrorState(container);

// Check specific message
expectErrorState(container, 'Network failed');
```

## Test Organization Patterns

### Basic Test Structure

```typescript
import {
  createMockInvoice,
  mockRouter,
  expectLoadingState
} from './test-helpers';

describe('Invoice Component', () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockRouter).forEach(mock => mock.mockClear());
  });

  it('should display invoice details', () => {
    const invoice = createMockInvoice({
      number: 'FV/2025/555',
      status: 'sent'
    });

    const { getByText } = render(<InvoiceCard invoice={invoice} />);

    expect(getByText('FV/2025/555')).toBeInTheDocument();
    expect(getByText('Sent')).toBeInTheDocument();
  });
});
```

### Integration Test Pattern

```typescript
describe('Invoice Management Flow', () => {
  it('should handle complete invoice workflow', async () => {
    // Setup test data
    const invoice = createMockInvoice({ status: 'draft' });
    const client = createMockClient();

    // Setup mocks
    const onSave = createMockFn<(invoice: Invoice) => Promise<void>>();
    onSave.mockResolvedValue();

    // Render and interact
    const { container } = render(
      <InvoiceForm
        invoice={invoice}
        client={client}
        onSave={onSave}
      />
    );

    // Test loading state
    expectLoadingState(container);

    // Continue test...
  });
});
```

## Best Practices

### 1. Mock Data Consistency

- Always use helper functions for creating test data
- Override only the fields you need to test
- Keep default values realistic and representative

### 2. Mock Management

- Reset mocks between tests using `beforeEach`
- Use typed mocks with `createMockFn<T>()` for better IntelliSense
- Clear router mocks when testing navigation

### 3. State Assertions

- Use `expectLoadingState` and `expectErrorState` for consistent UI testing
- Add `data-testid` attributes to components for reliable selection
- Test both presence and content of error messages

### 4. Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names that explain the expected behavior
- Set up common test data and mocks in `beforeEach`

## Configuration Notes

**Jest Config:**

- Helpers are excluded from test runs via `testMatch` patterns
- File is named `test-helpers.ts` to avoid Jest auto-discovery

**Dependencies:**

- Requires `@testing-library/react` and `@testing-library/jest-dom`
- Router mocking works with Next.js 13+ app router

**TypeScript:**

- All helpers are fully typed for better developer experience
- Mock functions maintain proper type safety
