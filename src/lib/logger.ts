type LogLevel = "debug" | "info" | "warn" | "error"

interface LoggerOptions {
  level: LogLevel
  prefix?: string
}

class Logger {
  private level: LogLevel
  private prefix: string
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  constructor(options: LoggerOptions) {
    this.level = options.level
    this.prefix = options.prefix || ""
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level]
  }

  private formatMessage(message: string): string {
    return this.prefix ? `[${this.prefix}] ${message}` : message
  }

  private formatData(data?: any): any {
    if (!data) return undefined

    // Handle Error objects
    if (data instanceof Error) {
      return {
        ...data,
        message: data.message,
        name: data.name,
        stack: data.stack,
      }
    }

    return data
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage(message), this.formatData(data))
    }
  }

  info(message: string, data?: any, p0?: string, email?: any): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage(message), this.formatData(data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage(message), this.formatData(data))
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage(message), this.formatData(data))
    }
  }
}

// Get log level from environment variable or default to 'info'
const logLevel = (process.env.LOG_LEVEL as LogLevel) || "info"

export const logger = new Logger({ level: logLevel, prefix: "Autlify" })
