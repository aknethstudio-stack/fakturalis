/**
 * KSeF Invoice Submission API Route
 * Handles submitting invoices to Polish National e-Invoice System
 */

import { ksefClient } from '@/lib/ksef/client';
import type { KSeFInvoiceXML } from '@/lib/ksef/types';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Nieautoryzowany dostęp' }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Brak ID faktury' }, { status: 400 });
    }

    // Get invoice with client and items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(
        `
        *,
        client:clients(*),
        invoice_items(*)
      `,
      )
      .eq('id', invoiceId)
      .eq('owner_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Faktura nie została znaleziona' }, { status: 404 });
    }

    // Check if invoice is already submitted
    if (invoice.ksef_status === 'accepted') {
      return NextResponse.json({ error: 'Faktura została już wysłana do KSeF' }, { status: 400 });
    }

    // Convert invoice to KSeF XML format
    const ksefInvoiceXML: KSeFInvoiceXML = {
      invoiceHeader: {
        invoiceNumber: invoice.number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        currencyCode: invoice.currency,
      },
      seller: {
        name: 'Twoja Firma', // TODO: Get from user profile/settings
        vatId: '1234567890', // TODO: Get from user profile/settings
        address: 'Adres sprzedawcy', // TODO: Get from user profile/settings
      },
      buyer: {
        name: invoice.client.name,
        vatId: invoice.client.vat_id || undefined,
        address: [
          invoice.client.address_line1,
          invoice.client.address_line2,
          invoice.client.postal_code,
          invoice.client.city,
        ]
          .filter(Boolean)
          .join(', '),
      },
      invoiceLines: invoice.invoice_items.map(
        (item: {
          name: string;
          quantity: number;
          unit_price: number;
          vat_rate: number;
          line_net: number;
          line_vat: number;
          line_gross: number;
        }) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          vatRate: item.vat_rate,
          netAmount: item.line_net,
          vatAmount: item.line_vat,
          grossAmount: item.line_gross,
        }),
      ),
      totals: {
        netTotal: invoice.subtotal_net,
        vatTotal: invoice.total_vat,
        grossTotal: invoice.total_gross,
      },
    };

    // Submit to KSeF
    const submission = await ksefClient.submitInvoice(ksefInvoiceXML);

    // Save submission to database
    const { data: _ksefSubmission, error: submissionError } = await supabase
      .from('ksef_submissions')
      .insert({
        invoice_id: invoiceId,
        submission_id: submission.submissionId,
        reference_number: submission.referenceNumber,
        status: 'pending',
        processing_code: submission.processingCode.toString(),
        response_data: submission,
      })
      .select()
      .single();

    if (submissionError) {
      logger.error('Failed to save KSeF submission', submissionError, {
        endpoint: '/api/ksef/submit',
        invoiceId,
        submissionId: submission.submissionId,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Błąd podczas zapisywania submisji KSeF' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.submissionId,
        referenceNumber: submission.referenceNumber,
        processingCode: submission.processingCode,
        timestamp: submission.timestamp,
      },
    });
  } catch (error) {
    logger.error('KSeF submission error', error, {
      endpoint: '/api/ksef/submit',
      method: 'POST',
    });

    return NextResponse.json(
      {
        error: 'Błąd podczas wysyłania faktury do KSeF',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 },
    );
  }
}
