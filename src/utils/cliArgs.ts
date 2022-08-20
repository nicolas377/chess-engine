import { argv as processArgv } from "node:process";
import { version } from "../../package.json";
import { Arguments, DebugLevel, logLevelNames } from "types";
import {
  ArgumentParseError,
  arrayAtIndex,
  arrayIncludesValue,
  entriesOfObject,
  keysOfObject,
  logInfo,
  logTrace,
  logWarning,
  outputToConsole,
  stringifyMessage,
  ValidationError,
  wrapWithQuotes,
} from "utils";

type ArgumentsWithoutContext = Exclude<Arguments, Arguments.CONTEXT_VALUE>;

const ArgumentTriggers: Record<ArgumentsWithoutContext, string[]> = {
  [Arguments.VERSION]: ["--version", "-v"],
  [Arguments.HELP]: ["--help", "-h"],
  [Arguments.DEBUG]: ["--debug"],
  [Arguments.LOG_LEVEL]: ["--log-level"],
};

const ArgumentDescriptions: Record<ArgumentsWithoutContext, string> = {
  [Arguments.VERSION]: "Prints the version of the engine.",
  [Arguments.HELP]: "Prints this help message.",
  [Arguments.DEBUG]: "Enables debug mode.",
  [Arguments.LOG_LEVEL]: `Sets the level at which logs are included in the log file. Any of ${Object.values(
    logLevelNames
  ).join(", ")}.`,
};

type ArgToken<T extends Arguments> = T extends Arguments.CONTEXT_VALUE
  ? { type: T; data: string }
  : {
      type: T;
      contextValue?: ArgToken<Arguments.CONTEXT_VALUE>;
    };

type TopLevelArgToken = ArgToken<ArgumentsWithoutContext>;

interface ConfigOptions {
  readonly version: boolean;
  readonly help: boolean;
  readonly debug: boolean;
  readonly logLevel: DebugLevel;
}

function throwError(error: { throw(): never }): never {
  cliArgsHadError = true;
  error.throw();
}

function logVersion(): void {
  outputToConsole(`Engine v${version}`);
}

function logHelp(): void {
  const newLine = "\n";

  const message: string = entriesOfObject(ArgumentTriggers)
    .reduce<string>(
      (acc, [arg, triggers]: [ArgumentsWithoutContext, string[]]) => {
        const description: string = ArgumentDescriptions[arg];

        return acc + `  ${triggers.join(", ")}: ${description}${newLine}`;
      },
      "Usage: engine [options]" + newLine + "Options:" + newLine
    )
    .trim();

  logVersion();
  outputToConsole(message);
}

function parseRawFlag(flag: string): ArgumentsWithoutContext | undefined {
  logInfo("Parsing raw flag", wrapWithQuotes(flag), "to argument type");
  // Implementation note: Any object's keys are always converted to strings.
  // Because of that, we have to convert back to the numeric enum value.
  for (const [argument, triggers] of entriesOfObject<
    `${ArgumentsWithoutContext}`,
    string[]
  >(ArgumentTriggers)) {
    if (triggers.includes(flag)) {
      logTrace("Found raw flag in triggers of argument", argument);
      return +argument;
    }
  }
  logWarning(undefined, "Raw flag", flag, "isn't parsable");
}

function getContextValue(
  rawArgs: readonly string[],
  flagValueIndex: number,
  addSkippedIndex: (index: number) => void
): string {
  logInfo(
    "Getting context value from index",
    flagValueIndex,
    "on arguments",
    rawArgs
  );

  const flagValue: string | undefined = arrayAtIndex(rawArgs, flagValueIndex);
  let contextValue: string | undefined;

  if (flagValue === undefined) {
    throwError(
      new ArgumentParseError(
        stringifyMessage([
          "Flag value index",
          flagValueIndex,
          "is out of bounds for arguments",
          rawArgs,
        ])
      )
    );
  }

  if (flagValue.includes("=")) {
    logTrace(
      "Flag value contains context value inside of the flag (--flag=value)"
    );
    // strip wrapping quotes when present
    if (flagValue.startsWith('"') && flagValue.endsWith('"'))
      contextValue = flagValue.slice(1, -1);
    else contextValue = arrayAtIndex(flagValue.split("="), 1);
  } else {
    logTrace(
      "Flag value doesn't contain context value (--flag value), checking next argument"
    );
    contextValue = arrayAtIndex(rawArgs, flagValueIndex + 1);
    if (contextValue) addSkippedIndex(flagValueIndex + 1);
  }

  if (contextValue === undefined)
    throwError(
      new ArgumentParseError("Missing context value where one was expected")
    );

  return contextValue;
}

