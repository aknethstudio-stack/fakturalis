/**
 * KSeF Invoice Submission API Route
 * Handles submitting invoices to Polish National e-Invoice System
 */

import { decryptString } from '@/lib/crypto';
import { ksefClient } from '@/lib/ksef/client';
import type { KSeFInvoiceXML } from '@/lib/ksef/types';
import { logger } from '@/lib/logger';
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMiddleware = createRateLimitMiddleware('critical');

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult) return rateLimitResult;

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
      seller: await (async () => {
        // Default/fallback values (kept as sensible defaults)
        let sellerName = 'Twoja Firma';
        let sellerVatId = '1234567890';
        let sellerAddress = 'Adres sprzedawcy';

        try {
          // Try to read user's KSeF configuration (contains identifier/NIP)
          const { data: ksefConfig } = await supabase
            .from('ksef_config')
            .select('identifier')
            .eq('owner_id', user.id)
            .eq('active', true)
            .single();

          if (ksefConfig && ksefConfig.identifier) {
            // Enrich seller data from Polish registries (CEIDG/KRS/GUS)
            // Import dynamically to avoid adding top-level imports in this route
            const { polishRegistriesService } = await import('@/lib/polish-registries');
            const company = await polishRegistriesService.searchCompany(ksefConfig.identifier);

            if (company) {
              sellerName = company.name || sellerName;
              sellerVatId = company.nip || sellerVatId;

              const addrParts = [
                company.address.street,
                company.address.houseNumber,
                company.address.apartmentNumber ? '/' + company.address.apartmentNumber : undefined,
                company.address.postalCode,
                company.address.city,
              ].filter(Boolean);

              if (addrParts.length) {
                sellerAddress = addrParts.join(' ');
              }
            } else {
              // If registry lookup failed, at least use the configured identifier as VAT id
              sellerVatId = ksefConfig.identifier;
            }
          }
        } catch (err) {
          // Non-fatal: log and continue with fallbacks
          logger.warn('Failed to populate seller data from ksef_config/registries', {
            error: err instanceof Error ? err.message : String(err),
            endpoint: '/api/ksef/submit',
            userId: user.id,
          });
        }

        return {
          name: sellerName,
          vatId: sellerVatId,
          address: sellerAddress,
        };
      })(),
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

    // Initialize KSeF session (certificate preferred, fallback to login/password)
    try {
      // Read user's KSeF configuration (certificate or credentials)
      const { data: ksefConfig, error: ksefConfigError } = await supabase
        .from('ksef_config')
        .select('certificate_content, certificate_password, identifier, ksef_login, ksef_password, environment')
        .eq('owner_id', user.id)
        .eq('active', true)
        .single();

      if (ksefConfigError || !ksefConfig) {
        return NextResponse.json(
          { error: 'Brak konfiguracji KSeF (zaloguj się lub załaduj certyfikat w ustawieniach).' },
          { status: 400 },
        );
      }

      // If certificate provided, prefer certificate-based init
      if (ksefConfig.certificate_content) {
        let certBase64 = ksefConfig.certificate_content;
        let certPassword = ksefConfig.certificate_password || '';

        // Try to decrypt stored values (may be encrypted with AES helper), otherwise assume already base64/plaintext
        try {
          certBase64 = decryptString(certBase64);
        } catch {
          // keep as-is
        }
        try {
          certPassword = decryptString(certPassword);
        } catch {
          // keep as-is or empty
        }

        await ksefClient.initSessionWithCertificate(ksefConfig.identifier || '', certBase64, certPassword);
      } else if (ksefConfig.ksef_login && ksefConfig.ksef_password) {
        // Fallback to login/password flow
        let decryptedPwd = ksefConfig.ksef_password;
        try {
          decryptedPwd = decryptString(decryptedPwd);
        } catch {
          try {
            decryptedPwd = Buffer.from(String(decryptedPwd), 'base64').toString('utf8');
          } catch {
            // keep as-is
          }
        }

        await ksefClient.initSessionWithCredentials(ksefConfig.identifier || '', ksefConfig.ksef_login, decryptedPwd);
      } else {
        return NextResponse.json(
          { error: 'Brak danych autoryzacyjnych KSeF. Skonfiguruj u siebie login/hasło lub certyfikat.' },
          { status: 400 },
        );
      }
    } catch (sessionErr) {
      logger.error('KSeF session init error', sessionErr, { endpoint: '/api/ksef/submit', userId: user.id });
      return NextResponse.json(
        {
          error: 'Błąd podczas inicjacji sesji KSeF',
          details: sessionErr instanceof Error ? sessionErr.message : String(sessionErr),
        },
        { status: 500 },
      );
    }

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
