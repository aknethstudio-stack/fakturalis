/**
 * KSeF Connection API Route
 * Connects user's KSeF portal credentials to Fakturalis
 */

import { encryptString } from '@/lib/crypto';
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

    const { nip, ksefLogin, ksefPassword, certificate_content, certificate_password } = await request.json();

    if (!nip) {
      return NextResponse.json({ error: 'Brak NIPu' }, { status: 400 });
    }

    const hasLogin = !!ksefLogin && !!ksefPassword;
    const hasCert = !!certificate_content && !!certificate_password;

    if (!hasLogin && !hasCert) {
      return NextResponse.json({ error: 'Podaj login i hasło KSeF albo załaduj certyfikat z hasłem' }, { status: 400 });
    }

    // Validate NIP format
    const cleanNIP = nip.replace(/[-\s]/g, '');
    if (!/^\d{10}$/.test(cleanNIP)) {
      return NextResponse.json({ error: 'Nieprawidłowy format NIP' }, { status: 400 });
    }

    try {
      let session;
      const configPayload: Record<string, unknown> = {
        owner_id: user.id,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'demo',
        identifier: cleanNIP,
        active: true,
      };

      // Prefer certificate-based flow if certificate content provided
      if (certificate_content && certificate_password) {
        // certificate_content is expected as base64 (client sends file as base64)
        // Test session with certificate
        session = await ksefClient.initSessionWithCertificate(cleanNIP, certificate_content, certificate_password);

        // Encrypt and save certificate + password
        const encryptedCert = encryptString(certificate_content);
        const encryptedCertPwd = encryptString(certificate_password);
        configPayload.certificate_content = encryptedCert;
        configPayload.certificate_password = encryptedCertPwd;
      } else {
        // Test connection with user's KSeF credentials
        session = await ksefClient.initSessionWithCredentials(cleanNIP, ksefLogin, ksefPassword);

        // Encrypt and save credentials to database
        const encryptedPassword = await encryptPassword(ksefPassword);
        configPayload.ksef_login = ksefLogin;
        configPayload.ksef_password = encryptedPassword;
      }

      const { error: saveError } = await supabase.from('ksef_config').upsert(configPayload);

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
          expiresAt: session?.expiresAt,
        },
      });
    } catch (ksefError) {
      // KSeF authentication failed
      logger.error('KSeF connection error during init', ksefError as Error, {
        endpoint: '/api/ksef/connect',
        userId: (await await createRouteHandlerClient({ cookies }).auth.getUser()).data.user?.id,
      });
      return NextResponse.json(
        {
          error: 'Błąd połączenia z KSeF',
          details: ksefError instanceof Error ? ksefError.message : 'Sprawdź dane logowania lub poprawność certyfikatu',
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
 * Password encryption using AES-256-GCM helper
 *
 * Requirements:
 * - Set ENCRYPTION_KEY env variable to a base64-encoded 32-byte key.
 */
async function encryptPassword(password: string): Promise<string> {
  // Use AES-256-GCM encryptString from lib/crypto
  return encryptString(password);
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