function parseArgTokens(rawArgs: readonly string[]): TopLevelArgToken[] {
  logInfo("Parsing arguments", rawArgs);

  const { addSkippedIndex, indexShouldBeSkipped } = (() => {
    const skippedIndices = new Set<number>();

    return {
      addSkippedIndex(index: number): void {
        logInfo("Adding skipped index", index);
        skippedIndices.add(index);
      },
      indexShouldBeSkipped(index: number): boolean {
        logInfo("Checking if index", index, "should be skipped");
        const shouldBeSkipped = skippedIndices.has(index);

        if (shouldBeSkipped)
          logTrace(
            "Index",
            index,
            "should be skipped, it is in the skipped indices set"
          );
        else
          logTrace(
            "Index",
            index,
            "should not be skipped, it is not in the skipped indices set"
          );

        return shouldBeSkipped;
      },
    };
  })();

  const allArgTokens: TopLevelArgToken[] = [];

  for (const [index, rawArgDoNotUseOutsideOfFlag] of rawArgs.entries()) {
    if (indexShouldBeSkipped(index)) continue;

    // support for --flag=value
    const flag: string = rawArgDoNotUseOutsideOfFlag.includes("=")
      ? arrayAtIndex(rawArgDoNotUseOutsideOfFlag.split("="), 0) ?? ""
      : rawArgDoNotUseOutsideOfFlag;
    const arg: Arguments | "UNKNOWN" = parseRawFlag(flag) ?? "UNKNOWN";

    logTrace(
      "Attempting to parse numeric flag",
      typeof arg === "string" ? wrapWithQuotes(arg) : arg,
      "to flag info"
    );
    switch (arg) {
      case "UNKNOWN":
        logTrace("Unknown flag found, skipping index", index);
        break;
      case Arguments.HELP:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Help argument parsed");
        break;
      case Arguments.VERSION:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Version argument parsed");
        break;
      case Arguments.DEBUG:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Debug argument parsed");
        break;
      case Arguments.LOG_LEVEL: {
        const contextValue = getContextValue(rawArgs, index, addSkippedIndex);
        allArgTokens.push({
          type: arg,
          contextValue: {
            type: Arguments.CONTEXT_VALUE,
            data: contextValue,
          },
        });
        logTrace(
          "Log level argument parsed with context value",
          wrapWithQuotes(contextValue)
        );
        break;
      }
    }
  }

  logTrace("Returning tokens:", allArgTokens);
  return allArgTokens;
}

function validateArgTokens(argTokens: TopLevelArgToken[]): void {
  logInfo("Validating arg tokens", argTokens);

  const argTokenTypes = new Set<Arguments>();

  for (const argToken of argTokens) {
    logTrace("Validating arg token", argToken);

    logTrace(
      "Checking if arg token type",
      argToken.type,
      "is unique in all tokens"
    );
    if (argTokenTypes.has(argToken.type)) {
      logTrace("Arg token type is not unique, throwing error");
      throwError(new ValidationError("Duplicate argument found"));
    }

    logTrace("Arg token type is unique, adding to set of arg token types");
    argTokenTypes.add(argToken.type);

    logTrace("Validating arg token specific to its type");
    switch (argToken.type) {
      case Arguments.LOG_LEVEL: {
        const rawContextValue: string | undefined = argToken.contextValue?.data;

        logTrace(
          "Argument is log level, checking context value",
          rawContextValue
        );
        logTrace("Checking that context value is defined");
        if (rawContextValue === undefined) {
          logTrace("Context value is undefined, throwing error");
          throwError(
            new ValidationError(
              "Context value for log level flag not specified."
            )
          );
        }

        logTrace(
          "Context value is defined, checking that it is a valid log level"
        );
        if (
          !arrayIncludesValue(
            Object.values(logLevelNames),
            rawContextValue.toUpperCase()
          )
        ) {
          logTrace("Context value is not a valid log level, throwing error");
          throwError(
            new ValidationError(
              `Provided log level ${rawContextValue} is not a defined log level.`
            )
          );
        }
      }
    }

    logTrace("Arg token validated");
  }
}

export let cliArgsHadError = false;

class MainCliArguments implements ConfigOptions {
  public readonly version: boolean = false;
  public readonly help: boolean = false;
  public readonly debug: boolean = false;
  public readonly logLevel: DebugLevel = DebugLevel.TRACE;

  constructor() {
    const argTokens: TopLevelArgToken[] = parseArgTokens(processArgv.slice(2));
    validateArgTokens(argTokens);

    logTrace("Processing all arg tokens");
    // setting options
    for (const argToken of argTokens) {
      logTrace("Processing arg token", argToken);
      switch (argToken.type) {
        case Arguments.VERSION:
          logTrace("Setting version option");
          this.version = true;
          break;
        case Arguments.HELP:
          logTrace("Setting help option");
          this.help = true;
          break;
        case Arguments.DEBUG:
          logTrace("Setting debug option");
          this.debug = true;
          break;
        case Arguments.LOG_LEVEL:
          logTrace("Setting log level option to", argToken.contextValue?.data);
          this.logLevel =
            keysOfObject(logLevelNames).find(
              (key) =>
                logLevelNames[key] ===
                argToken.contextValue?.data?.toUpperCase()
            ) ??
            throwError(
              new ArgumentParseError(
                stringifyMessage([
                  "An invalid log level slipped past validation, raw level was:",
                  argToken.contextValue?.data,
                ])
              )
            );
      }
    }

    logTrace("Processing all arg tokens completed");
    logInfo("cliArgs constructed");
  }
}

let _cliArgs: MainCliArguments | undefined;

function cliArgs(): MainCliArguments {
  logInfo("Attempting to load CLI arguments from cache");
  if (_cliArgs === undefined) {
    logTrace("No CLI arguments cache found, creating new instance");
    _cliArgs = new MainCliArguments();
  } else {
    logTrace("Cache hit: using existing CLI arguments instance");
  }

  return _cliArgs;
}

export { logVersion, logHelp, cliArgs };
