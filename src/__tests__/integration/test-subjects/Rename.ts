// Test subject file for Rename Symbol tests
// This file contains symbols that can be safely renamed

/**
 * Function to be renamed - has multiple references
 */
export function renameableFunction(input: string): string {
  return input.toUpperCase();
}

/**
 * Variable to be renamed - has multiple references
 */
export const renameableVariable = 'renameable-value';

/**
 * Class to be renamed - has multiple references
 */
export class RenameableClass {
  /**
   * Property to be renamed
   */
  public renameableProperty = renameableVariable;

  /**
   * Method to be renamed
   */
  public renameableMethod(): string {
    return renameableFunction(this.renameableProperty);
  }
}

/**
 * Interface to be renamed
 */
export interface RenameableInterface {
  renameableField: string;
  renameableMethod(): void;
}

/**
 * Type alias to be renamed
 */
export interface RenameableType {
  renameableKey: string;
  renameableValue: number;
}

// Multiple usages of renameable symbols to test renaming across references
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const usage1 = renameableFunction('test1');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const usage2 = renameableVariable;
const usage3 = new RenameableClass();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const usage4 = usage3.renameableProperty;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const usage5 = usage3.renameableMethod();

/**
 * Function that uses renameable symbols
 */
export function useRenameableSymbols(): void {
  console.log(renameableFunction('usage'));
  console.log(renameableVariable);

  const instance = new RenameableClass();
  console.log(instance.renameableProperty);
  console.log(instance.renameableMethod());
}

/**
 * Another function using renameable symbols
 */
export function anotherUserOfRenameableSymbols(): RenameableType {
  return {
    renameableKey: renameableFunction('key'),
    renameableValue: 42,
  };
}

/**
 * Class implementing renameable interface
 */
export class ImplementsRenameableInterface implements RenameableInterface {
  renameableField = 'field';

  renameableMethod(): void {
    console.log(this.renameableField);
  }
}
