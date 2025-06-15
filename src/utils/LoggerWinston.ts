import winston from "winston";

import { Logger } from "./Logger";

// Winston reserved fields that need special handling
const WINSTON_RESERVED_FIELDS = ['message', 'level', 'timestamp', 'stack'] as const;
type WinstonReservedField = typeof WINSTON_RESERVED_FIELDS[number];

export class LoggerWinston implements Logger {
  constructor(private logger: winston.Logger) { }

  private sanitizeMetadata(meta: unknown): unknown {
    if (!meta || typeof meta !== 'object' || meta === null) return meta;
    // Handle arrays by returning them as-is
    if (Array.isArray(meta)) return meta;
    // Handle Error objects specially
    if (meta instanceof Error) {
      return {
        message: meta.message,
        stack: meta.stack,
        name: meta.name,
        ...Object.getOwnPropertyNames(meta).reduce((acc, key) => {
          if (!['message', 'stack', 'name'].includes(key)) {
            acc[key] = (meta as unknown as Record<string, unknown>)[key];
          }
          return acc;
        }, {} as Record<string, unknown>),
      };
    }

    const metaObj = meta as Record<string, unknown>;

    // Check if any reserved fields exist at the top level
    const hasReservedFields = WINSTON_RESERVED_FIELDS.some(field => field in metaObj);
    if (!hasReservedFields) return metaObj;

    // Wrap objects with reserved field names under a 'data' property
    const sanitized: Record<string, unknown> = {};
    let hasOtherFields = false;

    for (const [key, value] of Object.entries(metaObj)) {
      if (WINSTON_RESERVED_FIELDS.includes(key as WinstonReservedField)) {
        sanitized.data ??= {};
        (sanitized.data as Record<string, unknown>)[key] = value;
      } else {
        sanitized[key] = value;
        hasOtherFields = true;
      }
    }

    // If only reserved fields were present, return data directly
    if (!hasOtherFields && sanitized.data) {
      return { data: sanitized.data };
    }
    return sanitized;
  }

  private combineMetadata(...meta: unknown[]): Record<string, unknown> | undefined {
    if (meta.length === 0) return undefined;

    const combined: Record<string, unknown> = {};
    const reservedFieldsData: Record<string, unknown> = {};
    let dataIndex = 0;

    for (const item of meta) {
      const sanitized = this.sanitizeMetadata(item);

      if (sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)) {
        const sanitizedObj = sanitized;

        // Extract 'data' fields that contain reserved fields
        if ('data' in sanitizedObj) {
          Object.assign(reservedFieldsData, sanitizedObj.data);
          delete sanitizedObj.data;
        }

        Object.assign(combined, sanitizedObj);
      } else if (sanitized !== undefined) {
        combined[`meta${dataIndex++}`] = sanitized;
      }
    }

    // Add reserved fields data if any exist
    if (Object.keys(reservedFieldsData).length > 0) {
      combined.data = reservedFieldsData;
    }

    return Object.keys(combined).length > 0 ? combined : undefined;
  }

  debug(message: string, ...meta: unknown[]): void {
    const combinedMeta = this.combineMetadata(...meta);
    if (combinedMeta) {
      this.logger.debug(message, combinedMeta);
    } else {
      this.logger.debug(message);
    }
  }

  info(message: string, ...meta: unknown[]): void {
    const combinedMeta = this.combineMetadata(...meta);
    if (combinedMeta) {
      this.logger.info(message, combinedMeta);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, ...meta: unknown[]): void {
    const combinedMeta = this.combineMetadata(...meta);
    if (combinedMeta) {
      this.logger.warn(message, combinedMeta);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, ...meta: unknown[]): void {
    const combinedMeta = this.combineMetadata(...meta);
    if (combinedMeta) {
      this.logger.error(message, combinedMeta);
    } else {
      this.logger.error(message);
    }
  }
}
