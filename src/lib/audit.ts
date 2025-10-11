import { logger } from './logger';

// Typy zdarzeń do auditowania
export type AuditEventType =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.password_reset'
  | 'invoice.create'
  | 'invoice.update'
  | 'invoice.delete'
  | 'invoice.pdf_export'
  | 'client.create'
  | 'client.update'
  | 'client.delete'
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'data.export'
  | 'settings.update';

export interface AuditEvent {
  event_type: AuditEventType;
  user_id?: string | undefined;
  user_email?: string | undefined;
  ip_address?: string | undefined;
  user_agent?: string | undefined;
  resource_id?: string | undefined;
  resource_type?: string | undefined;
  details?: Record<string, unknown> | undefined;
  status: 'success' | 'failure' | 'error';
  error_message?: string | undefined;
  timestamp: string;
}

/**
 * Klasa do rejestrowania zdarzeń auditowych
 */
class AuditLogger {
  /**
   * Rejestruje zdarzenie auditowe
   * @param event - Dane zdarzenia
   */
  async logEvent(event: Omit<AuditEvent, 'timestamp'>) {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Loguj do Sentry jako info/error
    if (event.status === 'success') {
      logger.info('Audit event', auditEvent as unknown as Record<string, unknown>);
    } else {
      logger.error(
        'Audit event failed',
        new Error(event.error_message || 'Unknown error'),
        auditEvent as unknown as Record<string, unknown>,
      );
    }

    // TODO: W przyszłości można dodać zapis do dedykowanej tabeli audit_logs
    // await supabase.from('audit_logs').insert(auditEvent);
  }

  /**
   * Loguje zdarzenie autentykacji
   */
  async logAuth(
    type: 'login' | 'logout' | 'register' | 'password_reset',
    userId?: string,
    userEmail?: string,
    request?: Request,
    error?: string,
  ) {
    await this.logEvent({
      event_type: `auth.${type}` as AuditEventType,
      user_id: userId,
      user_email: userEmail,
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined,
      status: error ? 'failure' : 'success',
      error_message: error,
    });
  }

  /**
   * Loguje operacje na fakturach
   */
  async logInvoice(
    action: 'create' | 'update' | 'delete' | 'pdf_export',
    invoiceId: string,
    userId: string,
    request?: Request,
    details?: Record<string, unknown>,
    error?: string,
  ) {
    await this.logEvent({
      event_type: `invoice.${action}` as AuditEventType,
      user_id: userId,
      resource_id: invoiceId,
      resource_type: 'invoice',
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined,
      details,
      status: error ? 'error' : 'success',
      error_message: error,
    });
  }

  /**
   * Loguje operacje na klientach
   */
  async logClient(
    action: 'create' | 'update' | 'delete',
    clientId: string,
    userId: string,
    request?: Request,
    details?: Record<string, unknown>,
    error?: string,
  ) {
    await this.logEvent({
      event_type: `client.${action}` as AuditEventType,
      user_id: userId,
      resource_id: clientId,
      resource_type: 'client',
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined,
      details,
      status: error ? 'error' : 'success',
      error_message: error,
    });
  }

  /**
   * Loguje krytyczne operacje (eksport danych, etc.)
   */
  async logCritical(
    eventType: AuditEventType,
    userId: string,
    request?: Request,
    details?: Record<string, unknown>,
    error?: string,
  ) {
    await this.logEvent({
      event_type: eventType,
      user_id: userId,
      ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      user_agent: request?.headers.get('user-agent') || undefined,
      details,
      status: error ? 'error' : 'success',
      error_message: error,
    });
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

/**
 * Helper do logowania w API routes
 * @param request - Next.js Request object
 * @returns Extracted request info
 */
export function extractRequestInfo(request: Request) {
  return {
    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}
