/**
 * KSeF API Client
 * Handles communication with Polish National e-Invoice System
 */

import { decryptString } from '@/lib/crypto';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';
import { KSEF_CONFIG } from './config';
import type { KSeFInvoiceSubmission, KSeFInvoiceXML, KSeFSessionToken, KSeFSubmissionStatus, KSeFUPO } from './types';

/**
 * Decrypt stored KSeF password.
 * First try AES decryption helper (production), fallback to base64 decode for legacy entries.
 */
function _decryptPassword(encryptedPassword: string): string {
  try {
    // Prefer modern AES-GCM encrypted payloads (stored with lib/crypto helpers)
    return decryptString(encryptedPassword);
  } catch (_err) {
    // Fallback: legacy base64-encoded password (backwards compatibility)
    return Buffer.from(encryptedPassword, 'base64').toString();
  }
}

/**
 * Decrypt stored certificate payload (if encrypted with AES helper).
 * Returns the certificate content as base64 (plaintext P12/PFX base64) ready to be used in a session init.
 * If the stored value is already a base64 certificate (legacy / raw), returns it as-is.
 */
function _decryptCertificate(encryptedCert: string): string {
  try {
    return decryptString(encryptedCert);
  } catch (_err) {
    // If decrypt failed, assume the stored string is already base64 certificate content
    return encryptedCert;
  }
}

