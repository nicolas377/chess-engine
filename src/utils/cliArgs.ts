import { argv as processArgv } from "node:process";
import { version } from "../../package.json";
import {
  logInfo,
  logTrace,
  logWarning,
  outputToConsole,
  wrapWithQuotes,
} from "./Debug";
import { ArgumentParseError, ValidationError } from "./errors";
import { ArrayAt, ArrayIncludes, ObjectEntries } from "./helpers";
import { Arguments, DebugLevel } from "types";

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
    DebugLevel
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
  readonly logLevel: string;
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

  const message: string = ObjectEntries(ArgumentTriggers)
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
  for (const [argument, triggers] of ObjectEntries<
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

  const flagValue: string | undefined = ArrayAt(rawArgs, flagValueIndex);
  let contextValue: string | undefined;

  if (flagValue?.includes("=")) {
    // strip wrapping quotes when present
    if (flagValue?.startsWith('"') && flagValue.endsWith('"'))
      contextValue = flagValue?.slice(1, -1);
    else contextValue = ArrayAt(flagValue.split("="), 1);
  } else {
    contextValue = ArrayAt(rawArgs, flagValueIndex + 1);
    if (contextValue !== undefined) addSkippedIndex(flagValueIndex + 1);
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

  for (const [index, _value] of rawArgs.entries()) {
    if (indexShouldBeSkipped(index)) continue;

    // support for --flag=value
    const flag: string = _value.includes("=")
      ? ArrayAt(_value.split("="), 0) ?? ""
      : _value;
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
    if (argTokenTypes.has(argToken.type)) {
      throwError(new ValidationError("Duplicate argument found"));
    }

    argTokenTypes.add(argToken.type);

    switch (argToken.type) {
      case Arguments.LOG_LEVEL: {
        const rawContextValue: string | undefined = argToken.contextValue?.data;

        if (rawContextValue === undefined)
          throwError(
            new ValidationError(
              "Context value for log level flag not specified."
            )
          );

        if (
          !ArrayIncludes(
            Object.values(DebugLevel),
            rawContextValue.toUpperCase()
          )
        )
          throwError(
            new ValidationError(
              `Provided log level ${rawContextValue} is not a defined log level.`
            )
          );
      }
    }
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

    // setting options
    for (const argToken of argTokens) {
      switch (argToken.type) {
        case Arguments.VERSION:
          this.version = true;
          break;
        case Arguments.HELP:
          this.help = true;
          break;
        case Arguments.DEBUG:
          this.debug = true;
          break;
        case Arguments.LOG_LEVEL:
          this.logLevel =
            // we already validated the argTokens, so this should be safe
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            argToken.contextValue!.data!.toUpperCase() as DebugLevel;
      }
    }
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
