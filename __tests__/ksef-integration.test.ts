import { expect } from '@jest/globals';

describe('KSeF Integration', () => {
  test('should load KSeF configuration', async () => {
    const { KSEF_CONFIG } = await import('@/lib/ksef/config');

    expect(KSEF_CONFIG.endpoints.demo).toContain('ksef-demo.mf.gov.pl');
    expect(KSEF_CONFIG.endpoints.production).toContain('ksef.mf.gov.pl');
  });

  test('should have valid XML namespaces', async () => {
    const { KSEF_CONFIG } = await import('@/lib/ksef/config');

    expect(KSEF_CONFIG.xmlNamespaces.ksef).toContain('crd.gov.pl');
    expect(KSEF_CONFIG.xmlNamespaces.fahash).toContain('mf');
    expect(KSEF_CONFIG.xmlNamespaces.tns).toContain('KodyCEiSU');
  });
});
