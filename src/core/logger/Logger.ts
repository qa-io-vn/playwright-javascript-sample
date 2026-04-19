/**
 * Simple structured Logger (can be swapped for pino/winston).
 * Adheres to DIP: consumers depend on the ILogger abstraction, not a concrete implementation.
 */
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export class ConsoleLogger implements ILogger {
  constructor(private readonly scope = 'TEST') {}

  private format(level: string, message: string, meta?: Record<string, unknown>): string {
    const ts = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] [${level}] [${this.scope}] ${message}${metaStr}`;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.format('INFO', message, meta));
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.format('WARN', message, meta));
  }
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.format('ERROR', message, meta));
  }
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.DEBUG) console.debug(this.format('DEBUG', message, meta));
  }
}

export const logger: ILogger = new ConsoleLogger();
