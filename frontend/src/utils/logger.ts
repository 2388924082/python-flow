import log from 'loglevel';

const LOG_PREFIX = '[Workflow]';

log.setLevel(log.levels.DEBUG);

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    log.debug(`${LOG_PREFIX} ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    log.info(`${LOG_PREFIX} ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    log.warn(`${LOG_PREFIX} ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    log.error(`${LOG_PREFIX} ${message}`, ...args);
  },
};

export default logger;
