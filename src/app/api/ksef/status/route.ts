/**
 * KSeF Status Check API Route
 * Checks submission status in Polish National e-Invoice System
 */

import { ksefClient } from '@/lib/ksef/client';
import { logger } from '@/lib/logger';
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMiddleware = createRateLimitMiddleware('api');

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const referenceNumber = searchParams.get('referenceNumber');

    if (!referenceNumber) {
      return NextResponse.json({ error: 'Brak numeru referencyjnego' }, { status: 400 });
    }

    // Get submission from database
    const { data: submission, error: submissionError } = await supabase
      .from('ksef_submissions')
      .select('*')
      .eq('reference_number', referenceNumber)
      .eq('owner_id', user.id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submisja nie została znaleziona' }, { status: 404 });
    }

    // Check status in KSeF
    const status = await ksefClient.getSubmissionStatus(referenceNumber);

    // Update submission status in database
    const updatedStatus =
      status.invoiceStatus === 'accepted'
        ? 'accepted'
        : status.invoiceStatus === 'rejected'
          ? 'rejected'
          : status.invoiceStatus === 'processing'
            ? 'pending'
            : 'error';

    const { error: updateError } = await supabase
      .from('ksef_submissions')
      .update({
        status: updatedStatus,
        processing_code: status.processingCode?.toString(),
        processing_description: status.processingDescription,
        upo_number: status.upoNumber,
        acquisition_timestamp: status.acquisitionTimestamp ? new Date(status.acquisitionTimestamp).toISOString() : null,
        response_data: status,
      })
      .eq('id', submission.id);

    if (updateError) {
      logger.error('Failed to update KSeF submission status', updateError, {
        endpoint: '/api/ksef/status',
        referenceNumber,
        submissionId: submission.id,
        userId: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        referenceNumber,
        status: status.invoiceStatus,
        processingCode: status.processingCode,
        processingDescription: status.processingDescription,
        upoNumber: status.upoNumber,
        acquisitionTimestamp: status.acquisitionTimestamp,
        localStatus: updatedStatus,
      },
    });
  } catch (error) {
    logger.error('KSeF status check error', error, {
      endpoint: '/api/ksef/status',
      method: 'GET',
    });

    return NextResponse.json(
      {
        error: 'Błąd podczas sprawdzania statusu KSeF',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 },
    );
  }
}
