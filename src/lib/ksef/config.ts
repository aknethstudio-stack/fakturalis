/**
 * KSeF (Krajowy System e-Faktur) configuration
 * Environment-specific settings for Polish National e-Invoice System
 */

export const KSEF_CONFIG = {
  // API endpoints
  endpoints: {
    demo: 'https://ksef-demo.mf.gov.pl/api',
    production: 'https://ksef.mf.gov.pl/api',
  },

  // Current environment based on NODE_ENV
  apiUrl: process.env.NODE_ENV === 'production' ? 'https://ksef.mf.gov.pl/api' : 'https://ksef-demo.mf.gov.pl/api',

  // Request limits and timeouts
  limits: {
    requestsPerMinute: 50,
    maxFileSizeMB: 10,
    requestTimeoutMs: 30000,
    sessionTokenValidityHours: 1,
  },

  // XML namespaces for FA_VAT format
  xmlNamespaces: {
    fahash: 'http://crd.gov.pl/xml/schematy/dziedzinowe/mf/2022/01/05/eD/DefinicjeTypy/',
    tns: 'http://crd.gov.pl/xml/schematy/dziedzinowe/mf/2021/06/08/eD/KodyCEiSU/',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    ksef: 'http://crd.gov.pl/wzor/2023/06/29/12648/',
  },
} as const;

export type KSeFEnvironment = 'demo' | 'production';
export type KSeFSubmissionStatus = 'not_sent' | 'pending' | 'accepted' | 'rejected' | 'error';
