# Testing Guide

Test utilities and patterns for the InvoiceForge project.

## Test Helpers

Located in `__tests__/test-helpers.ts`:

### Mock Data

```typescript
// Invoice with realistic defaults
const invoice = createMockInvoice({ status: 'paid', totalGross: 5000 });

// Client with Polish data
const client = createMockClient({ name: 'Custom Corp', nip: '9876543210' });

// Typed mock functions
const mockCallback = createMockFn<(value: string) => number>();
```

### Router Mocking

```typescript
// Pre-configured Next.js router mock
mockRouter.push('/invoices/123');
expect(mockRouter.push).toHaveBeenCalledWith('/invoices/123');
```

### UI State Testing

```typescript
// Loading and error state assertions
expectLoadingState(container);
expectErrorState(container, 'Network failed');
```

## Test Structure

```typescript
describe('Component', () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockRouter).forEach(mock => mock.mockClear());
  });

  it('should render with mock data', () => {
    const data = createMockInvoice();
    const { getByText } = render(<Component data={data} />);
    expect(getByText(data.number)).toBeInTheDocument();
  });
});
```

## Commands

```bash
npm run test           # Watch mode
npm run test:ci        # CI mode with coverage
npm run test:coverage  # Generate coverage report
```

Coverage reports are generated in `coverage/` directory with HTML output.
