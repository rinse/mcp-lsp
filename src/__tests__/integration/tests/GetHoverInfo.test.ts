import { isRight } from 'fp-ts/Either';

import { testRunners, TestRunner } from '../TestRunner';

describe('GetHoverInfo Integration Test', () => {
  const runners: [string, TestRunner][] = testRunners.map(([name, init]) => [name, init()]);

  beforeAll(async () => {
    const promises = runners.map(([, runner]) => runner.init());
    await Promise.all(promises);
  });

  afterAll(async () => {
    const promises = runners.map(([, runner]) => runner.close());
    await Promise.all(promises);
  });

  test.each(runners)('[%s] should successfully run get_hover_info tool with concrete expected result', async (name, runner) => {
    const result = await runner.runTool('get_hover_info', {
      uri: 'src/__tests__/integration/test-subjects/GetHoverInfo.ts',
      line: 10,
      character: 16,
    });
    if (!isRight(result)) {
      console.error(`${name} failed:`, result.left);
    }
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      const expectedResult = 'src/__tests__/integration/test-subjects/GetHoverInfo.ts:10:16\n  Type: function exampleFunction(): void';
      expect(result.right).toBe(expectedResult);
    }
  }, 15000); // timeout
});
