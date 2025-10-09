# 🔄 Subscription Management

## Plan Management System

Fakturalis implements a robust subscription management system supporting freemium model with
usage-based limitations and upgrade paths.

### Core Components

#### Subscription State

```typescript
interface Subscription {
  id: string;
  userId: string;
  planName: 'free' | 'smart' | 'business' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Usage Tracking

```typescript
interface UsageLimits {
  id: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  invoicesCount: number;
  usersCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Plan Features & Limits

### Free Plan (0 PLN)

**Limits:**

- 7 invoices per month
- 1 user account
- Basic PDF templates
- Email support only

**Features:**

- Unlimited clients
- Unlimited products
- KSeF integration
- Basic reporting

### Smart Plan (49 PLN)

**Limits:**

- Unlimited invoices
- Up to 3 users
- Priority email support (24h response)

**Features:**

- Everything from Free
- Custom branding
- Automated recurring invoices
- Basic JPK reports
- Email automation

### Business Plan (99 PLN)

**Limits:**

- Unlimited invoices
- Up to 10 users
- OCR: 10 documents/month
- Up to 3 warehouses

**Features:**

- Everything from Smart
- Advanced inventory management
- Full JPK suite
- API access
- Phone support

### Enterprise Plan (299 PLN)

**Limits:**

- Unlimited everything
- Unlimited users
- Unlimited OCR
- Unlimited warehouses

**Features:**

- Everything from Business
- White-label branding
- Custom integrations
- SLA 99.9% uptime
- Dedicated support manager

## Implementation Patterns

### Usage Limit Checking

```typescript
// Check if user can perform action
async function canCreateInvoice(userId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(userId);

  if (subscription.planName !== 'free') {
    return true; // Unlimited for paid plans
  }

  const usage = await getCurrentUsage(userId);
  return usage.invoicesCount < 7;
}

// Usage enforcement in API routes
export async function POST(request: Request) {
  const userId = await getUserId(request);

  const canCreate = await canCreateInvoice(userId);
  if (!canCreate) {
    return NextResponse.json(
      {
        error: 'Limit przekroczony',
        message: 'Przejdź na plan Smart dla nielimitowanych faktur',
        upgradeUrl: '/pricing',
      },
      { status: 402 }, // Payment Required
    );
  }

  // Create invoice...
}
```

### Plan Upgrade Flow

```typescript
// Upgrade subscription
async function upgradePlan(userId: string, newPlan: PlanName, paymentMethodId: string) {
  // 1. Validate upgrade path
  const currentSub = await getActiveSubscription(userId);
  const isValidUpgrade = validateUpgradePath(currentSub.planName, newPlan);

  if (!isValidUpgrade) {
    throw new Error('Invalid upgrade path');
  }

  // 2. Process payment
  const paymentResult = await processPayment({
    amount: getPlanPrice(newPlan),
    currency: 'PLN',
    paymentMethodId,
    userId,
  });

  // 3. Update subscription
  await updateSubscription(userId, {
    planName: newPlan,
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: addMonths(new Date(), 1),
  });

  // 4. Reset usage limits
  await resetUsageLimits(userId);

  return { success: true, subscription: updatedSub };
}
```

### Feature Access Control

```typescript
// Feature gate component
function FeatureGate({
  requiredPlan,
  children,
  fallback
}: {
  requiredPlan: PlanName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { subscription } = useSubscription();
  const hasAccess = planHasFeature(subscription.planName, requiredPlan);

  if (!hasAccess) {
    return fallback || <UpgradePrompt requiredPlan={requiredPlan} />;
  }

  return <>{children}</>;
}

// Usage in components
<FeatureGate requiredPlan="smart">
  <RecurringInvoiceSettings />
</FeatureGate>

<FeatureGate
  requiredPlan="business"
  fallback={<div>OCR dostępne w planach Business i Enterprise</div>}
>
  <OCRDocumentProcessor />
</FeatureGate>
```

## Payment Integration

### Stripe Integration

```typescript
// Create payment intent for upgrade
async function createUpgradePayment(userId: string, planName: PlanName) {
  const amount = getPlanPrice(planName) * 100; // Stripe uses cents

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'pln',
    customer: await getStripeCustomerId(userId),
    metadata: {
      userId,
      planName,
      upgradeFrom: (await getActiveSubscription(userId)).planName,
    },
  });

  return paymentIntent;
}

// Handle successful payment
async function handlePaymentSuccess(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const { userId, planName, upgradeFrom } = paymentIntent.metadata;

  // Upgrade subscription
  await upgradePlan(userId, planName as PlanName, paymentIntent.payment_method);

  // Send confirmation email
  await sendUpgradeConfirmationEmail(userId, upgradeFrom, planName);

  // Log upgrade event
  await auditLogger.logSubscription('upgrade', userId, { from: upgradeFrom, to: planName });
}
```

### Polish Payment Methods

```typescript
// PayU integration for Polish market
async function createPayUPayment(userId: string, planName: PlanName) {
  const order = {
    customerIp: await getUserIP(),
    merchantPosId: process.env.PAYU_MERCHANT_ID,
    description: `Fakturalis ${planName} - 1 miesiąc`,
    currencyCode: 'PLN',
    totalAmount: getPlanPrice(planName) * 100, // PayU uses grosze
    products: [
      {
        name: `Plan ${planName}`,
        unitPrice: getPlanPrice(planName) * 100,
        quantity: 1,
      },
    ],
    buyer: await getBuyerInfo(userId),
    notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payu`,
    continueUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
  };

  return await payuApi.createOrder(order);
}
```

## Analytics & Monitoring

### Key Metrics Tracking

```typescript
// Track subscription metrics
async function trackSubscriptionMetrics() {
  const metrics = {
    // MRR calculation
    monthlyRecurringRevenue: await calculateMRR(),

    // Churn rate
    churnRate: await calculateChurnRate(),

    // Conversion rates
    freeToSmartConversion: await getConversionRate('free', 'smart'),
    smartToBusinessConversion: await getConversionRate('smart', 'business'),

    // Plan distribution
    planDistribution: await getPlanDistribution(),

    // Customer lifetime value
    averageCLV: await calculateAverageCLV(),
  };

  // Send to analytics
  await analytics.track('subscription_metrics', metrics);
}

// Usage pattern analysis
async function analyzeUsagePatterns() {
  const patterns = await db.query(`
    SELECT 
      s.plan_name,
      AVG(ul.invoices_count) as avg_invoices,
      COUNT(*) as user_count,
      COUNT(CASE WHEN ul.invoices_count >= 7 THEN 1 END) as hitting_limit
    FROM subscriptions s
    JOIN usage_limits ul ON ul.user_id = s.user_id
    WHERE s.status = 'active'
    GROUP BY s.plan_name
  `);

  return patterns;
}
```

### Health Monitoring

```typescript
// Subscription health checks
async function runHealthChecks() {
  const checks = {
    // Payment failures
    failedPayments: await getFailedPayments(),

    // Approaching limits
    usersNearLimit: await getUsersNearLimits(),

    // Cancellation requests
    cancelationRequests: await getPendingCancellations(),

    // Support tickets by plan
    supportTicketsByPlan: await getSupportTicketsByPlan(),
  };

  // Alert if thresholds exceeded
  if (checks.failedPayments.length > 10) {
    await sendAlert('High payment failure rate', checks.failedPayments);
  }

  return checks;
}
```

This subscription management system ensures smooth user experience while maintaining revenue growth
through strategic plan positioning and usage-based limitations.
