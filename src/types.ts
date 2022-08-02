export const enum Arguments {
  CONTEXT_VALUE,
  VERSION,
  HELP,
  DEBUG,
  LOG_LEVEL,
}

export const enum ErrorCodes {
  VALIDATION_ERROR = "0001",
  ARGUMENT_PARSE_ERROR = "0002",
  GRACEFUL_EXIT = "9998",
  GENERAL = "9999",
}

// The values of the enum must be the same as the string values of the enum.
export enum DebugLevel {
  FATAL = "FATAL",
  WARNING = "WARNING",
  OUTPUT = "OUTPUT",
  INFO = "INFO",
  TRACE = "TRACE",
}

export type Promisable<T> = T | Promise<T>;
