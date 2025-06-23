// Test subject file for GetHoverInfo tests
// This file contains code that the hover info tool can analyze

export interface Promise<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>)   | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>)   | null
  ): Promise<TResult1 | TResult2>;
}

export function exampleFunction(): void {
  console.log('This is an example function for testing hover info');
}

export const exampleVariable = 'test string';

export class ExampleClass {
  public property = 'example';

  public method(): number {
    return 42;
  }
}

