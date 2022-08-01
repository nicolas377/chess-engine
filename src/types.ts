export const enum Arguments {
  CONTEXT_VALUE,
  VERSION,
  HELP,
  DEBUG,
  LOG_LEVEL,
}

// Warning: the values of the enum must be the same as the string values of the enum
export enum DebugLevel {
  FATAL = "FATAL",
  ERROR = "ERROR",
  WARNING = "WARNING",
  OUTPUT = "OUTPUT",
  INFO = "INFO",
  DEBUG = "DEBUG",
  TRACE = "TRACE",
}
