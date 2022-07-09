export const enum DebugLevel {
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
  DEBUG = "DEBUG",
  TRACE = "TRACE",
}

type LevelCompareType = ">=" | "<=" | "=" | ">" | "<";

export class Debug {
  private static _logFile: string | undefined;
  private static _level: DebugLevel = DebugLevel.DEBUG;

  public static setLogFile(logFile: string): void {
    Debug._logFile = logFile;
  }
  public static setLevel(level: DebugLevel) {
    Debug._level = level;
  }

  /**
   * Compares two levels against each other in the manner specified.
   *
   * @param left The level to compare on the left-side of the comparison operator.
   * @param right The level to compare on the right-side of the comparison operator.
   * @param comparisonType The comparison operator to use.
   */
  private static levelCompare(
    left: DebugLevel,
    right: DebugLevel,
    comparisonType: LevelCompareType
  ): boolean {
    const allLevelsInOrder: DebugLevel[] = [
      DebugLevel.ERROR,
      DebugLevel.WARNING,
      DebugLevel.INFO,
      DebugLevel.DEBUG,
      DebugLevel.TRACE,
    ];

    const leftIndex: number = allLevelsInOrder.indexOf(left);
    const rightIndex: number = allLevelsInOrder.indexOf(right);

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

  private static logHandler(message: string, level: DebugLevel): void {
    if (Debug.levelCompare(Debug._level, level, ">=")) {
      const timestamp = `${Date.now()}`;

      console.log(`${timestamp} [${level}]: ${message}`);
    }
  }

  public static trace(message: string): void {
    Debug.logHandler(message, DebugLevel.TRACE);
  }

  public static debug(message: string): void {
    Debug.logHandler(message, DebugLevel.DEBUG);
  }

  public static info(message: string): void {
    Debug.logHandler(message, DebugLevel.INFO);
  }

  public static warning(message: string): void {
    Debug.logHandler(message, DebugLevel.WARNING);
  }

  public static error(message: string): void {
    Debug.logHandler(message, DebugLevel.ERROR);
  }
}
