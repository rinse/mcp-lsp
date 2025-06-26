// Test subject file for Definition Location tests
// This file contains code with clear definition locations

/**
 * Main function for testing go-to-definition
 */
export function testDefinitionFunction(param: string): string {
  return `Hello ${param}`;
}

/**
 * Test variable for definition location testing
 */
export const testDefinitionVariable = 'definition-test-value';

/**
 * Test class for definition location testing
 */
export class TestDefinitionClass {
  /**
   * Test property for definition location
   */
  public testProperty = 'test-property';

  /**
   * Test method for definition location
   */
  public testMethod(): number {
    return 42;
  }
}

/**
 * Test interface for definition location
 */
export interface TestDefinitionInterface {
  name: string;
  value: number;
}

// Usage of the defined symbols to test navigation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const usageExample = testDefinitionFunction('world');
const usageClass = new TestDefinitionClass();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const usageProperty = usageClass.testProperty;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const usageMethod = usageClass.testMethod();
