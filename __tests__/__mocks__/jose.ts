// Mock for JOSE library to avoid ES module issues in Jest

export const SignJWT = jest.fn().mockImplementation(() => ({
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuedAt: jest.fn().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
  sign: jest.fn().mockResolvedValue('mock-jwt-token'),
}));

export const jwtVerify = jest.fn().mockResolvedValue({
  payload: { sub: 'test-user', exp: Date.now() / 1000 + 3600 },
});

export const importJWK = jest.fn().mockResolvedValue({});
export const importPKCS8 = jest.fn().mockResolvedValue({});
export const importSPKI = jest.fn().mockResolvedValue({});
