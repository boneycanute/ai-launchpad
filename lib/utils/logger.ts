import fs from 'fs';
import path from 'path';

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(prefix: string = 'vectordb'): string {
    const date = new Date();
    const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
    return path.join(this.logDir, `${prefix}_${timestamp}.log`);
  }

  initializeLog(agentId: string) {
    this.logFile = this.getLogFileName(`vectordb_${agentId}`);
    this.info('=== Vector DB Creation Process Started ===');
    return this.logFile;
  }

  private writeLog(level: string, message: string, data?: any) {
    if (!this.logFile) {
      console.error('Logger not initialized! Call initializeLog first.');
      return;
    }

    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      if (typeof data === 'object') {
        logMessage += '\n' + JSON.stringify(data, null, 2);
      } else {
        logMessage += ' ' + data;
      }
    }

    logMessage += '\n';

    // Write to file
    fs.appendFileSync(this.logFile, logMessage);
    
    // Also log to console for development
    console.log(logMessage);
  }

  info(message: string, data?: any) {
    this.writeLog('INFO', message, data);
  }

  error(message: string, error?: any) {
    this.writeLog('ERROR', message, error);
  }

  debug(message: string, data?: any) {
    this.writeLog('DEBUG', message, data);
  }

  warn(message: string, data?: any) {
    this.writeLog('WARN', message, data);
  }
}

// Export a singleton instance
export const logger = new Logger();
