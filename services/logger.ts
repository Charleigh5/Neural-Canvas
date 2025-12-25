/**
 * Centralized Logger Utility
 *
 * Purpose: Structured logging with severity levels, component context,
 * and extensibility for telemetry services (Sentry, LogRocket, etc.)
 *
 * Usage:
 *   import { logger } from '@/services/logger';
 *   logger.info('ComponentName', 'Action description', { contextData });
 *   logger.error('ComponentName', 'Error description', { error, additionalContext });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
}

interface PerformanceMark {
  name: string;
  startTime: number;
}

// Environment detection (Vite-compatible)
const importMeta = import.meta as unknown as { env?: { DEV?: boolean; MODE?: string } };
const isDev = importMeta.env?.DEV ?? process.env.NODE_ENV !== 'production';
const isTest = importMeta.env?.MODE === 'test' || process.env.NODE_ENV === 'test';

// Log level priority (lower = more verbose)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const MIN_LEVEL: LogLevel = isDev ? 'debug' : 'warn';

class Logger {
  private performanceMarks: Map<string, PerformanceMark> = new Map();
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    component: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    // Skip if below minimum level (except in test mode where we silence all)
    if (isTest) return;
    if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      context,
    };

    // Capture stack trace for errors
    if (level === 'error' && context?.error instanceof Error) {
      entry.stack = context.error.stack;
    }

    // Store in history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Console output with styling
    const styles = this.getStyles(level);
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${component}]`;

    switch (level) {
      case 'debug':
        console.debug(`%c${prefix}`, styles, message, context ?? '');
        break;
      case 'info':
        console.debug(`%c${prefix}`, styles, message, context ?? '');
        break;
      case 'warn':
        console.warn(`%c${prefix}`, styles, message, context ?? '');
        break;
      case 'error':
        console.error(`%c${prefix}`, styles, message, context ?? '');
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }

    // Telemetry hook - extend here for Sentry, LogRocket, etc.
    this.sendToTelemetry(entry);
  }

  private getStyles(level: LogLevel): string {
    const baseStyle = 'font-weight: bold; padding: 2px 4px; border-radius: 2px;';
    switch (level) {
      case 'debug':
        return `${baseStyle} background: #6366f1; color: white;`;
      case 'info':
        return `${baseStyle} background: #22c55e; color: white;`;
      case 'warn':
        return `${baseStyle} background: #f59e0b; color: black;`;
      case 'error':
        return `${baseStyle} background: #ef4444; color: white;`;
    }
  }

  /**
   * Telemetry integration point
   * Extend this method to send logs to external services
   */
  private sendToTelemetry(entry: LogEntry): void {
    // Future integration points:
    // - Sentry: Sentry.captureMessage() or Sentry.captureException()
    // - LogRocket: LogRocket.log() or LogRocket.error()
    // - OpenTelemetry: span.addEvent()
    // - Custom backend: fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })

    // For now, just store in sessionStorage for debugging
    if (typeof window !== 'undefined' && entry.level === 'error') {
      try {
        const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
        errors.push(entry);
        sessionStorage.setItem('app_errors', JSON.stringify(errors.slice(-50)));
      } catch {
        // Silently fail if sessionStorage is unavailable
      }
    }
  }

  // Public logging methods
  debug(component: string, message: string, context?: Record<string, unknown>): void {
    this.log('debug', component, message, context);
  }

  info(component: string, message: string, context?: Record<string, unknown>): void {
    this.log('info', component, message, context);
  }

  warn(component: string, message: string, context?: Record<string, unknown>): void {
    this.log('warn', component, message, context);
  }

  error(component: string, message: string, context?: Record<string, unknown>): void {
    this.log('error', component, message, context);
  }

  /**
   * Performance timing utilities
   */
  perf(name: string, action: 'start' | 'end'): void {
    if (action === 'start') {
      this.performanceMarks.set(name, {
        name,
        startTime: performance.now(),
      });
    } else {
      const mark = this.performanceMarks.get(name);
      if (mark) {
        const duration = performance.now() - mark.startTime;
        this.debug('Performance', `${name} completed`, { durationMs: duration.toFixed(2) });
        this.performanceMarks.delete(name);
      }
    }
  }

  /**
   * Get recent log history (useful for debugging)
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Get error history from session storage
   */
  getSessionErrors(): LogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(sessionStorage.getItem('app_errors') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('app_errors');
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for consumers
export type { LogLevel, LogEntry };
