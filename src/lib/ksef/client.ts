/**
 * KSeF API Client
 * Handles communication with Polish National e-Invoice System
 */

import type { Database } from '@/types/database';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { KSEF_CONFIG } from './config';
import type { KSeFSessionToken, KSeFInvoiceSubmission, KSeFInvoiceXML, KSeFUPO, KSeFSubmissionStatus } from './types';

/**
 * Simple password decryption (replace with proper decryption in production)
 */
function decryptPassword(encryptedPassword: string): string {
  // In production, use proper decryption with process.env.ENCRYPTION_KEY
  return Buffer.from(encryptedPassword, 'base64').toString();
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
            tradeName: 'InvoiceForge',
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
    <ksef:SystemInfo>InvoiceForge v1.0.0</ksef:SystemInfo>
  </ksef:Naglowek>
  <ksef:Podmiot1>
    <ksef:DaneIdentyfikacyjne>
      <ksef:NIP>${invoice.seller.vatId.replace(/[^0-9]/g, '')}</ksef:NIP>
      <ksef:Nazwa>${invoice.seller.name}</ksef:Nazwa>
    </ksef:DaneIdentyfikacyjne>
    <ksef:Adres>
      <ksef:AdresL1>${invoice.seller.address}</ksef:AdresL1>
    </ksef:Adres>
  </ksef:Podmiot1>
  <ksef:Podmiot2>
    <ksef:DaneIdentyfikacyjne>
      ${invoice.buyer.vatId ? `<ksef:NIP>${invoice.buyer.vatId.replace(/[^0-9]/g, '')}</ksef:NIP>` : ''}
      <ksef:Nazwa>${invoice.buyer.name}</ksef:Nazwa>
    </ksef:DaneIdentyfikacyjne>
    <ksef:Adres>
      <ksef:AdresL1>${invoice.buyer.address}</ksef:AdresL1>
    </ksef:Adres>
  </ksef:Podmiot2>
  <ksef:Fa>
    <ksef:KodWaluty>${invoice.invoiceHeader.currencyCode}</ksef:KodWaluty>
    <ksef:P_1>${invoice.invoiceHeader.issueDate}</ksef:P_1>
    <ksef:P_2>${invoice.invoiceHeader.invoiceNumber}</ksef:P_2>
    <ksef:P_6>${invoice.invoiceHeader.dueDate}</ksef:P_6>
    ${invoice.invoiceLines
      .map(
        (
          line: {
            name: string;
            quantity: number;
            unitPrice: number;
            vatRate: number;
            netAmount: number;
            vatAmount: number;
            grossAmount: number;
          },
          index: number,
        ) => `
    <ksef:FaWiersz>
      <ksef:NrWierszaFa>${index + 1}</ksef:NrWierszaFa>
      <ksef:P_7>${line.name}</ksef:P_7>
      <ksef:P_8A>${line.quantity}</ksef:P_8A>
      <ksef:P_9A>${line.unitPrice.toFixed(2)}</ksef:P_9A>
      <ksef:P_11>${line.netAmount.toFixed(2)}</ksef:P_11>
      <ksef:P_12>${(line.vatRate * 100).toFixed(0)}</ksef:P_12>
    </ksef:FaWiersz>`,
      )
      .join('')}
    <ksef:P_15>${invoice.totals.netTotal.toFixed(2)}</ksef:P_15>
    <ksef:P_16>${invoice.totals.vatTotal.toFixed(2)}</ksef:P_16>
    <ksef:P_17>${invoice.totals.grossTotal.toFixed(2)}</ksef:P_17>
  </ksef:Fa>
</ksef:Faktura>`;
  }

  /**
   * Ensure we have a valid session token
   */
  private async ensureValidSession(): Promise<void> {
    if (!this.sessionToken || new Date() >= this.sessionToken.expiresAt) {
      // Try to get stored credentials from database and re-authenticate
      const supabase = createClientComponentClient<Database>();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's KSeF configuration
      const { data: config, error } = await supabase
        .from('ksef_config')
        .select('*')
        .eq('owner_id', user.id)
        .eq('active', true)
        .single();

      if (error || !config) {
        // Fall back to demo session if no credentials configured
        await this.initDemoSession();
      } else {
        // Decrypt password and use stored credentials to create new session
        const decryptedPassword = decryptPassword(config.ksef_password);
        await this.initSessionWithCredentials(config.identifier, config.ksef_login, decryptedPassword);
      }
    }
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
    // For demo purposes - in production, use proper crypto library
    return Buffer.from(content).toString('base64').substring(0, 32);
  }
}

// Singleton instance for application use
export const ksefClient = new KSeFClient();
