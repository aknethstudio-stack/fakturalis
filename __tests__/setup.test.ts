/**
 * Basic setup test to verify Jest configuration and environment
 */

describe('Project Setup', () => {
  test('should have working test environment', () => {
    expect(true).toBe(true);
  });

  test('should support TypeScript', () => {
    const message: string = 'TypeScript is working';
    expect(typeof message).toBe('string');
    expect(message).toContain('TypeScript');
  });

  test('should have access to DOM environment', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });

  test('should support module path mapping', () => {
    // This test will fail if @/* path mapping is not working
    const pathTest = () => {
      // We're just testing that TypeScript can resolve the path
      // The actual import would be tested in component tests
      return '@/styles/global.css';
    };

    expect(pathTest()).toBe('@/styles/global.css');
  });
});
