// Test subject file for Implementation Location tests
// This file contains interfaces and their implementations

/**
 * Test interface for implementation location testing
 */
export interface TestImplementationInterface {
  execute(): string;
  getValue(): number;
}

/**
 * First implementation of the test interface
 */
export class TestImplementationA implements TestImplementationInterface {
  execute(): string {
    return 'Implementation A';
  }

  getValue(): number {
    return 1;
  }
}

/**
 * Second implementation of the test interface
 */
export class TestImplementationB implements TestImplementationInterface {
  execute(): string {
    return 'Implementation B';
  }

  getValue(): number {
    return 2;
  }
}

/**
 * Abstract base class for testing implementation locations
 */
export abstract class TestAbstractClass {
  abstract abstractMethod(): string;

  concreteMethod(): string {
    return 'concrete';
  }
}

/**
 * Concrete implementation of abstract class
 */
export class TestConcreteClass extends TestAbstractClass {
  abstractMethod(): string {
    return 'implemented abstract method';
  }
}

// Usage examples to test implementation navigation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const instanceA: TestImplementationInterface = new TestImplementationA();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const instanceB: TestImplementationInterface = new TestImplementationB();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const concrete = new TestConcreteClass();
