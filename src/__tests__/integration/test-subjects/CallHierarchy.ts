// Test subject file for Call Hierarchy tests (caller/callee relationships)
// This file contains function call chains for testing call hierarchy

/**
 * Level 1 function - top level caller
 */
export function topLevelCaller(): string {
  const result = midLevelFunction('from-top');
  return result;
}

/**
 * Level 2 function - middle level function
 */
export function midLevelFunction(input: string): string {
  const processed = helperFunction(input);
  const validated = validateInput(processed);
  return validated;
}

/**
 * Level 3 function - helper function
 */
export function helperFunction(input: string): string {
  return input.toLowerCase();
}

/**
 * Level 3 function - validation function
 */
export function validateInput(input: string): string {
  if (input.length === 0) {
    return 'empty';
  }
  return input;
}

/**
 * Utility function that calls multiple functions
 */
export function utilityFunction(): void {
  helperFunction('utility');
  validateInput('test');

  // This also creates a call to midLevelFunction
  midLevelFunction('utility-mid');
}

/**
 * Complex function with multiple call paths
 */
export function complexFunction(condition: boolean): string {
  if (condition) {
    return topLevelCaller();
  } else {
    return midLevelFunction('complex');
  }
}

/**
 * Function that demonstrates multiple callers
 */
export function multipleCallerTarget(): number {
  return 42;
}

/**
 * First caller of multipleCallerTarget
 */
export function caller1(): number {
  return multipleCallerTarget() + 1;
}

/**
 * Second caller of multipleCallerTarget
 */
export function caller2(): number {
  return multipleCallerTarget() * 2;
}

/**
 * Third caller of multipleCallerTarget
 */
export function caller3(): string {
  return `Result: ${multipleCallerTarget()}`;
}
