import pino from 'pino';

export type LoggerStreamDestination = {
    write: (msg: string) => void;
};

export type LoggerOptions = {
    loggerInstance?: pino.Logger;
    logger?: pino.LoggerOptions & { stream?: LoggerStreamDestination };
};

const noop = () => {};

const nullLogger = {
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
    child: () => nullLogger
};

const LoggerCreate = (options: LoggerOptions) => {
    // Return a basic logger implementation
    if (options.loggerInstance) return options.loggerInstance;
    if (options.logger) {
        const logger = options.logger;
        if (!logger.formatters || !logger.formatters.level) {
            // if not defined, level will return level label instead of number
            // to be compatible with Loki
            logger.formatters = {
                level(label: string) {
                    return { level: label };
                }
            };
        }
        return pino(options.logger, options.logger.stream);
    }
    return nullLogger;
};

export default LoggerCreate;
