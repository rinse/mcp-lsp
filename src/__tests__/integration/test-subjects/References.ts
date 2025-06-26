// Test subject file for Symbol References tests
// This file contains symbols with multiple references

/**
 * Test function that is referenced multiple times
 */
export function testReferencedFunction(input: string): string {
  return input.toUpperCase();
}

/**
 * Test variable that is referenced multiple times
 */
export const testReferencedVariable = 'referenced-value';

/**
 * Test class that is referenced multiple times
 */
export class TestReferencedClass {
  public property = testReferencedVariable;

  public method(): string {
    return testReferencedFunction(this.property);
  }
}

// Multiple references to test symbol references tool
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const reference1 = testReferencedFunction('first');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const reference2 = testReferencedFunction('second');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const reference3 = testReferencedVariable;
const reference4 = new TestReferencedClass();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const reference5 = reference4.method();

/**
 * Function that uses the referenced symbols multiple times
 */
export function useReferencedSymbols(): void {
  console.log(testReferencedFunction('usage'));
  console.log(testReferencedVariable);
  const instance = new TestReferencedClass();
  instance.method();
}

/**
 * Another function using the same symbols
 */
export function anotherUserOfReferencedSymbols(): string {
  return testReferencedFunction(testReferencedVariable);
}
