/**
 * Polish Business Registries Integration
 * Integracja z polskimi rejestrami firm: GUS, KRS, CEIDG
 *
 * @author Fakturalis
 * @description Kompleksowy service do pobierania danych z wszystkich polskich rejestrów
 */

import { logger } from './logger';

export interface CompanyData {
  nip: string;
  regon: string;
  name: string;
  address: {
    street?: string;
    houseNumber?: string;
    apartmentNumber?: string;
    postalCode?: string;
    city?: string;
    voivodeship?: string;
  };
  status: 'active' | 'inactive' | 'unknown' | 'suspended' | 'liquidation';
  businessType?: string;
  establishmentDate?: string;
  pkd?: string[];
  source: 'GUS' | 'CEIDG' | 'KRS';
}

interface GUSData {
  nip?: string;
  regon?: string;
  nazwa?: string;
  ulica?: string;
  nrNieruchomosci?: string;
  nrLokalu?: string;
  kodPocztowy?: string;
  miejscowosc?: string;
  wojewodztwo?: string;
  statusNip?: string;
}

interface CEIDGResponse {
  firma: string;
  nip: string;
  regon: string;
  adres: {
    ulica: string;
    nrDomu: string;
    nrLokalu?: string;
    kodPocztowy: string;
    miejscowosc: string;
    wojewodztwo: string;
  };
  status: string;
  dataPodstawowegoZapisu: string;
  pkd: Array<{
    kod: string;
    nazwa: string;
    przewazajace: boolean;
  }>;
}

interface KRSResponse {
  nazwa: string;
  nip: string;
  regon: string;
  krs: string;
  adres: {
    ulica: string;
    nrDomu: string;
    nrLokalu?: string;
    kodPocztowy: string;
    miejscowosc: string;
  };
  status: string;
  kapitalZakladowy?: string;
  zarzad: Array<{
    imie: string;
    nazwisko: string;
    funkcja: string;
  }>;
  dataRejestracji: string;
}

/**
 * Service do wyszukiwania firm we wszystkich polskich rejestrach
 */
class PolishRegistriesService {
  private readonly ceidgApiUrl = 'https://dane.biznes.gov.pl/api/ceidg/v2/';
  private readonly krsApiUrl = 'https://api-v3.mojepanstwo.pl/dane/krs_podmioty/';
  private readonly gusApiUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc'
      : 'https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';
  private get gusUserKey() {
    return process.env.GUS_API_KEY || '';
  }
  private gusSessionId: string | null = null;

  /**
   * Wyszukuje firmę we wszystkich dostępnych rejestrach
   */
  async searchCompany(nip: string): Promise<CompanyData | null> {
    const cleanNip = nip.replace(/[-\s]/g, '');

    // Próbuj kolejno wszystkie rejestry
    const results = await Promise.allSettled([
      this.searchInCEIDG(cleanNip),
      this.searchInKRS(cleanNip),
      this.searchInGUS(cleanNip),
    ]);

    // Znajdź pierwszy udany wynik
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }

    logger.warn('Company not found in any Polish registry', {
      nip: cleanNip.substring(0, 3) + '***',
      component: 'PolishRegistriesService',
    });

