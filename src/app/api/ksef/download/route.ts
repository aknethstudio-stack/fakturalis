/**
 * KSeF UPO Download API Route
 * Downloads UPO (Urzędowe Potwierdzenie Odbioru) from Polish National e-Invoice System
 */

import { ksefClient } from '@/lib/ksef/client';
import { logger } from '@/lib/logger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    // Get submission from database to verify ownership
    const { data: submission, error: submissionError } = await supabase
      .from('ksef_submissions')
      .select('*')
      .eq('reference_number', referenceNumber)
      .eq('owner_id', user.id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submisja nie została znaleziona' }, { status: 404 });
    }

    // Check if submission is accepted
    if (submission.status !== 'accepted') {
      return NextResponse.json({ error: 'UPO dostępne tylko dla zaakceptowanych faktur' }, { status: 400 });
    }

    // Download UPO from KSeF
    const upo = await ksefClient.downloadUPO(referenceNumber);

    // Save UPO content to database
    const { error: updateError } = await supabase
      .from('ksef_submissions')
      .update({
        upo_content: upo.upoContent,
      })
      .eq('id', submission.id);

    if (updateError) {
      logger.error('Failed to save UPO content', updateError, {
        endpoint: '/api/ksef/download',
        referenceNumber,
        submissionId: submission.id,
        userId: user.id,
      });
    }

    // Decode Base64 UPO content for download
    const upoBuffer = Buffer.from(upo.upoContent, 'base64');

    return new NextResponse(upoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="UPO_${referenceNumber}.xml"`,
        'Content-Length': upoBuffer.length.toString(),
      },
    });
  } catch (error) {
    logger.error('KSeF UPO download error', error, {
      endpoint: '/api/ksef/download',
      method: 'GET',
    });

    return NextResponse.json(
      {
        error: 'Błąd podczas pobierania UPO',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 },
    );
  }
}
