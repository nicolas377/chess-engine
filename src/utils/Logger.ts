enum LogLevel {
  FATAL = "FATAL",
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
  DEBUG = "DEBUG",
  TRACE = "TRACE",
}

type LevelCompareType = ">=" | "<=" | "=" | ">" | "<";

class Logger {
  private static _level: LogLevel = LogLevel.WARNING;

  public static set level(level: LogLevel) {
    Logger._level = level;
  }

  /**
   * Compares two levels against each other in the manner specified.
   *
   * @param left The level to compare on the left-side of the comparison operator.
   * @param right The level to compare on the right-side of the comparison operator.
   * @param comparisonType The comparison operator to use.
   */
  private static levelCompare(
    left: LogLevel,
    right: LogLevel,
    comparisonType: LevelCompareType
  ): boolean {
    const allLevelsInOrder: LogLevel[] = [
      LogLevel.FATAL,
      LogLevel.ERROR,
      LogLevel.WARNING,
      LogLevel.INFO,
      LogLevel.DEBUG,
      LogLevel.TRACE,
    ];

    const leftIndex = allLevelsInOrder.indexOf(left);
    const rightIndex = allLevelsInOrder.indexOf(right);

    switch (comparisonType) {
      case ">=":
        return leftIndex >= rightIndex;
      case "<=":
        return leftIndex <= rightIndex;
      case "=":
        return leftIndex === rightIndex;
      case ">":
        return leftIndex > rightIndex;
      case "<":
        return leftIndex < rightIndex;
    }
  }

  private static outputLog(log: string): void {
    console.log(log);
  }

  private static getTimestamp(): string {
    return `${Date.now()}`;
  }

  public static trace(message: string): void {
    if (Logger.levelCompare(Logger._level, LogLevel.TRACE, ">=")) {
      Logger.outputLog(`${Logger.getTimestamp()} [TRACE] ${message}`);
    }
  }

  public static debug(message: string): void {
    if (Logger.levelCompare(Logger._level, LogLevel.DEBUG, ">=")) {
      Logger.outputLog(`${Logger.getTimestamp()} [DEBUG] ${message}`);
    }
  }

  public static info(message: string): void {
    if (Logger.levelCompare(Logger._level, LogLevel.INFO, ">=")) {
      Logger.outputLog(`${Logger.getTimestamp()} [INFO] ${message}`);
    }
  }

  public static warning(message: string): void {
    if (Logger.levelCompare(Logger._level, LogLevel.WARNING, ">=")) {
      Logger.outputLog(`${Logger.getTimestamp()} [WARNING] ${message}`);
    }
  }

  public static error(message: string): void {
    if (Logger.levelCompare(Logger._level, LogLevel.ERROR, ">=")) {
      Logger.outputLog(`${Logger.getTimestamp()} [ERROR] ${message}`);
    }
  }
}

const setLogLevel = (level: LogLevel): void => {
  Logger.level = level;
};

const logTrace = (message: string): void => {
  Logger.trace(message);
};

const logDebug = (message: string): void => {
  Logger.debug(message);
};

const logInfo = (message: string): void => {
  Logger.info(message);
};

const logWarning = (message: string): void => {
  Logger.warning(message);
};

const logError = (message: string): void => {
  Logger.error(message);
};

export {
  LogLevel,
  logTrace,
  logDebug,
  logInfo,
  logWarning,
  logError,
  setLogLevel,
};
