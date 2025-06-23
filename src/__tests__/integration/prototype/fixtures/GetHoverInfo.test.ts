import { isRight } from 'fp-ts/Either';

import { MockRunner } from '../../../../integration-tests/prototype/mock/MockRunner';

describe('GetHoverInfo Integration Test', () => {
  let runner: MockRunner;

  beforeEach(() => {
    runner = new MockRunner();
  });

  it('should successfully list tools', async () => {
    const result = await runner.listTools();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toContain('get_hover_info');
      expect(result.right).toContain('list_definition_locations');
    }
  });

  it('should successfully run get_hover_info tool', async () => {
    const result = await runner.runTool('get_hover_info', {
      uri: 'file:///test/file.ts',
      line: 10,
      character: 5,
    });

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toContain('/test/file.ts:10:5');
      expect(result.right).toContain('Type: function example(): void');
      expect(result.right).toContain('Docs: Example function');
    }
  });
});
