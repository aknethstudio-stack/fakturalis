/**
 * KSeF Connection API Route
 * Connects user's KSeF portal credentials to InvoiceForge
 */

import { ksefClient } from '@/lib/ksef/client';
import { logger } from '@/lib/logger';
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMiddleware = createRateLimitMiddleware('critical');

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

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

    const { nip, ksefLogin, ksefPassword } = await request.json();

    if (!nip || !ksefLogin || !ksefPassword) {
      return NextResponse.json({ error: 'Brak wymaganych danych (NIP, login, hasło)' }, { status: 400 });
    }

    // Validate NIP format
    const cleanNIP = nip.replace(/[-\s]/g, '');
    if (!/^\d{10}$/.test(cleanNIP)) {
      return NextResponse.json({ error: 'Nieprawidłowy format NIP' }, { status: 400 });
    }

    try {
      // Test connection with user's KSeF credentials
      const session = await ksefClient.initSessionWithCredentials(cleanNIP, ksefLogin, ksefPassword);

      // Encrypt and save credentials to database
      const encryptedPassword = await encryptPassword(ksefPassword);

      const { error: saveError } = await supabase.from('ksef_config').upsert({
        owner_id: user.id,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'demo',
        identifier: cleanNIP,
        ksef_login: ksefLogin,
        ksef_password: encryptedPassword,
        active: true,
      });

      if (saveError) {
        logger.error('Failed to save KSeF config', saveError, {
          endpoint: '/api/ksef/connect',
          userId: user.id,
          nip: cleanNIP,
        });
        return NextResponse.json({ error: 'Błąd podczas zapisywania konfiguracji KSeF' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'KSeF połączony pomyślnie!',
        data: {
          nip: cleanNIP,
          sessionValid: true,
          expiresAt: session.expiresAt,
        },
      });
    } catch (ksefError) {
      // KSeF authentication failed
      return NextResponse.json(
        {
          error: 'Błąd połączenia z KSeF',
          details: ksefError instanceof Error ? ksefError.message : 'Sprawdź dane logowania',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    logger.error('KSeF connection error', error, {
      endpoint: '/api/ksef/connect',
      method: 'POST',
    });

    return NextResponse.json(
      {
        error: 'Błąd serwera podczas łączenia z KSeF',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 },
    );
  }
}

/**
 * Simple password encryption (replace with proper encryption in production)
 */
async function encryptPassword(password: string): Promise<string> {
  // In production, use proper encryption with process.env.ENCRYPTION_KEY
  return Buffer.from(password).toString('base64');
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;

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

    // Get user's KSeF configuration
    const { data: config, error: configError } = await supabase
      .from('ksef_config')
      .select('identifier, active, created_at')
      .eq('owner_id', user.id)
      .eq('active', true)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Błąd podczas pobierania konfiguracji KSeF' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      connected: !!config,
      data: config
        ? {
            nip: config.identifier,
            connectedAt: config.created_at,
          }
        : null,
    });
  } catch (error) {
    logger.error('KSeF config check error', error, {
      endpoint: '/api/ksef/connect',
      method: 'GET',
    });

    return NextResponse.json(
      {
        error: 'Błąd serwera',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 },
    );
  }
}
