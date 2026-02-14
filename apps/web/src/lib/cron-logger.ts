/**
 * Cron-specific logger
 * 
 * Always logs for monitoring purposes (even in production)
 * Structured logging for better observability
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'

interface CronLogEntry {
  timestamp: string
  level: LogLevel
  jobName: string
  message: string
  data?: any
}

class CronLogger {
  private jobName: string
  
  constructor(jobName: string) {
    this.jobName = jobName
  }
  
  private log(level: LogLevel, message: string, data?: any) {
    const entry: CronLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      jobName: this.jobName,
      message,
      data,
    }
    
    // Structured logging (can be ingested by log aggregators)
    if (data) {
      console.log(JSON.stringify(entry))
    } else {
      console.log(JSON.stringify(entry))
    }
  }
  
  info(message: string, data?: any) {
    this.log('INFO', message, data)
  }
  
  success(message: string, data?: any) {
    this.log('SUCCESS', message, data)
  }
  
  warn(message: string, data?: any) {
    this.log('WARN', message, data)
  }
  
  error(message: string, error?: Error | any) {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error
    
    this.log('ERROR', message, errorData)
  }
}

export function createCronLogger(jobName: string): CronLogger {
  return new CronLogger(jobName)
}
