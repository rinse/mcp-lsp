import { Readable } from 'stream';

import * as t from 'io-ts';

import { StreamEventEmitter, StreamParseResult } from './StreamEventEmitter';

const TestDataT = t.type({
  type: t.string,
  value: t.number,
});
type TestData = t.TypeOf<typeof TestDataT>;

function createJsonLineParser(): (buffer: Buffer) => StreamParseResult<TestData> {
  return (buffer: Buffer): StreamParseResult<TestData> => {
    const str = buffer.toString('utf8');
    const separatorIndex = str.indexOf('\n');
    if (separatorIndex === -1) {
      return { kind: 'waiting' };
    }
    const elem = str.substring(0, separatorIndex);
    let item: unknown;
    try {
      item = JSON.parse(elem);
    } catch {
      return { kind: 'error', consume: separatorIndex + 1, message: `Invalid JSON object: ${elem}` };
    }
    const data: TestData | undefined = TestDataT.is(item) ? item : undefined;
    if (data == null) {
      return { kind: 'error', consume: separatorIndex + 1, message: `Invalid JSON object: ${elem}` };
    }
    return { kind: 'success', value: data, consume: Buffer.byteLength(`${elem  }\n`, 'utf8') };
  };
}

describe('StreamEventEmitter', () => {
  it('should emit parsed JSON objects from newline-delimited stream', (done) => {
    const stream = new Readable({
      read(): void {
        this.push('{"type":"test","value":1}\n');
        this.push('{"type":"test","value":2}\n');
        this.push(null);
      },
    });
    const emitter = new StreamEventEmitter<TestData>(stream, createJsonLineParser());
    const results: TestData[] = [];
    emitter.on('data', (data: TestData) => {
      results.push(data);
    });
    emitter.on('end', () => {
      expect(results).toEqual([
        { type: 'test', value: 1 },
        { type: 'test', value: 2 },
      ]);
      done();
    });
  });

  it('should handle split JSON across multiple chunks', (done) => {
    const stream = new Readable({
      read(): void {
        this.push('{"type"');
        this.push(':"test","value":3}\n');
        this.push(null);
      },
    });
    const emitter = new StreamEventEmitter<TestData>(stream, createJsonLineParser());
    const results: TestData[] = [];
    emitter.on('data', (data: TestData) => {
      results.push(data);
    });
    emitter.on('end', () => {
      expect(results).toEqual([{ type: 'test', value: 3 }]);
      done();
    });
  });

  it('should emit error for invalid JSON', (done) => {
    const stream = new Readable({
      read(): void {
        this.push('invalid json\n');
        this.push('{"type":"test","value":4}\n');
        this.push(null);
      },
    });
    const emitter = new StreamEventEmitter<TestData>(stream, createJsonLineParser());
    const results: TestData[] = [];
    const errors: Error[] = [];
    emitter.on('data', (data: TestData) => {
      results.push(data);
    });
    emitter.on('error', (error: Error) => {
      errors.push(error);
    });
    emitter.on('end', () => {
      expect(errors.length).toBe(1);
      expect(results).toEqual([{ type: 'test', value: 4 }]);
      done();
    });
  });

  it('should handle incomplete data at end of stream', (done) => {
    const stream = new Readable({
      read(): void {
        this.push('{"type":"test","value":5}\n');
        this.push('{"incomplete":');
        this.push(null);
      },
    });
    const emitter = new StreamEventEmitter<TestData>(stream, createJsonLineParser());
    const results: TestData[] = [];
    const errors: Error[] = [];
    emitter.on('data', (data: TestData) => {
      results.push(data);
    });
    emitter.on('error', (error: Error) => {
      errors.push(error);
    });
    emitter.on('end', () => {
      expect(results).toEqual([{ type: 'test', value: 5 }]);
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Incomplete data at end of stream');
      done();
    });
  });

  it('should handle empty stream', (done) => {
    const stream = new Readable({
      read(): void {
        this.push(null);
      },
    });
    const emitter = new StreamEventEmitter<TestData>(stream, createJsonLineParser());
    const results: TestData[] = [];
    emitter.on('data', (data: TestData) => {
      results.push(data);
    });
    emitter.on('end', () => {
      expect(results).toEqual([]);
      done();
    });
  });

  it('should forward stream errors', (done) => {
    const stream = new Readable({
      read(): void {
        this.emit('error', new Error('Stream error'));
      },
    });
    const emitter = new StreamEventEmitter<TestData>(stream, createJsonLineParser());
    emitter.on('error', (error: Error) => {
      expect(error.message).toBe('Stream error');
      done();
    });
  });
});
