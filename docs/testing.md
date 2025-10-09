# Testing Guide

Test utilities and patterns for the Fakturalis SaaS project.

## Testing Strategy

### Unit Tests (85% coverage target)

- **Components**: React components with different subscription plans
- **Utilities**: Business logic, validations, pricing calculations
- **Hooks**: Supabase integration, subscription management
- **API Routes**: Payment processing, subscription upgrades

### Integration Tests

- **Subscription flows**: Free to paid upgrades
- **Usage limits**: Plan limit enforcement
- **Multi-tenant**: Data isolation between users
- **Payment processing**: Stripe/PayU integration

## Test Helpers

Located in `__tests__/test-helpers.ts`:

### Mock Data

```typescript
// Invoice with realistic defaults
const invoice = createMockInvoice({ status: 'paid', totalGross: 5000 });

// Client with Polish data
const client = createMockClient({ name: 'Custom Corp', nip: '9876543210' });

// Subscription plans for testing
const freeUser = createMockUser({ plan: 'free', invoicesCount: 5 });
const smartUser = createMockUser({ plan: 'smart', invoicesCount: 50 });
const businessUser = createMockUser({ plan: 'business', usersCount: 8 });
const enterpriseUser = createMockUser({ plan: 'enterprise', unlimitedUsers: true });

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

// Plan-specific UI elements
expectPlanBadge(container, 'Smart');
expectUpgradePrompt(container, 'business');
expectPlanLimitWarning(container, '6 z 7 faktur użyte');
```

## Test Structure

```typescript
describe('InvoiceComponent', () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockRouter).forEach(mock => mock.mockClear());
  });

  describe('Free Plan User', () => {
    it('should show upgrade prompt when approaching limit', () => {
      const freeUser = createMockUser({ plan: 'free', invoicesCount: 6 });
      const { getByText } = render(<InvoiceComponent user={freeUser} />);
      expect(getByText(/1 faktura pozostała/)).toBeInTheDocument();
      expect(getByText(/Przejdź na Smart/)).toBeInTheDocument();
    });

    it('should block creation when limit exceeded', () => {
      const freeUser = createMockUser({ plan: 'free', invoicesCount: 7 });
      const { getByText } = render(<InvoiceComponent user={freeUser} />);
      expect(getByText(/Limit przekroczony/)).toBeInTheDocument();
    });
  });

  describe('Smart Plan User', () => {
    it('should allow unlimited invoices', () => {
      const smartUser = createMockUser({ plan: 'smart' });
      const { queryByText } = render(<InvoiceComponent user={smartUser} />);
      expect(queryByText(/limit/i)).not.toBeInTheDocument();
    });
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