export class KSeFClient {
  private sessionToken: KSeFSessionToken | null = null;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = KSEF_CONFIG.apiUrl;
  }

  /**
   * Initialize KSeF session with user credentials
   * Uses entrepreneur's KSeF portal login (no certificates needed!)
   * @param nip - User's tax identification number
   * @param ksefLogin - User's login to KSeF portal
   * @param ksefPassword - User's password to KSeF portal
   */
  async initSessionWithCredentials(nip: string, ksefLogin: string, ksefPassword: string): Promise<KSeFSessionToken> {
    try {
      // Step 1: Authenticate with user's KSeF credentials
      const authResponse = await fetch(`${this.baseUrl}/online/Session/AuthorisationChallenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          contextIdentifier: {
            identifier: nip,
            type: 'onip', // On behalf of NIP
          },
        }),
      });

      if (!authResponse.ok) {
        throw new Error(`KSeF auth challenge failed: ${authResponse.statusText}`);
      }

      const authData = await authResponse.json();

      // Step 2: Init session with challenge token
      const response = await fetch(`${this.baseUrl}/online/Session/InitToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          contextIdentifier: {
            identifier: nip,
            type: 'onip',
          },
          contextName: {
            tradeName: 'Fakturalis',
            type: 'TradeName',
          },
          credentials: {
            identifier: ksefLogin,
            password: ksefPassword,
            type: 'credentials_plain', // Plain credentials (no certificate!)
          },
          challenge: authData.challenge,
        }),
      });

      if (!response.ok) {
        throw new Error(`KSeF session init failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionToken = {
        token: data.sessionToken,
        expiresAt: new Date(Date.now() + KSEF_CONFIG.limits.sessionTokenValidityHours * 60 * 60 * 1000),
        sessionId: data.sessionId,
      };

      return this.sessionToken;
    } catch (error) {
      throw new Error(`KSeF authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize KSeF session using user's certificate (P12/PFX).
   * Accepts certificate content as base64 (P12/PFX binary encoded to base64) and the certificate password.
   * The API used below assumes the KSeF endpoint accepts signed session init with certificate content.
   * Adjust endpoint/body according to the current MF/KSeF API if required.
   */
  async initSessionWithCertificate(
    nip: string,
    certificateBase64: string,
    certificatePassword?: string,
  ): Promise<KSeFSessionToken> {
    try {
      // Prefer server endpoint for signed init if available.
      // Many KSeF integrations initialize a signed session via /online/Session/InitSigned or similar.
      // We pass certificate content + optional password. The exact contract may vary by environment.
      const response = await fetch(`${this.baseUrl}/online/Session/InitSigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          identifier: nip,
          certificate: certificateBase64,
          certificatePassword: certificatePassword || null,
          contextName: {
            tradeName: 'Fakturalis',
            type: 'TradeName',
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        logger.error('KSeF InitSigned HTTP error', new Error(response.statusText), {
          status: response.status,
          body: text,
        });
        throw new Error(`KSeF certificate session init failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionToken = {
        token: data.sessionToken,
        expiresAt: new Date(Date.now() + KSEF_CONFIG.limits.sessionTokenValidityHours * 60 * 60 * 1000),
        sessionId: data.sessionId,
      };

      return this.sessionToken;
    } catch (error) {
      throw new Error(
        `KSeF certificate authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Allows setting a session token directly (useful when session is created outside the client)
   */
  public setSessionToken(token: string, expiresAt: Date, sessionId?: string) {
    this.sessionToken = { token, expiresAt, sessionId: sessionId || '' };
  }

  /**
   * Initialize demo session (for testing without real credentials)
   */
  async initDemoSession(): Promise<KSeFSessionToken> {
    try {
      const response = await fetch(`${this.baseUrl}/online/Session/InitSigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          identifier: process.env.KSEF_DEMO_IDENTIFIER || 'demo_user',
          challenge: this.generateChallenge(),
        }),
      });

      if (!response.ok) {
        throw new Error(`KSeF demo session init failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionToken = {
        token: data.sessionToken,
        expiresAt: new Date(Date.now() + KSEF_CONFIG.limits.sessionTokenValidityHours * 60 * 60 * 1000),
        sessionId: data.sessionId,
      };

      return this.sessionToken;
    } catch (error) {
      throw new Error(`KSeF demo authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit invoice to KSeF system
   * Converts invoice data to required XML format and sends to API
   */
  async submitInvoice(invoiceXML: KSeFInvoiceXML): Promise<KSeFInvoiceSubmission> {
    await this.ensureValidSession();

    try {
      const xmlContent = this.generateFAVATXML(invoiceXML);
      const base64XML = Buffer.from(xmlContent).toString('base64');

      const response = await fetch(`${this.baseUrl}/online/Invoice/Send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          SessionToken: this.sessionToken!.token,
        },
        body: JSON.stringify({
          invoicePayload: {
            invoiceBody: base64XML,
            invoiceHash: this.calculateSHA256(xmlContent),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Invoice submission failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        submissionId: data.elementReferenceNumber,
        referenceNumber: data.referenceNumber,
        processingCode: data.processingCode,
        timestamp: data.timestamp,
      };
    } catch (error) {
      throw new Error(`Invoice submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check submission status in KSeF system
   */
  async getSubmissionStatus(referenceNumber: string): Promise<KSeFSubmissionStatus> {
    await this.ensureValidSession();

    try {
      const response = await fetch(`${this.baseUrl}/online/Invoice/Status/${referenceNumber}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          SessionToken: this.sessionToken!.token,
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Return full status object
      return {
        invoiceStatus: data.invoiceStatus || 'processing',
        acquisitionTimestamp: data.acquisitionTimestamp,
        processingCode: data.processingCode,
        processingDescription: data.processingDescription,
        upoNumber: data.upoNumber,
      };
    } catch (error) {
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download UPO (Urzędowe Potwierdzenie Odbioru) - Official Receipt
   */
  async downloadUPO(referenceNumber: string): Promise<KSeFUPO> {
    await this.ensureValidSession();

    try {
      const response = await fetch(`${this.baseUrl}/online/Invoice/Get/${referenceNumber}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          SessionToken: this.sessionToken!.token,
        },
      });

      if (!response.ok) {
        throw new Error(`UPO download failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        referenceNumber,
        timestamp: data.timestamp,
        upoContent: data.invoiceBody, // Base64 encoded UPO XML
      };
    } catch (error) {
      throw new Error(`UPO download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate FA_VAT XML format required by KSeF
   * Converts invoice data to standardized XML structure
   */
  private generateFAVATXML(invoice: KSeFInvoiceXML): string {
    const { xmlNamespaces } = KSEF_CONFIG;

    const escapeXml = (value?: string | number | null): string => {
      if (value === undefined || value === null) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const formatVatRate = (rate: number | undefined): string => {
      if (rate === undefined || rate === null || Number.isNaN(Number(rate))) return '';
      const numeric = Number(rate);
      // Accept both 0.23 or 23 formats
      const fraction = Math.abs(numeric) > 1 ? numeric / 100 : numeric;
      return Math.round(fraction * 100).toFixed(0);
    };

    const sellerNip = invoice.seller.vatId ? invoice.seller.vatId.replace(/[^0-9]/g, '') : '';
    const sellerName = escapeXml(invoice.seller.name);
    const sellerAddress = escapeXml(invoice.seller.address);

    const buyerNip = invoice.buyer.vatId ? invoice.buyer.vatId.replace(/[^0-9]/g, '') : '';
    const buyerName = escapeXml(invoice.buyer.name);
    const buyerAddress = escapeXml(invoice.buyer.address);

    const linesXml = invoice.invoiceLines
      .map((line, index: number) => {
        const lineName = escapeXml(line.name);
        const qty = Number(line.quantity ?? 0);
        const unitPrice = Number(line.unitPrice ?? 0);
        const netAmount = Number(line.netAmount ?? 0);
        const vatRateFormatted = formatVatRate(line.vatRate ?? undefined);

        return `
    <ksef:FaWiersz>
      <ksef:NrWierszaFa>${index + 1}</ksef:NrWierszaFa>
      <ksef:P_7>${lineName}</ksef:P_7>
      <ksef:P_8A>${qty}</ksef:P_8A>
      <ksef:P_9A>${Number(unitPrice).toFixed(2)}</ksef:P_9A>
      <ksef:P_11>${Number(netAmount).toFixed(2)}</ksef:P_11>
      <ksef:P_12>${vatRateFormatted}</ksef:P_12>
    </ksef:FaWiersz>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<ksef:Faktura
  xmlns:fahash="${xmlNamespaces.fahash}"
  xmlns:tns="${xmlNamespaces.tns}"
  xmlns:xsi="${xmlNamespaces.xsi}"
  xmlns:ksef="${xmlNamespaces.ksef}">
  <ksef:Naglowek>
    <ksef:KodFormularza kodSystemowy="FA(2)" wersjaSchemy="1-0E"/>
    <ksef:WariantFormularza>2</ksef:WariantFormularza>
    <ksef:DataWytworzeniaFa>${new Date().toISOString()}</ksef:DataWytworzeniaFa>
    <ksef:SystemInfo>Fakturalis v1.0.0</ksef:SystemInfo>
  </ksef:Naglowek>
  <ksef:Podmiot1>
    <ksef:DaneIdentyfikacyjne>
      <ksef:NIP>${escapeXml(sellerNip)}</ksef:NIP>
      <ksef:Nazwa>${sellerName}</ksef:Nazwa>
    </ksef:DaneIdentyfikacyjne>
    <ksef:Adres>
      <ksef:AdresL1>${sellerAddress}</ksef:AdresL1>
    </ksef:Adres>
  </ksef:Podmiot1>
  <ksef:Podmiot2>
    <ksef:DaneIdentyfikacyjne>
      ${buyerNip ? `<ksef:NIP>${escapeXml(buyerNip)}</ksef:NIP>` : ''}
      <ksef:Nazwa>${buyerName}</ksef:Nazwa>
    </ksef:DaneIdentyfikacyjne>
    <ksef:Adres>
      <ksef:AdresL1>${buyerAddress}</ksef:AdresL1>
    </ksef:Adres>
  </ksef:Podmiot2>
  <ksef:Fa>
    <ksef:KodWaluty>${escapeXml(invoice.invoiceHeader.currencyCode)}</ksef:KodWaluty>
    <ksef:P_1>${escapeXml(invoice.invoiceHeader.issueDate)}</ksef:P_1>
    <ksef:P_2>${escapeXml(invoice.invoiceHeader.invoiceNumber)}</ksef:P_2>
    <ksef:P_6>${escapeXml(invoice.invoiceHeader.dueDate)}</ksef:P_6>
    ${linesXml}
    <ksef:P_15>${Number(invoice.totals.netTotal).toFixed(2)}</ksef:P_15>
    <ksef:P_16>${Number(invoice.totals.vatTotal).toFixed(2)}</ksef:P_16>
    <ksef:P_17>${Number(invoice.totals.grossTotal).toFixed(2)}</ksef:P_17>
  </ksef:Fa>
</ksef:Faktura>`;
  }

  /**
   * Ensure we have a valid session token
   */
  private async ensureValidSession(): Promise<void> {
    // Simplified: the client does not perform automatic server-side authentication.
    // Caller must initialize a session explicitly (initSessionWithCredentials or initDemoSession)
    // or set `this.sessionToken` via other means.
    if (this.sessionToken && new Date() < this.sessionToken.expiresAt) {
      return;
    }

    throw new Error(
      'KSeF session not initialized or expired. Call initSessionWithCredentials(identifier, login, password) or initDemoSession() before performing submissions.',
    );
  }

  /**
   * Generate authentication challenge for demo environment
   */
  private generateChallenge(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Calculate SHA-256 hash for XML content
   */
  private calculateSHA256(content: string): string {
    // Proper SHA-256, encoded as base64 (preferred by KSeF in many examples).
    // If KSeF expects hex instead, change 'base64' to 'hex' here.
    return createHash('sha256').update(content, 'utf8').digest('base64');
  }
}

// Singleton instance for application use
export const ksefClient = new KSeFClient();
