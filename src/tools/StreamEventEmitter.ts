import { EventEmitter } from 'events';
import { Readable } from 'stream';

export type StreamParseResult<E> =
  | { kind: 'success', value: E, consume: number }
  | { kind: 'waiting' }
  | { kind: 'error', message: string, consume: number };

export type StreamParser<E> = (buffer: Buffer) => StreamParseResult<E>;

export class StreamEventEmitter<E> extends EventEmitter {
  private buffer: Buffer = Buffer.alloc(0);

  constructor(stream: Readable, parser: StreamParser<E>) {
    super();
    stream.on('data', (chunk: Buffer) => this.handleData(chunk, parser));
    stream.on('end', () => this.handleEnd(parser));
    stream.on('error', (error: Error) => this.emit('error', error));
  }

  private handleData(chunk: Buffer, parser: StreamParser<E>) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.processBuffer(parser);
  }

  private handleEnd(parser: StreamParser<E>) {
    this.processBuffer(parser, true);
    this.emit('end');
  }

  private processBuffer(parser: StreamParser<E>, endOfStream = false) {
    while (this.buffer.length > 0) {
      const result = parser(this.buffer);
      if (result.kind === 'success') {
        this.emit('data', result.value);
        this.buffer = this.buffer.subarray(result.consume);
      } else if (result.kind === 'error') {
        this.emit('error', new Error(result.message));
        this.buffer = this.buffer.subarray(result.consume);
      } else if (result.kind === 'waiting') {
        if (endOfStream && this.buffer.length > 0) {
          this.emit('error', new Error('Incomplete data at end of stream'));
        }
        break;
      }
    }
  }
}
