// Test subject file for Code Actions tests
// This file contains code that should trigger various code actions

/**
 * Function with unused parameter to trigger code action
 */
export function functionWithUnusedParameter(unusedParam: string, usedParam: number): number {
  return usedParam * 2;
}

/**
 * Function with missing return type annotation
 */
export function functionWithoutReturnType(input: string): number {
  return input.length;
}

/**
 * Variable that is declared but never used
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unusedVariable = 'this variable is never used';

/**
 * Function with unreachable code
 */
export function functionWithUnreachableCode(): string {
  return 'early return';
  console.log('this code is unreachable'); // This should trigger a code action
}

/**
 * Interface with optional property that could be made required
 */
export interface IncompleteInterface {
  name?: string; // Could suggest making this required
  value: number;
}

/**
 * Class with missing access modifiers
 */
export class ClassWithMissingModifiers {
  property = 'default'; // Could suggest adding public/private

  method(): string { // Could suggest adding return type and access modifier
    return this.property;
  }
}

/**
 * Function with inconsistent parameter formatting
 */
export function poorlyFormattedFunction(param1:string, param2:number, param3:boolean):void{
  console.log(param1, param2, param3);
}

/**
 * Array that could be made readonly
 */
export const mutableArray: string[] = ['item1', 'item2'];

/**
 * Object that could have const assertion
 */
export const mutableObject = {
  key1: 'value1',
  key2: 'value2',
};

/**
 * Function with magic numbers that could be extracted to constants
 */
export function functionWithMagicNumbers(input: number): number {
  return input * 42 + 100; // Magic numbers that could be extracted
}
