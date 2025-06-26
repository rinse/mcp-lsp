// Test subject file for Type Declaration tests
// This file contains various type declarations

/**
 * Test type alias for type declaration testing
 */
export interface TestTypeAlias {
  name: string;
  age: number;
  active: boolean;
}

/**
 * Another type alias using union types
 */
export type TestUnionType = string | number | boolean;

/**
 * Interface for type declaration testing
 */
export interface TestTypeInterface {
  id: number;
  data: TestTypeAlias;
  status: TestUnionType;
}

/**
 * Generic type for testing type declarations
 */
export interface TestGenericType<T> {
  value: T;
  metadata: TestTypeAlias;
}

/**
 * Enum for type declaration testing
 */
export enum TestEnum {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
}

/**
 * Class using the type declarations
 */
export class TestTypeClass {
  private data: TestTypeInterface;
  private generic: TestGenericType<string>;
  private enumValue: TestEnum;

  constructor(data: TestTypeInterface) {
    this.data = data;
    this.generic = {
      value: 'test',
      metadata: {
        name: 'test',
        age: 25,
        active: true,
      },
    };
    this.enumValue = TestEnum.FIRST;
  }

  public getData(): TestTypeInterface {
    return this.data;
  }

  public getGeneric(): TestGenericType<string> {
    return this.generic;
  }
}

// Usage examples for testing type navigation
const aliasExample: TestTypeAlias = {
  name: 'example',
  age: 30,
  active: true,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const interfaceExample: TestTypeInterface = {
  id: 1,
  data: aliasExample,
  status: 'active',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const genericExample: TestGenericType<number> = {
  value: 42,
  metadata: aliasExample,
};
