import { isRight } from 'fp-ts/Either';

import { testRunners } from '../TestRunner';

describe('GetHoverInfo Integration Test', () => {
  test.each(testRunners)('[%s] should successfully run get_hover_info tool with concrete expected result', async (_, runner) => {
    const result = await runner.runTool('get_hover_info', {
      uri: 'src/__tests__/integration/test-subjects/GetHoverInfo.ts',
      line: 10,
      character: 16,
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      const expectedResult = 'src/__tests__/integration/test-subjects/GetHoverInfo.ts:10:16\n  Type: function exampleFunction(): void';
      expect(result.right).toBe(expectedResult);
    }
  }, 15000); // timeout
});