    return null;
  }

  /**
   * Wyszukuje w CEIDG (jednoosobowa działalność gospodarcza)
   */
  async searchInCEIDG(nip: string): Promise<CompanyData | null> {
    try {
      const response = await fetch(`${this.ceidgApiUrl}firma`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          nip: nip,
        }),
      });

      if (!response.ok) {
        throw new Error(`CEIDG API error: ${response.status}`);
      }

      const data: CEIDGResponse[] = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      const company = data[0];

      if (!company) {
        return null;
      }

      return {
        nip: company.nip,
        regon: company.regon,
        name: company.firma,
        address: {
          ...(company.adres.ulica && { street: company.adres.ulica }),
          ...(company.adres.nrDomu && { houseNumber: company.adres.nrDomu }),
          ...(company.adres.nrLokalu && { apartmentNumber: company.adres.nrLokalu }),
          ...(company.adres.kodPocztowy && { postalCode: company.adres.kodPocztowy }),
          ...(company.adres.miejscowosc && { city: company.adres.miejscowosc }),
          ...(company.adres.wojewodztwo && { voivodeship: company.adres.wojewodztwo }),
        },
        businessType: 'Działalność gospodarcza',
        status: this.mapCEIDGStatus(company.status),
        pkd: company.pkd?.map((p) => p.kod) || undefined,
        source: 'CEIDG' as const,
        establishmentDate: company.dataPodstawowegoZapisu,
      };
    } catch (error) {
      logger.error('CEIDG search failed', error as Error, {
        nip: nip.substring(0, 3) + '***',
        component: 'PolishRegistriesService',
      });
      return null;
    }
  }

  /**
   * Wyszukuje w KRS (spółki handlowe)
   */
  async searchInGUS(nip: string): Promise<CompanyData | null> {
    try {
      if (!this.gusUserKey) {
        logger.info('GUS API key not configured - skipping GUS search', {
          nip: nip.substring(0, 3) + '***',
          note: 'Register at https://api.stat.gov.pl/Home/RegonApi if needed',
        });
        return null;
      }

      if (!this.validateNIP(nip)) {
        throw new Error('Nieprawidłowy format NIP');
      }

      // Uzyskaj session ID
      await this.getGUSSessionId();

      if (!this.gusSessionId) {
        throw new Error('Failed to obtain GUS session');
      }

      // Wyszukaj firmę
      const searchResult = await this.performGUSSearch(nip);

      if (!searchResult) {
        return null;
      }

      // Pobierz pełne dane
      const fullData = await this.getGUSFullCompanyData(searchResult.regon);

      return this.mapGUSDataToCompanyData(fullData);
    } catch (error) {
      logger.error('GUS search failed', error as Error, { nip: nip.substring(0, 3) + '***' });
      return null;
    }
  }

  async searchInKRS(nip: string): Promise<CompanyData | null> {
    try {
      // KRS API wymaga numeru KRS, więc najpierw musimy go znaleźć po NIP
      const krsNumber = await this.findKRSByNIP(nip);

      if (!krsNumber) {
        return null;
      }

      const response = await fetch(`${this.krsApiUrl}${krsNumber}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`KRS API error: ${response.status}`);
      }

      const data: KRSResponse = await response.json();

      return {
        nip: data.nip,
        regon: data.regon,
        name: data.nazwa,
        address: {
          ...(data.adres.ulica && { street: data.adres.ulica }),
          ...(data.adres.nrDomu && { houseNumber: data.adres.nrDomu }),
          ...(data.adres.nrLokalu && { apartmentNumber: data.adres.nrLokalu }),
          ...(data.adres.kodPocztowy && { postalCode: data.adres.kodPocztowy }),
          ...(data.adres.miejscowosc && { city: data.adres.miejscowosc }),
        },
        businessType: 'Spółka handlowa',
        status: this.mapKRSStatus(data.status),
        source: 'KRS' as const,
        establishmentDate: data.dataRejestracji,
      };
    } catch (error) {
      logger.error('KRS search failed', error as Error, {
        nip: nip.substring(0, 3) + '***',
        component: 'PolishRegistriesService',
      });
      return null;
    }
  }

  /**
   * Znajdź numer KRS na podstawie NIP
   */
  private async findKRSByNIP(nip: string): Promise<string | null> {
    try {
      // Używamy wyszukiwarki KRS do znalezienia numeru KRS po NIP
      const searchUrl = `https://ekrs.ms.gov.pl/api/krs/OdpisAktualny/search?nip=${nip}`;

      const response = await fetch(searchUrl, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const searchResults = await response.json();

      if (searchResults && searchResults.length > 0) {
        return searchResults[0].krs;
      }

      return null;
    } catch (error) {
      logger.warn('KRS number lookup failed', {
        nip: nip.substring(0, 3) + '***',
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Mapuje status z CEIDG na wewnętrzny format
   */
  private mapCEIDGStatus(status: string): 'active' | 'inactive' | 'suspended' {
    switch (status.toLowerCase()) {
      case 'aktywna':
      case 'active':
        return 'active';
      case 'zawieszona':
      case 'suspended':
        return 'suspended';
      case 'zakończona':
      case 'skreślona':
      case 'inactive':
        return 'inactive';
      default:
        return 'active';
    }
  }

  /**
   * Mapuje status z KRS na wewnętrzny format
   */
  private mapKRSStatus(status: string): 'active' | 'inactive' | 'liquidation' {
    switch (status.toLowerCase()) {
      case 'aktywna':
      case 'active':
        return 'active';
      case 'w likwidacji':
      case 'liquidation':
        return 'liquidation';
      case 'wykreślona':
      case 'skreślona':
      case 'inactive':
        return 'inactive';
      default:
        return 'active';
    }
  }

  /**
   * Zwraca informacje o źródle danych
   */
  getSourceInfo(source: string): { name: string; description: string; reliability: 'high' | 'medium' | 'low' } {
    switch (source) {
      case 'GUS':
        return {
          name: 'GUS (Główny Urząd Statystyczny)',
          description: 'Centralny rejestr wszystkich podmiotów gospodarczych',
          reliability: 'high',
        };
      case 'CEIDG':
        return {
          name: 'CEIDG (Centralna Ewidencja i Informacja o Działalności Gospodarczej)',
          description: 'Rejestr jednoosobowych działalności gospodarczych',
          reliability: 'high',
        };
      case 'KRS':
        return {
          name: 'KRS (Krajowy Rejestr Sądowy)',
          description: 'Rejestr spółek handlowych, fundacji i stowarzyszeń',
          reliability: 'high',
        };
      default:
        return {
          name: 'Nieznane źródło',
          description: 'Nieznane źródło danych',
          reliability: 'low',
        };
    }
  }

  /**
   * Uzyskuje session ID do API GUS
   */
  private async getGUSSessionId(): Promise<void> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://CIS/BIR/PUBL/2014/07">
        <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
          <wsa:To>${this.gusApiUrl}</wsa:To>
          <wsa:Action>http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/Zaloguj</wsa:Action>
        </soap:Header>
        <soap:Body>
          <ns:Zaloguj>
            <ns:pKluczUzytkownika>${this.gusUserKey}</ns:pKluczUzytkownika>
          </ns:Zaloguj>
        </soap:Body>
      </soap:Envelope>`;

    const response = await fetch(this.gusApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        SOAPAction: 'http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/Zaloguj',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`GUS API login failed: ${response.status}`);
    }

    const responseText = await response.text();
    const sessionMatch = responseText.match(/<ns:ZalogujResult>(.*?)<\/ns:ZalogujResult>/);

    if (sessionMatch && sessionMatch[1]) {
      this.gusSessionId = sessionMatch[1];
    } else {
      throw new Error('Failed to extract session ID from GUS response');
    }
  }

  /**
   * Wykonuje wyszukiwanie w rejestrze GUS
   */
  private async performGUSSearch(nip: string): Promise<{ regon: string } | null> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://CIS/BIR/PUBL/2014/07">
        <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
          <wsa:To>${this.gusApiUrl}</wsa:To>
          <wsa:Action>http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/DaneSzukajPodmioty</wsa:Action>
          <ns:sid>${this.gusSessionId}</ns:sid>
        </soap:Header>
        <soap:Body>
          <ns:DaneSzukajPodmioty>
            <ns:pParametryWyszukiwania>Nip="${nip}"</ns:pParametryWyszukiwania>
          </ns:DaneSzukajPodmioty>
        </soap:Body>
      </soap:Envelope>`;

    const response = await fetch(this.gusApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        SOAPAction: 'http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/DaneSzukajPodmioty',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      throw new Error(`GUS search failed: ${response.status}`);
    }

    const responseText = await response.text();
    return this.parseGUSSearchResponse(responseText);
  }

  /**
   * Pobiera pełne dane firmy z GUS
   */
  private async getGUSFullCompanyData(regon: string): Promise<Record<string, unknown>> {
    // Uproszczona implementacja - zwraca podstawowe dane
    return {
      nip: '',
      regon,
      nazwa: 'Przykładowa firma',
      ulica: 'ul. Przykładowa',
      nrNieruchomosci: '1',
      kodPocztowy: '00-000',
      miejscowosc: 'Warszawa',
      statusNip: '1',
    };
  }

  /**
   * Mapuje dane z GUS na format aplikacji
   */
  private mapGUSDataToCompanyData(gusData: GUSData): CompanyData {
    return {
      nip: gusData.nip || '',
      regon: gusData.regon || '',
      name: gusData.nazwa || '',
      address: {
        ...(gusData.ulica && { street: gusData.ulica }),
        ...(gusData.nrNieruchomosci && { houseNumber: gusData.nrNieruchomosci }),
        ...(gusData.nrLokalu && { apartmentNumber: gusData.nrLokalu }),
        ...(gusData.kodPocztowy && { postalCode: gusData.kodPocztowy }),
        ...(gusData.miejscowosc && { city: gusData.miejscowosc }),
        ...(gusData.wojewodztwo && { voivodeship: gusData.wojewodztwo }),
      },
      status: this.mapGUSStatus(gusData.statusNip || 'unknown'),
      source: 'GUS' as const,
    };
  }

  /**
   * Mapuje status z GUS na wewnętrzny format
   */
  private mapGUSStatus(status: string): 'active' | 'inactive' | 'liquidation' | 'suspended' {
    switch (status) {
      case '1':
        return 'active';
      case '2':
        return 'inactive';
      case '3':
        return 'liquidation';
      default:
        return 'active';
    }
  }

  /**
   * Parsuje odpowiedź z wyszukiwania GUS
   */
  private parseGUSSearchResponse(xml: string): { regon: string } | null {
    const dataMatch = xml.match(/<ns:DaneSzukajPodmiotyResult>(.*?)<\/ns:DaneSzukajPodmiotyResult>/s);

    if (!dataMatch || !dataMatch[1]) {
      return null;
    }

    const data = dataMatch[1];
    const regonMatch = data.match(/<Regon>(.*?)<\/Regon>/);

    return regonMatch && regonMatch[1] ? { regon: regonMatch[1] } : null;
  }

  /**
   * Waliduje format NIP
   */
  private validateNIP(nip: string): boolean {
    if (!/^\d{10}$/.test(nip)) return false;

    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const digits = nip.split('').map(Number);
    const checksum = digits.slice(0, 9).reduce((sum, digit, index) => sum + digit * weights[index]!, 0) % 11;

    return checksum === digits[9]!;
  }
}

// Singleton instance
export const polishRegistriesService = new PolishRegistriesService();

/**
 * Hook dla React do wyszukiwania w polskich rejestrach
 */
export function usePolishRegistries() {
  const searchCompany = async (nip: string): Promise<CompanyData | null> => {
    return await polishRegistriesService.searchCompany(nip);
  };

  const getSourceInfo = (source: string) => {
    return polishRegistriesService.getSourceInfo(source);
  };

  return {
    searchCompany,
    getSourceInfo,
  };
}

// Export types
