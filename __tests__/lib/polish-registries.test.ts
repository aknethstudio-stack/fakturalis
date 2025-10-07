/**
 * Tests for Polish Registries Service
 * Testy dla integracji z polskimi rejestrami: GUS, KRS, CEIDG
 */

import { polishRegistriesService, usePolishRegistries } from '../../src/lib/polish-registries';

// The GUSData interface is not exported from the source file, so we replicate it here for type safety in tests.
interface _GUSData {
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

// Interface for accessing private members in tests
interface TestPolishRegistriesService {
  gusSessionId?: string;
  getGUSSessionId(): Promise<string>;
  performGUSSearch(nip: string): Promise<unknown>;
  parseGUSSearchResponse(xml: string): unknown;
  mapGUSStatus(status: string): string;
  mapGUSDataToCompanyData(data: unknown): unknown;
  mapCEIDGStatus(status: string): string;
  mapKRSStatus(status: string): string;
  findKRSByNIP(nip: string): Promise<string | null>;
  searchCompany(nip: string): Promise<unknown>;
}

// Type assertion to access private members in tests
const service = polishRegistriesService as unknown as TestPolishRegistriesService;

// Mock external API calls
global.fetch = jest.fn();

// Helper for creating mock Response objects
const createMockResponse = (body: string, ok = true, status?: number): Partial<Response> => ({
  ok,
  status: status ?? (ok ? 200 : 500),
  text: jest.fn().mockResolvedValue(body),
  json: jest.fn().mockResolvedValue({}),
});

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock environment variables
const originalEnv = process.env;

describe('PolishRegistriesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    (fetch as jest.Mock).mockImplementation(() => Promise.reject(new Error('Unexpected fetch call')));
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('searchCompany', () => {
    it('should clean NIP format and search successfully', async () => {
      const mockCEIDGResponse = [
        {
          firma: 'Test Company Sp. z o.o.',
          nip: '5260000734',
          regon: '123456789',
          adres: {
            ulica: 'Testowa',
            nrDomu: '1',
            nrLokalu: '2',
            kodPocztowy: '00-001',
            miejscowosc: 'Warszawa',
            wojewodztwo: 'mazowieckie',
          },
          status: 'aktywna',
          dataPodstawowegoZapisu: '2020-01-01',
          pkd: [{ kod: '6201Z', nazwa: 'Działalność związana z oprogramowaniem', przewazajace: true }],
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCEIDGResponse),
      });

      const result = await polishRegistriesService.searchCompany('5260000734');

      expect(result).toEqual({
        nip: '5260000734',
        regon: '123456789',
        name: 'Test Company Sp. z o.o.',
        address: {
          street: 'Testowa',
          houseNumber: '1',
          apartmentNumber: '2',
          postalCode: '00-001',
          city: 'Warszawa',
          voivodeship: 'mazowieckie',
        },
        businessType: 'Działalność gospodarcza',
        status: 'active',
        pkd: ['6201Z'],
        source: 'CEIDG',
        establishmentDate: '2020-01-01',
      });
    });

    it('should return first successful result from multiple registries', async () => {
      const mockKRSResponse = {
        nazwa: 'KRS Test Sp. z o.o.',
        nip: '5260000734',
        regon: '123456789',
        krs: '0000123456',
        adres: {
          ulica: 'KRS Street',
          nrDomu: '10',
          kodPocztowy: '00-100',
          miejscowosc: 'Warszawa',
        },
        status: 'aktywna',
        dataRejestracji: '2020-01-01',
        zarzad: [{ imie: 'Jan', nazwisko: 'Kowalski', funkcja: 'Prezes' }],
      };

      // Mock: CEIDG fails, KRS succeeds
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        }) // CEIDG fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ krs: '0000123456' }]),
        }) // KRS search succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockKRSResponse),
        }); // KRS data fetch

      const result = await polishRegistriesService.searchCompany('5260000734');

      expect(result?.source).toBe('KRS');
      expect(result?.name).toBe('KRS Test Sp. z o.o.');
    });

    it('should return null when no registry has the company', async () => {
      // All registries fail
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // CEIDG
        .mockResolvedValueOnce({ ok: false, status: 404 }) // KRS search
        .mockResolvedValueOnce({ ok: false, status: 500 }); // GUS (no API key)

      const result = await polishRegistriesService.searchCompany('5260000734');
      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await polishRegistriesService.searchCompany('5260000734');
      expect(result).toBeNull();
    });

    it('should handle promise rejections from all registries', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('CEIDG error'))
        .mockRejectedValueOnce(new Error('KRS error'))
        .mockRejectedValueOnce(new Error('GUS error'));

      const result = await polishRegistriesService.searchCompany('5260000734');
      expect(result).toBeNull();
    });
  });

  describe('searchInCEIDG', () => {
    it('should return company data from CEIDG', async () => {
      const mockResponse = [
        {
          firma: 'Test CEIDG Company',
          nip: '5260000734',
          regon: '123456789',
          adres: {
            ulica: 'Testowa',
            nrDomu: '1',
            nrLokalu: '2',
            kodPocztowy: '00001',
            miejscowosc: 'Warszawa',
            wojewodztwo: 'mazowieckie',
          },
          status: 'aktywna',
          dataPodstawowegoZapisu: '2020-01-01',
          pkd: [{ kod: '6201Z', nazwa: 'Działalność związana z oprogramowaniem', przewazajace: true }],
        },
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await polishRegistriesService.searchInCEIDG('5260000734');

      expect(result).toEqual({
        nip: '5260000734',
        regon: '123456789',
        name: 'Test CEIDG Company',
        address: {
          street: 'Testowa',
          houseNumber: '1',
          apartmentNumber: '2',
          postalCode: '00001',
          city: 'Warszawa',
          voivodeship: 'mazowieckie',
        },
        businessType: 'Działalność gospodarcza',
        status: 'active',
        pkd: ['6201Z'],
        source: 'CEIDG',
        establishmentDate: '2020-01-01',
      });
    });

    it('should handle missing optional fields', async () => {
      const mockResponse = [
        {
          firma: 'Minimal Company',
          nip: '5260000734',
          regon: '123456789',
          adres: {
            ulica: 'Main St',
            nrDomu: '1',
            kodPocztowy: '00-001',
            miejscowosc: 'Warsaw',
            wojewodztwo: 'mazowieckie',
          },
          status: 'aktywna',
          dataPodstawojegoZapisu: '2020-01-01',
        },
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await polishRegistriesService.searchInCEIDG('5260000734');

      expect(result?.address.apartmentNumber).toBeUndefined();
      expect(result?.pkd).toBeUndefined();
    });

    it('should return null when company not found in CEIDG', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await polishRegistriesService.searchInCEIDG('5260000734');
      expect(result).toBeNull();
    });

    it('should handle CEIDG API errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await polishRegistriesService.searchInCEIDG('5260000734');
      expect(result).toBeNull();
    });

    it('should call correct API endpoint with POST method', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await polishRegistriesService.searchInCEIDG('5260000734');

      expect(fetch).toHaveBeenCalledWith('https://dane.biznes.gov.pl/api/ceidg/v2/firma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ nip: '5260000734' }),
      });
    });
  });

  describe('searchInKRS', () => {
    it('should return company data from KRS', async () => {
      const mockKRSSearchResponse = [{ krs: '0000123456' }];
      const mockKRSDataResponse = {
        nazwa: 'Test KRS Company Sp. z o.o.',
        nip: '5260000734',
        regon: '123456789',
        krs: '0000123456',
        adres: {
          ulica: 'KRS Street',
          nrDomu: '10',
          nrLokalu: '5',
          kodPocztowy: '00-100',
          miejscowosc: 'Warszawa',
        },
        status: 'aktywna',
        kapitalZakladowy: '5000',
        zarzad: [
          { imie: 'Jan', nazwisko: 'Kowalski', funkcja: 'Prezes' },
          { imie: 'Anna', nazwisko: 'Nowak', funkcja: 'Wiceprezes' },
        ],
        dataRejestracji: '2019-06-15',
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockKRSSearchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockKRSDataResponse),
        });

      const result = await polishRegistriesService.searchInKRS('5260000734');

      expect(result).toEqual({
        nip: '5260000734',
        regon: '123456789',
        name: 'Test KRS Company Sp. z o.o.',
        address: {
          street: 'KRS Street',
          houseNumber: '10',
          apartmentNumber: '5',
          postalCode: '00-100',
          city: 'Warszawa',
        },
        businessType: 'Spółka handlowa',
        status: 'active',
        source: 'KRS',
        establishmentDate: '2019-06-15',
      });
    });

    it('should return null when KRS number not found', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await polishRegistriesService.searchInKRS('5260000734');
      expect(result).toBeNull();
    });

    it('should call correct KRS API endpoints', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await polishRegistriesService.searchInKRS('5260000734');

      expect(fetch).toHaveBeenCalledWith('https://ekrs.ms.gov.pl/api/krs/OdpisAktualny/search?nip=5260000734', {
        headers: { Accept: 'application/json' },
      });
    });
  });

  describe('searchInGUS', () => {
    beforeEach(() => {
      process.env.GUS_API_KEY = 'test-api-key';
    });

    it('should return null when GUS API key is not configured', async () => {
      delete process.env.GUS_API_KEY;

      const result = await polishRegistriesService.searchInGUS('5260000734');
      expect(result).toBeNull();
    });

    it('should validate NIP before making API calls', async () => {
      const result = await polishRegistriesService.searchInGUS('invalid-nip');
      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle GUS session login failure', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await polishRegistriesService.searchInGUS('5260000734');
      expect(result).toBeNull();
    });

    it('should handle network errors during GUS operations', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const result = await polishRegistriesService.searchInGUS('5260000734');
      expect(result).toBeNull();
    });
  });

  describe('getSourceInfo', () => {
    it('should return correct info for GUS', () => {
      const info = polishRegistriesService.getSourceInfo('GUS');
      expect(info).toEqual({
        name: 'GUS (Główny Urząd Statystyczny)',
        description: 'Centralny rejestr wszystkich podmiotów gospodarczych',
        reliability: 'high',
      });
    });

    it('should return correct info for CEIDG', () => {
      const info = polishRegistriesService.getSourceInfo('CEIDG');
      expect(info).toEqual({
        name: 'CEIDG (Centralna Ewidencja i Informacja o Działalności Gospodarczej)',
        description: 'Rejestr jednoosobowych działalności gospodarczych',
        reliability: 'high',
      });
    });

    it('should return correct info for KRS', () => {
      const info = polishRegistriesService.getSourceInfo('KRS');
      expect(info).toEqual({
        name: 'KRS (Krajowy Rejestr Sądowy)',
        description: 'Rejestr spółek handlowych, fundacji i stowarzyszeń',
        reliability: 'high',
      });
    });

    it('should return default info for unknown source', () => {
      const info = polishRegistriesService.getSourceInfo('UNKNOWN');
      expect(info).toEqual({
        name: 'Nieznane źródło',
        description: 'Nieznane źródło danych',
        reliability: 'low',
      });
    });
  });

  describe('GUS search flow', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      process.env.GUS_API_KEY = 'test-key';
    });

    it('should get GUS session ID successfully', async () => {
      const sessionResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope>
          <soap:Body>
            <ns:ZalogujResult>test-session-123</ns:ZalogujResult>
          </soap:Body>
        </soap:Envelope>`;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        createMockResponse(sessionResponse) as Response,
      );

      await service.getGUSSessionId();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('wsBIR/UslugaBIRzewnPubl.svc'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/soap+xml; charset=utf-8',
          }),
        }),
      );
      expect(service.gusSessionId).toBe('test-session-123');
    });

    it('should handle GUS session login failure', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        createMockResponse('', false) as Response,
      );

      await expect(service.getGUSSessionId()).rejects.toThrow('GUS API login failed: 500');
    });

    it('should handle malformed GUS session response', async () => {
      const malformedResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope>
          <soap:Body>
            <ns:Error>Invalid credentials</ns:Error>
          </soap:Body>
        </soap:Envelope>`;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        createMockResponse(malformedResponse) as Response,
      );

      await expect(service.getGUSSessionId()).rejects.toThrow('Failed to extract session ID from GUS response');
    });

    it('should perform GUS search successfully', async () => {
      const searchResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope>
          <soap:Body>
            <ns:DaneSzukajPodmiotyResult>
              <dane>
                <Regon>123456789</Regon>
                <Nip>5260000734</Nip>
                <Nazwa>Test Company</Nazwa>
              </dane>
            </ns:DaneSzukajPodmiotyResult>
          </soap:Body>
        </soap:Envelope>`;

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        createMockResponse(searchResponse) as Response,
      );

      service.gusSessionId = 'test-session';

      const result = await service.performGUSSearch('5260000734');

      expect(result).toEqual({ regon: '123456789' });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('wsBIR/UslugaBIRzewnPubl.svc'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Nip="5260000734"'),
        }),
      );
    });

    it('should handle GUS search API error', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        createMockResponse('', false, 400) as Response,
      );

      service.gusSessionId = 'test-session';

      await expect(service.performGUSSearch('5260000734')).rejects.toThrow('GUS search failed: 400');
    });

    it('should parse GUS search response correctly', async () => {
      const xmlResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope>
          <soap:Body>
            <ns:DaneSzukajPodmiotyResult>
              <dane>
                <Regon>987654321</Regon>
                <Nip>1234567890</Nip>
              </dane>
            </ns:DaneSzukajPodmiotyResult>
          </soap:Body>
        </soap:Envelope>`;

      const result = service.parseGUSSearchResponse(xmlResponse);

      expect(result).toEqual({ regon: '987654321' });
    });

    it('should return null for empty GUS search response', async () => {
      const emptyResponse = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope>
          <soap:Body>
            <ns:DaneSzukajPodmiotyResult></ns:DaneSzukajPodmiotyResult>
          </soap:Body>
        </soap:Envelope>`;

      const result = service.parseGUSSearchResponse(emptyResponse);

      expect(result).toBeNull();
    });

    it('should return null for malformed GUS XML response', async () => {
      const malformedResponse = `<invalid>xml</response>`;

      const result = service.parseGUSSearchResponse(malformedResponse);

      expect(result).toBeNull();
    });

    it('should test GUS status mapping', async () => {
      // Test different status mappings
      expect(service.mapGUSStatus('1')).toBe('active');
      expect(service.mapGUSStatus('2')).toBe('inactive');
      expect(service.mapGUSStatus('3')).toBe('liquidation');
      expect(service.mapGUSStatus('unknown')).toBe('active');
    });

    it('should test GUS company data mapping', async () => {
      const gusData = {
        nip: '5260000734',
        regon: '123456789',
        nazwa: 'Test GUS Company',
        ulica: 'ul. Testowa',
        nrNieruchomosci: '10',
        nrLokalu: '2A',
        kodPocztowy: '00-001',
        miejscowosc: 'Warszawa',
        wojewodztwo: 'mazowieckie',
        statusNip: '1',
      };

      const result = service.mapGUSDataToCompanyData(gusData);

      expect(result).toEqual({
        nip: '5260000734',
        regon: '123456789',
        name: 'Test GUS Company',
        address: {
          street: 'ul. Testowa',
          houseNumber: '10',
          apartmentNumber: '2A',
          postalCode: '00-001',
          city: 'Warszawa',
          voivodeship: 'mazowieckie',
        },
        status: 'active',
        source: 'GUS',
      });
    });

    it('should test GUS company data with minimal fields', async () => {
      const minimalData = {
        nip: '',
        regon: '',
        nazwa: '',
        statusNip: '2',
      };

      const result = service.mapGUSDataToCompanyData(minimalData);

      expect(result).toEqual({
        nip: '',
        regon: '',
        name: '',
        address: {
          street: undefined,
          houseNumber: undefined,
          apartmentNumber: undefined,
          postalCode: undefined,
          city: undefined,
          voivodeship: undefined,
        },
        status: 'inactive',
        source: 'GUS',
      });
    });
  });

  describe('NIP validation', () => {
    it('should validate correct NIP checksums', async () => {
      process.env.GUS_API_KEY = 'test-key';

      // Mock kolejno: getGUSSessionId i performGUSSearch
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<ns:ZalogujResult>test-session</ns:ZalogujResult>'),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      await polishRegistriesService.searchInGUS('1234563218');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should reject invalid NIP formats', async () => {
      process.env.GUS_API_KEY = 'test-key';

      const invalidNips = ['123456789', '12345678901', 'abcdefghij', '1234567899'];

      for (const nip of invalidNips) {
        const result = await polishRegistriesService.searchInGUS(nip);
        expect(result).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });
  });
});

describe('Status mappings', () => {
  it('should map CEIDG status correctly', () => {
    expect(service.mapCEIDGStatus('aktywna')).toBe('active');
    expect(service.mapCEIDGStatus('active')).toBe('active');
    expect(service.mapCEIDGStatus('zawieszona')).toBe('suspended');
    expect(service.mapCEIDGStatus('suspended')).toBe('suspended');
    expect(service.mapCEIDGStatus('zakończona')).toBe('inactive');
    expect(service.mapCEIDGStatus('skreślona')).toBe('inactive');
    expect(service.mapCEIDGStatus('inactive')).toBe('inactive');
    expect(service.mapCEIDGStatus('unknown')).toBe('active');
  });

  it('should map KRS status correctly', () => {
    expect(service.mapKRSStatus('aktywna')).toBe('active');
    expect(service.mapKRSStatus('active')).toBe('active');
    expect(service.mapKRSStatus('w likwidacji')).toBe('liquidation');
    expect(service.mapKRSStatus('liquidation')).toBe('liquidation');
    expect(service.mapKRSStatus('wykreślona')).toBe('inactive');
    expect(service.mapKRSStatus('skreślona')).toBe('inactive');
    expect(service.mapKRSStatus('inactive')).toBe('inactive');
    expect(service.mapKRSStatus('unknown')).toBe('active');
  });
});

describe('CEIDG edge cases', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should handle empty CEIDG response array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    });

    const result = await polishRegistriesService.searchInCEIDG('5260000734');
    expect(result).toBeNull();
  });

  it('should handle null CEIDG response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(null),
    });

    const result = await polishRegistriesService.searchInCEIDG('5260000734');
    expect(result).toBeNull();
  });

  it('should handle undefined company in CEIDG response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([undefined]),
    });

    const result = await polishRegistriesService.searchInCEIDG('5260000734');
    expect(result).toBeNull();
  });

  it('should handle CEIDG API non-200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await polishRegistriesService.searchInCEIDG('5260000734');
    expect(result).toBeNull();
  });

  it('should handle CEIDG network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await polishRegistriesService.searchInCEIDG('5260000734');
    expect(result).toBeNull();
  });
});

describe('KRS edge cases', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should handle KRS findKRSByNIP failure', async () => {
    // Mock findKRSByNIP to return null
    jest.spyOn(service, 'findKRSByNIP').mockResolvedValue(null);

    const result = await polishRegistriesService.searchInKRS('5260000734');
    expect(result).toBeNull();
  });

  it('should handle KRS API error', async () => {
    // Mock findKRSByNIP to return KRS number
    jest.spyOn(service, 'findKRSByNIP').mockResolvedValue('0000123456');

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
      createMockResponse('', false, 500) as Response,
    );

    const result = await polishRegistriesService.searchInKRS('5260000734');
    expect(result).toBeNull();
  });

  it('should handle KRS search network error', async () => {
    jest.spyOn(service, 'findKRSByNIP').mockRejectedValue(new Error('Network error'));

    const result = await polishRegistriesService.searchInKRS('5260000734');
    expect(result).toBeNull();
  });
});

describe('usePolishRegistries hook', () => {
  it('should provide searchCompany function', async () => {
    const { searchCompany } = usePolishRegistries();

    // Mock successful search
    jest.spyOn(polishRegistriesService, 'searchCompany').mockResolvedValue({
      nip: '5260000734',
      regon: '123456789',
      name: 'Test Company',
      address: {
        street: 'ul. Testowa',
        houseNumber: '1',
        city: 'Warszawa',
        postalCode: '00-001',
      },
      status: 'active',
      source: 'CEIDG',
    });

    const result = await searchCompany('5260000734');
    expect(result).toBeTruthy();
    expect(result?.name).toBe('Test Company');
  });

  it('should provide getSourceInfo function', () => {
    const { getSourceInfo } = usePolishRegistries();

    const info = getSourceInfo('GUS');
    expect(info.name).toBe('GUS (Główny Urząd Statystyczny)');
    expect(info.reliability).toBe('high');
  });
});
