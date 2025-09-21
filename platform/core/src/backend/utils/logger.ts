/**
 * Logger utility for the platform
 */

export interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error';
  timestamp: string;
  module: string;
  message: string;
  meta?: any;
}

export class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  private log(level: LogLevel['level'], message: string, meta?: any): void {
    const logEntry: LogLevel = {
      level,
      timestamp: new Date().toISOString(),
      module: this.module,
      message,
      meta
    };

    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      const colorMap = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m'  // Red
      };
      
      const resetColor = '\x1b[0m';
      const color = colorMap[level];
      
      console.log(
        `${color}[${logEntry.timestamp}] ${level.toUpperCase()} [${this.module}]${resetColor} ${message}`,
        meta ? meta : ''
      );
    }

    // In production, you would send to a logging service
    // For now, we'll just use console
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    }
  }
}