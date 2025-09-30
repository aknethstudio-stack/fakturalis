# UI Patterns Cheatsheet (local) — InvoiceForge

Solo-friendly, pragmatic UI patterns aligned with our stack and goals:

- Next.js (App Router), React 19
- Tailwind CSS v4 + SCSS
- Headless UI
- lucide-react
- react-hook-form + zod
- @tanstack/react-query
- Supabase JS (client + server helpers available if needed)
- PDF export (jspdf, jspdf-autotable)
- Print (react-to-print)

Note: Tailwind v4 utilities and design tokens come from CSS `@theme`. Example tokens used below:
`--color-brand`, `--radius-xl`, `--breakpoint-3xl`. Define them in `src/styles/global.scss`.

---

## 0) Layout shell

Use a simple application shell: header with actions, optional sidebar (if needed later), main
content area with consistent padding and max width. Keep semantic HTML, utilities for spacing, and
rely on `bg-brand`, `text-brand` that map to your `@theme` tokens.

Example (page section structure):

```tsx
export default function Page() {
  return (
    <main className='min-h-dvh bg-gray-50'>
      <header className='sticky top-0 z-40 border-b bg-white/80 backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between px-4'>
          <div className='flex items-center gap-2'>
            <div className='bg-brand size-6 rounded-md' aria-hidden />
            <h1 className='text-base font-semibold text-gray-900'>InvoiceForge</h1>
          </div>
          <div className='flex items-center gap-2'>
            <button className='btn'>Nowa faktura</button>
            <button className='btn-secondary'>Eksport</button>
          </div>
        </div>
      </header>

      <section className='mx-auto max-w-7xl p-4'>{/* content */}</section>
    </main>
  );
}
```

Style primitives (place in `@layer components` within SCSS if you prefer):

```scss
@layer components {
  .btn {
    @apply bg-brand inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition;
  }
  .btn:hover {
    @apply opacity-95;
  }
  .btn:active {
    filter: brightness(0.98);
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm;
  }

  .card {
    @apply rounded-lg border border-gray-200 bg-white p-6 shadow-sm;
  }
  .card-muted {
    @apply rounded-lg border border-gray-100 bg-gray-50 p-6;
  }
}
```

---

## 1) Navigation

- Top bar (global actions), Breadcrumbs for deep screens.
- Keep side navigation optional until complexity grows. Prefer a simple tabs bar for module
  switching (Klienci, Produkty, Faktury, Raporty).

Tabs (unstyled minimal):

```tsx
function Tabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items = [
    { id: 'invoices', label: 'Faktury' },
    { id: 'clients', label: 'Klienci' },
    { id: 'products', label: 'Produkty' },
    { id: 'reports', label: 'Raporty' },
  ];
  return (
    <div role='tablist' aria-label='Sekcje' className='flex gap-1'>
      {items.map((t) => (
        <button
          key={t.id}
          role='tab'
          aria-selected={value === t.id}
          className={value === t.id ? 'btn' : 'btn-secondary'}
          onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

---

## 2) Cards & Empty states

Card container pattern:

```tsx
function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className='card text-center'>
      <div className='mx-auto mb-2 size-10 rounded-full bg-gray-100' aria-hidden />
      <h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
      <p className='mt-1 text-gray-600'>{desc}</p>
      {action ? <div className='mt-4'>{action}</div> : null}
    </div>
  );
}
```

Use for modules:

- Klienci: “Brak klientów — dodaj pierwszego klienta.”
- Produkty: “Brak produktów — dodaj pierwszy produkt.”
- Faktury: “Brak faktur — utwórz pierwszą fakturę.”

---

## 3) Forms (react-hook-form + zod)

Typical invoice forms: client selection, issue date, due date, currency, positions, VAT rate
presets.

Schema:

```ts
import { z } from 'zod';

