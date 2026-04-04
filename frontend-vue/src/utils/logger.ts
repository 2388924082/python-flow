export function log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`

  switch (level) {
    case 'debug':
      console.debug(logMessage)
      break
    case 'info':
      console.info(logMessage)
      break
    case 'warn':
      console.warn(logMessage)
      break
    case 'error':
      console.error(logMessage)
      break
  }
}

export const logger = {
  debug: (message: string) => log('debug', message),
  info: (message: string) => log('info', message),
  warn: (message: string) => log('warn', message),
  error: (message: string) => log('error', message)
}