export const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Wybierz produkt'),
  name: z.string().min(1, 'Nazwa'),
  quantity: z.number().positive('Ilość > 0'),
  unitPrice: z.number().nonnegative('Cena ≥ 0'),
  vatRate: z.number().min(0).max(1), // e.g. 0.23
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Wybierz klienta'),
  issueDate: z.string().min(1, 'Data wystawienia'),
  dueDate: z.string().min(1, 'Termin płatności'),
  currency: z.string().min(1, 'Waluta'),
  items: z.array(invoiceItemSchema).min(1, 'Dodaj co najmniej jedną pozycję'),
  notes: z.string().optional(),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;
```

Form rendering:

```tsx
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function InvoiceForm({ onSubmit }: { onSubmit: (data: InvoiceInput) => void }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { currency: 'PLN', items: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      {/* Client */}
      <div>
        <label className='block text-sm font-medium text-gray-900'>Klient</label>
        <input className='input' placeholder='clientId' {...register('clientId')} />
        {errors.clientId && <p className='mt-1 text-sm text-red-600'>{errors.clientId.message}</p>}
      </div>

      {/* Dates */}
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        <div>
          <label className='block text-sm font-medium text-gray-900'>Data wystawienia</label>
          <input type='date' className='input' {...register('issueDate')} />
          {errors.issueDate && (
            <p className='mt-1 text-sm text-red-600'>{errors.issueDate.message}</p>
          )}
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-900'>Termin płatności</label>
          <input type='date' className='input' {...register('dueDate')} />
          {errors.dueDate && <p className='mt-1 text-sm text-red-600'>{errors.dueDate.message}</p>}
        </div>
      </div>

      {/* Currency */}
      <div>
        <label className='block text-sm font-medium text-gray-900'>Waluta</label>
        <input className='input' {...register('currency')} />
        {errors.currency && <p className='mt-1 text-sm text-red-600'>{errors.currency.message}</p>}
      </div>

      {/* Items */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Pozycje</h3>
          <button
            type='button'
            className='btn-secondary'
            onClick={() =>
              append({ productId: '', name: '', quantity: 1, unitPrice: 0, vatRate: 0.23 })
            }>
            Dodaj pozycję
          </button>
        </div>

        <div className='space-y-3'>
          {fields.map((f, i) => (
            <div key={f.id} className='grid grid-cols-1 gap-3 md:grid-cols-5'>
              <input
                className='input'
                placeholder='Produkt ID'
                {...register(`items.${i}.productId` as const)}
              />
              <input
                className='input'
                placeholder='Nazwa'
                {...register(`items.${i}.name` as const)}
              />
              <input
                type='number'
                step='1'
                className='input'
                placeholder='Ilość'
                {...register(`items.${i}.quantity` as const, { valueAsNumber: true })}
              />
              <input
                type='number'
                step='0.01'
                className='input'
                placeholder='Cena netto'
                {...register(`items.${i}.unitPrice` as const, { valueAsNumber: true })}
              />
              <input
                type='number'
                step='0.01'
                className='input'
                placeholder='VAT (np. 0.23)'
                {...register(`items.${i}.vatRate` as const, { valueAsNumber: true })}
              />
              <div className='md:col-span-5'>
                <button type='button' className='btn-secondary' onClick={() => remove(i)}>
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
        {errors.items && (
          <p className='mt-1 text-sm text-red-600'>{errors.items.message as string}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className='block text-sm font-medium text-gray-900'>Uwagi</label>
        <textarea className='input min-h-24' {...register('notes')} />
      </div>

      <div className='flex justify-end gap-2'>
        <button type='button' className='btn-secondary'>
          Anuluj
        </button>
        <button type='submit' className='btn'>
          Zapisz
        </button>
      </div>
    </form>
  );
}
```

SCSS utility for inputs:

```scss
@layer components {
  .input {
    @apply w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-0 outline-none;
  }
  .input:focus {
    @apply border-gray-400;
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-brand) 20%, transparent);
  }
}
```

---

## 4) Dialogs & Popovers (Headless UI)

Modal (Dialog):

```tsx
import { Dialog } from '@headlessui/react';

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} className='relative z-50'>
      <div className='fixed inset-0 bg-black/30' aria-hidden='true' />
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <Dialog.Panel className='w-full max-w-lg rounded-lg bg-white p-6 shadow-xl'>
          <Dialog.Title className='text-base font-semibold text-gray-900'>{title}</Dialog.Title>
          <div className='mt-3'>{children}</div>
          <div className='mt-6 flex justify-end gap-2'>
            <button className='btn-secondary' onClick={onClose}>
              Anuluj
            </button>
            <button className='btn'>Zapisz</button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
```

Dropdown (Menu) or Command palette (Combobox) can be added similarly with Headless UI components.

---

## 5) Lists & Tables

Invoice list (table on desktop, cards on mobile):

```tsx
function InvoiceRow({
  inv,
}: {
  inv: { number: string; client: string; total: string; status: 'paid' | 'unpaid'; date: string };
}) {
  return (
    <tr className='border-b last:border-none'>
      <td className='px-3 py-3 text-sm text-gray-900'>{inv.number}</td>
      <td className='px-3 py-3 text-sm text-gray-700'>{inv.client}</td>
      <td className='px-3 py-3 text-sm'>{inv.total}</td>
      <td className='px-3 py-3 text-sm'>
        <span
          className={
            inv.status === 'paid'
              ? 'rounded-full bg-green-100 px-2 py-0.5 text-green-700'
              : 'rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700'
          }>
          {inv.status === 'paid' ? 'Opłacona' : 'Nieopłacona'}
        </span>
      </td>
      <td className='px-3 py-3 text-sm text-gray-500'>{inv.date}</td>
      <td className='px-3 py-3 text-right text-sm'>
        <button className='btn-secondary'>Szczegóły</button>
      </td>
    </tr>
  );
}

function InvoiceTable({ data }: { data: Array<any> }) {
  return (
    <div className='card p-0'>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-left'>
          <thead className='border-b bg-gray-50 text-xs text-gray-500'>
            <tr>
              <th className='px-3 py-2'>Numer</th>
              <th className='px-3 py-2'>Klient</th>
              <th className='px-3 py-2'>Kwota</th>
              <th className='px-3 py-2'>Status</th>
              <th className='px-3 py-2'>Data</th>
              <th className='px-3 py-2 text-right'>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {data.map((inv) => (
              <InvoiceRow key={inv.number} inv={inv} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

Pagination (simple):

```tsx
function Pager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className='mt-3 flex items-center justify-end gap-2'>
      <button className='btn-secondary' disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Poprzednia
      </button>
      <span className='text-sm text-gray-600'>
        {page} / {totalPages}
      </span>
      <button
        className='btn-secondary'
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}>
        Następna
      </button>
    </div>
  );
}
```

---

## 6) Icons (lucide-react)

```tsx
import { Plus, Download, FileText } from 'lucide-react';

<button className="btn"><Plus className="mr-2 size-4" /> Nowa faktura</button>
<button className="btn-secondary"><Download className="mr-2 size-4" /> Eksport</button>
<button className="btn-secondary"><FileText className="mr-2 size-4" /> PDF</button>
```

---

## 7) Loading & Feedback

Skeleton:

```tsx
function SkeletonRow() {
  return <div className='h-8 animate-pulse rounded-md bg-gray-200' />;
}
```

Non-invasive toast substitute (aria-live):

```tsx
function LiveRegion() {
  return <div aria-live='polite' aria-atomic='true' className='sr-only' id='live-region' />;
}
function announce(msg: string) {
  const el = document.getElementById('live-region');
  if (el) {
    el.textContent = '';
    setTimeout(() => (el.textContent = msg), 50);
  }
}
```

---

## 8) Data & API (React Query + Supabase)

Query for clients:

```ts
import { createClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
```

Mutation example:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; vatId?: string }) => {
      const { data, error } = await supabase.from('clients').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
```

---

## 9) PDF Export (jspdf + autotable)

Basic invoice table export:

```ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportInvoicePDF(inv: {
  number: string;
  client: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; vatRate: number }>;
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(12);
  doc.text(`Faktura: ${inv.number}`, 40, 40);
  doc.text(`Klient: ${inv.client}`, 40, 60);

  const rows = inv.items.map((i) => [
    i.name,
    i.quantity.toString(),
    i.unitPrice.toFixed(2),
    `${(i.vatRate * 100).toFixed(0)}%`,
    (i.quantity * i.unitPrice * (1 + i.vatRate)).toFixed(2),
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Nazwa', 'Ilość', 'Cena', 'VAT', 'Brutto']],
    body: rows,
    styles: { fontSize: 10 },
    theme: 'striped',
  });

  doc.save(`${inv.number}.pdf`);
}
```

---

## 10) Print (react-to-print)

```tsx
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

function InvoicePrintable({ invoice }: { invoice: any }) {
  return (
    <div className='p-8'>
      <h1 className='text-xl font-semibold'>Faktura {invoice.number}</h1>
      {/* ... */}
    </div>
  );
}

export function PrintInvoiceButton({ invoice }: { invoice: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ content: () => ref.current });

  return (
    <>
      <div className='hidden print:block'>
        <div ref={ref}>
          <InvoicePrintable invoice={invoice} />
        </div>
      </div>
      <button className='btn-secondary' onClick={handlePrint}>
        Drukuj
      </button>
    </>
  );
}
```

---

## 11) Accessibility quick wins

- Labels for all inputs, associate with `htmlFor`.
- ARIA roles only when necessary; use native semantics first.
- Focus states visible; avoid `outline: none` unless replaced.
- Proper color contrast; leverage `text-gray-900` over lighter grays.
- Dialogs trap focus; Headless UI handles this by default.
- Live region for async updates (see “Loading & Feedback”).

---

## 12) Responsive patterns

- Grid responsive switches:
  - `grid-cols-1 md:grid-cols-2 3xl:grid-cols-4` (3xl from `@theme`)
- Spacing scale from theme: prefer consistent paddings (e.g., `p-4`, `p-6` on containers)
- Don’t shrink tap targets: keep buttons ≥ 36–40px height.

---

## 13) Theming hooks (Tailwind v4 tokens)

Use `@theme` variables to define brand tokens in SCSS:

```scss
@theme {
  --color-brand: oklch(69% 0.15 248);
  --radius-xl: 1rem;
  --breakpoint-3xl: 120rem;
}
```

And use them by utilities:

- `bg-brand`, `text-brand`, `rounded-xl`, responsive `3xl:*`

---

## 14) Common patterns per module (based on plan)

- Klienci:
  - List: sortable table (Name, VAT ID, City, Actions)
  - Form: name, vatId, address with validation (zod)
  - Actions: add, edit (Dialog), archive
- Produkty:
  - List: table (Name, SKU, Net, VAT, Gross)
  - Form: name, price net, VAT preset (%), unit (pcs/h)
- Faktury:
  - Form: client select, issue/due dates, currency, items, notes
  - List: table with status chips (paid/unpaid), total, date
  - Export: PDF (jspdf), Print (react-to-print)
- Raporty:
  - Period filters (date range), summary cards (sum net, sum VAT, sum gross)
  - Table export CSV (optional later)

---

## 15) Utility snippets

Search input:

```tsx
<input className='input' placeholder='Szukaj...' aria-label='Szukaj' />
```

Filter pill:

```tsx
<span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700'>
  VAT 23%
  <button className='rounded-full p-0.5 hover:bg-gray-200' aria-label='Usuń filtr'>
    ×
  </button>
</span>
```

Inline help:

```tsx
<p className='text-xs text-gray-500'>Kwoty netto — VAT dodawany według stawki pozycji.</p>
```

---

## 16) Notes

- Keep components small and composable.
- Prefer controlled form inputs via react-hook-form Controller when needed (masked inputs later).
- Avoid premature abstraction; extract only repeated patterns (Button, Card, FormRow).
- Defer complex UI (typeahead search, virtualized lists) until necessary.
